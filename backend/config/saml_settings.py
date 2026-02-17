"""
SAML Configuration for Duo SSO Integration

This module configures SAML settings for authentication with Duo Security.
It reads configuration from environment variables.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_saml_settings():
    """
    Get SAML configuration settings for python3-saml library.
    
    Returns:
        dict: SAML configuration dictionary
    """
    app_url = os.getenv('APP_URL', 'http://localhost:5001')
    
    settings = {
        # Strict mode - set to True in production
        "strict": os.getenv('FLASK_ENV') == 'production',
        
        # Debug mode - set to False in production
        "debug": os.getenv('FLASK_ENV') == 'development',
        
        # Service Provider (SP) Configuration - Your Application
        "sp": {
            "entityId": "urn:meraki-admin-jit:saml",
            
            # Assertion Consumer Service (ACS) endpoint
            "assertionConsumerService": {
                "url": f"{app_url}/api/auth/saml/acs",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            },
            
            # Single Logout Service (SLS) endpoint
            "singleLogoutService": {
                "url": f"{app_url}/api/auth/saml/sls",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            
            # NameID format
            "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
            
            # SP X.509 certificate and private key (optional, leave empty for now)
            "x509cert": "",
            "privateKey": ""
        },
        
        # Identity Provider (IdP) Configuration - Duo SSO
        "idp": {
            "entityId": os.getenv('DUO_ENTITY_ID', ''),
            
            # Single Sign-On Service
            "singleSignOnService": {
                "url": os.getenv('DUO_SSO_URL', ''),
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            
            # Single Logout Service
            "singleLogoutService": {
                "url": os.getenv('DUO_SLO_URL', ''),
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            
            # Duo's X.509 certificate for validating SAML assertions
            "x509cert": os.getenv('DUO_X509_CERT', '')
        },
        
        # Security settings
        "security": {
            "nameIdEncrypted": False,
            "authnRequestsSigned": False,
            "logoutRequestSigned": False,
            "logoutResponseSigned": False,
            "signMetadata": False,
            "wantMessagesSigned": True,
            "wantAssertionsSigned": True,
            "wantNameId": True,
            "wantNameIdEncrypted": False,
            "wantAssertionsEncrypted": False,
            "allowSingleLabelDomains": False,
            "signatureAlgorithm": "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
            "digestAlgorithm": "http://www.w3.org/2001/04/xmlenc#sha256",
            "rejectDeprecatedAlgorithm": True
        }
    }
    
    return settings


def prepare_flask_request(request):
    """
    Prepare Flask request data for python3-saml library.
    
    Args:
        request: Flask request object
        
    Returns:
        dict: Request data formatted for python3-saml
    """
    # Determine if we're using HTTPS
    url_scheme = request.scheme
    if request.headers.get('X-Forwarded-Proto') == 'https':
        url_scheme = 'https'
    
    return {
        'https': 'on' if url_scheme == 'https' else 'off',
        'http_host': request.host,
        'server_port': request.environ.get('SERVER_PORT', 443 if url_scheme == 'https' else 80),
        'script_name': request.path,
        'get_data': request.args.copy(),
        'post_data': request.form.copy(),
        'query_string': request.query_string.decode('utf-8')
    }

