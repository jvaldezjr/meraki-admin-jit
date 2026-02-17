"""
Authentication Routes for SAML SSO with Duo

Uses token-based auth (no cookies): after SAML login the backend redirects with
a one-time code; the frontend exchanges it for a JWT and sends Authorization: Bearer
on all API calls. This avoids cross-origin cookie issues in modern browsers.
"""

import os
import logging
import secrets
import time
from urllib.parse import quote

import jwt
from flask import Blueprint, request, redirect, session, jsonify, url_for
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.utils import OneLogin_Saml2_Utils
from config.saml_settings import get_saml_settings, prepare_flask_request

# Create blueprint for auth routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)

# One-time codes for token exchange (code -> { user_data, expires_at })
# In production, use Redis or similar with TTL
_ONE_TIME_CODES = {}
_CODE_TTL_SECONDS = 60
_JWT_EXPIRY_SECONDS = int(os.getenv('JWT_EXPIRY_SECONDS', 43200))  # 12 hours default
_JWT_ALGORITHM = 'HS256'


def _safe_user(user_data):
    """Return user dict safe to send to client."""
    if not user_data:
        return {}
    return {
        'email': user_data.get('email'),
        'name': user_data.get('name'),
        'first_name': user_data.get('first_name'),
        'last_name': user_data.get('last_name'),
        'organization': user_data.get('organization'),
        'role': user_data.get('role'),
    }


def _user_from_request():
    """
    Resolve authenticated user from request: Bearer token first, then session.
    Returns (user_data_dict or None, error_response or None).
    """
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        try:
            payload = jwt.decode(
                token,
                os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
                algorithms=[_JWT_ALGORITHM],
            )
            return (_safe_user(payload), None)
        except jwt.ExpiredSignatureError:
            return (None, (jsonify({"error": "Token expired"}), 401))
        except jwt.InvalidTokenError:
            return (None, (jsonify({"error": "Invalid token"}), 401))
    if session.get('authenticated') and session.get('user'):
        return (_safe_user(session.get('user')), None)
    return (None, None)


@auth_bp.route('/saml/login')
def saml_login():
    """
    Initiate SAML SSO login flow.
    Redirects user to Duo for authentication.
    """
    try:
        req = prepare_flask_request(request)
        auth = OneLogin_Saml2_Auth(req, get_saml_settings())
        
        # Store the intended destination after login
        return_to = request.args.get('return_to', '/')
        session['saml_return_to'] = return_to
        
        # Get SAML login URL and redirect to Duo
        sso_url = auth.login()
        logger.info("Redirecting to Duo SSO for authentication")
        return redirect(sso_url)
        
    except Exception as e:
        logger.error(f"Error initiating SAML login: {str(e)}")
        return jsonify({"error": "Failed to initiate login"}), 500


@auth_bp.route('/saml/acs', methods=['POST'])
def saml_acs():
    """
    Assertion Consumer Service (ACS) endpoint.
    Receives and validates SAML assertion from Duo after successful authentication.
    """
    try:
        req = prepare_flask_request(request)
        auth = OneLogin_Saml2_Auth(req, get_saml_settings())
        
        # Process the SAML response
        auth.process_response()
        errors = auth.get_errors()
        
        if errors:
            logger.error(f"SAML authentication errors: {errors}")
            logger.error(f"Error reason: {auth.get_last_error_reason()}")
            return jsonify({
                "error": "SAML authentication failed",
                "details": errors
            }), 401
        
        # Check if authentication was successful
        if not auth.is_authenticated():
            logger.error("SAML authentication failed: User not authenticated")
            return jsonify({"error": "Authentication failed"}), 401
        
        # Get user attributes from SAML assertion
        attributes = auth.get_attributes()
        name_id = auth.get_nameid()
        
        logger.info(f"User authenticated successfully: {name_id}")
        logger.debug(f"SAML attributes received: {list(attributes.keys())}")
        
        # Extract user information from SAML attributes
        # Prefer displayName for full name (dropdown); firstName for header bar
        user_data = {
            'email': name_id,
            'name': _get_attribute(attributes, ['displayName', 'displayname', 'name', 'cn'], name_id),
            'first_name': _get_attribute(attributes, ['firstName', 'firstname', 'givenName', 'givenname'], ''),
            'last_name': _get_attribute(attributes, ['sn', 'surname', 'lastName', 'lastname'], ''),
            'organization': _get_attribute(attributes, ['organization', 'o', 'company'], ''),
            'role': _get_attribute(attributes, ['role', 'groups'], 'user'),
            'session_index': auth.get_session_index()
        }
        
        # Store in session for SAML SLO and optional cookie fallback
        session['authenticated'] = True
        session['user'] = user_data
        session['saml_session_index'] = auth.get_session_index()
        session['saml_name_id'] = auth.get_nameid()
        session.permanent = True

        logger.info(f"Session created for user: {user_data['email']}")

        # Issue one-time code for token exchange (no cookie needed)
        return_to = session.pop('saml_return_to', '/')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        code = secrets.token_urlsafe(32)
        _ONE_TIME_CODES[code] = {
            'user_data': user_data,
            'expires_at': time.time() + _CODE_TTL_SECONDS,
        }
        safe_return = quote(return_to, safe='')
        return redirect(f"{frontend_url}/auth/callback?code={code}&return_to={safe_return}")
        
    except Exception as e:
        logger.error(f"Error processing SAML assertion: {str(e)}", exc_info=True)
        return jsonify({"error": "Authentication processing failed"}), 500


@auth_bp.route('/saml/sls')
def saml_sls():
    """
    Single Logout Service (SLS) endpoint.
    Handles logout requests from Duo.
    """
    try:
        req = prepare_flask_request(request)
        auth = OneLogin_Saml2_Auth(req, get_saml_settings())
        
        # Process the logout request
        url = auth.process_slo(delete_session_cb=lambda: session.clear())
        errors = auth.get_errors()
        
        if errors:
            logger.error(f"SAML logout errors: {errors}")
        else:
            logger.info("User logged out via SAML SLS")
        
        # Redirect to frontend
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/login")
        
    except Exception as e:
        logger.error(f"Error processing SAML logout: {str(e)}")
        session.clear()
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/login")


@auth_bp.route('/token', methods=['POST'])
def exchange_code_for_token():
    """
    Exchange one-time code (from callback URL) for a JWT.
    No cookies; frontend stores the token and sends Authorization: Bearer.
    """
    data = request.get_json() or {}
    code = data.get('code')
    if not code:
        return jsonify({"error": "Missing code"}), 400
    entry = _ONE_TIME_CODES.pop(code, None)
    if not entry:
        return jsonify({"error": "Invalid or expired code"}), 401
    if time.time() > entry['expires_at']:
        return jsonify({"error": "Code expired"}), 401
    user_data = entry['user_data']
    safe = _safe_user(user_data)
    payload = {**safe, 'sub': user_data.get('email')}
    exp = int(time.time()) + _JWT_EXPIRY_SECONDS
    payload['exp'] = exp
    payload['iat'] = int(time.time())
    token = jwt.encode(
        payload,
        os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
        algorithm=_JWT_ALGORITHM,
    )
    return jsonify({
        'access_token': token,
        'user': safe,
        'expires_in': _JWT_EXPIRY_SECONDS,
    })


@auth_bp.route('/me')
def get_current_user():
    """
    Get current authenticated user (Bearer token or session).
    """
    user_data, err = _user_from_request()
    if err:
        return err
    if not user_data:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user_data)


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout. With Bearer token, client discards token (no server state).
    With session, clears session; optional SAML SLO.
    """
    try:
        user_data, _ = _user_from_request()
        email = (user_data or {}).get('email', 'unknown')

        # If authenticated via session, support SAML SLO
        use_saml_slo = request.json.get('saml_logout', False) if request.is_json else False
        if use_saml_slo and session.get('saml_session_index'):
            req = prepare_flask_request(request)
            auth = OneLogin_Saml2_Auth(req, get_saml_settings())
            name_id = session.get('saml_name_id')
            session_index = session.get('saml_session_index')
            session.clear()
            return jsonify({
                "message": "Logging out",
                "redirect_url": auth.logout(name_id=name_id, session_index=session_index),
            })
        session.clear()
        logger.info(f"User logged out: {email}")
        return jsonify({"message": "Logged out successfully"})
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        session.clear()
        return jsonify({"message": "Logged out"}), 200


@auth_bp.route('/metadata')
def metadata():
    """
    SAML metadata endpoint.
    Provides SP metadata for Duo configuration.
    """
    try:
        req = prepare_flask_request(request)
        auth = OneLogin_Saml2_Auth(req, get_saml_settings())
        settings = auth.get_settings()
        metadata = settings.get_sp_metadata()
        errors = settings.validate_metadata(metadata)
        
        if errors:
            logger.error(f"Metadata validation errors: {errors}")
            return jsonify({"error": "Invalid metadata", "details": errors}), 500
        
        return metadata, 200, {'Content-Type': 'text/xml'}
        
    except Exception as e:
        logger.error(f"Error generating metadata: {str(e)}")
        return jsonify({"error": "Failed to generate metadata"}), 500


def _get_attribute(attributes, keys, default=''):
    """
    Helper function to get SAML attribute by trying multiple keys.
    
    Args:
        attributes: Dictionary of SAML attributes
        keys: List of possible attribute names to try
        default: Default value if attribute not found
        
    Returns:
        Attribute value or default
    """
    for key in keys:
        if key in attributes and attributes[key]:
            value = attributes[key]
            # SAML attributes are usually lists
            return value[0] if isinstance(value, list) else value
    return default

