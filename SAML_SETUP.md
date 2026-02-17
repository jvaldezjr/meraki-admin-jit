# SAML SSO with Duo Integration Guide

This guide explains how to set up SAML Single Sign-On (SSO) authentication with Duo Security for the Meraki Admin JIT application.

## Quick Start for Local Development

**TL;DR - Three Terminal Setup:**

```bash
# Terminal 1: Start ngrok (keep running, note the HTTPS URL)
ngrok http 5001

# Terminal 2: Start backend with ngrok URL in .env
# Update .env with: APP_URL=https://YOUR-NGROK-URL.ngrok-free.app
python app.py

# Terminal 3: Start React frontend
cd app && npm start
```

**Every time you restart ngrok:**
1. Note the new ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
2. Update Duo Admin Panel → Your SAML App → ACS URL to: `https://abc123.ngrok-free.app/api/auth/saml/acs`
3. Update `.env` file: `APP_URL=https://abc123.ngrok-free.app`
4. Restart your backend server

**⚠️ Critical for Local Development:**
- SAML **requires HTTPS** - you MUST use ngrok (or similar) for local development
- The ngrok URL changes every restart unless you have a paid account with reserved domains
- You must update Duo configuration with the new ngrok URL each time

## Architecture Overview

The authentication flow consists of:

1. **Frontend (React)**: Handles UI, session management, and redirects
2. **Backend (Python)**: Processes SAML assertions, manages sessions, validates users
3. **Duo SSO**: Identity Provider (IdP) that authenticates users

## Authentication Flow

```
User → Login Page → Backend SAML Endpoint → Duo SSO (Authentication)
                                              ↓
User ← Redirect Home ← Backend Validates ← SAML Assertion
```

## Frontend Implementation (✅ Complete)

The frontend implementation includes:

- **AuthContext**: Manages authentication state throughout the app
- **ProtectedRoute**: Wrapper component that requires authentication
- **LoginPage**: Clean SSO login interface
- **CallbackPage**: Handles post-authentication redirect
- **Updated AppHeader**: Shows user profile and logout button

### Frontend API Endpoints Used

The frontend expects these backend endpoints:

- `GET /api/auth/me` - Check current authentication status
- `GET /api/auth/saml/login` - Initiate SAML SSO flow
- `POST /api/auth/logout` - Clear session and logout
- `POST /api/auth/saml/acs` - Assertion Consumer Service (SAML callback)

## Backend Implementation (⚠️ Required)

You need to implement the backend SAML authentication. Here's how:

### Step 0: Set Up ngrok for Local Development (REQUIRED)

**⚠️ IMPORTANT**: SAML SSO requires HTTPS. For local development, you MUST use ngrok to create an HTTPS tunnel to your localhost.

1. **Install ngrok** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Sign up for ngrok account** (free tier is sufficient):
   - Visit https://dashboard.ngrok.com/signup
   - Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

3. **Configure ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Start ngrok tunnel** (keep this running during development):
   ```bash
   # Tunnel to your backend server (default port 5001)
   ngrok http 5001
   ```

5. **Note your ngrok URLs**:
   - You'll see output like:
   ```
   Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:5001
   ```
   - Copy the HTTPS URL (e.g., `https://abc123def456.ngrok-free.app`)
   - This URL changes each time you restart ngrok (unless you have a paid account with reserved domains)

6. **Keep ngrok running**: Leave this terminal window open. Every time you restart ngrok, you'll need to update Duo configuration with the new URL.

### Step 1: Configure Duo SSO

1. **Log in to Duo Admin Panel**
   - Navigate to: Applications → Protect an Application

2. **Add SAML Service Provider**
   - Search for "Generic SAML Service Provider"
   - Click "Protect"

3. **Configure SAML Settings**
   
   **For Local Development (using ngrok):**
   - **Entity ID**: `urn:meraki-admin-jit:saml`
   - **Assertion Consumer Service (ACS) URL**: `https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/acs`
     - Replace `YOUR-NGROK-URL` with your actual ngrok subdomain
     - Example: `https://abc123def456.ngrok-free.app/api/auth/saml/acs`
   - **Service Provider Login URL**: `https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/login`
   - **NameID format**: EmailAddress
   - **Signing**: Enable "Sign response" and "Sign assertion"
   
   **⚠️ Important**: You'll need to update these URLs in Duo each time you restart ngrok (unless using a reserved domain)
   
   **For Production:**
   - **Entity ID**: `urn:meraki-admin-jit:saml`
   - **Assertion Consumer Service (ACS) URL**: `https://your-domain.com/api/auth/saml/acs`
   - **Service Provider Login URL**: `https://your-domain.com/api/auth/saml/login`
   - **NameID format**: EmailAddress
   - **Signing**: Enable "Sign response" and "Sign assertion"

4. **Download Metadata**
   - Download the Duo metadata XML file
   - Save as `duo_metadata.xml` in your backend config directory

5. **Note These Values** (from Duo config page):
   - Single Sign-On URL
   - Entity ID
   - X.509 Certificate

### Step 2: Install Python SAML Library

For Python backends (Flask/FastAPI), install:

```bash
pip install python3-saml python-jose cryptography
```

### Step 3: Backend Configuration

Create a SAML configuration file:

```python
# config/saml_settings.py

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SAML_SETTINGS = {
    "strict": True,
    "debug": os.getenv("DEBUG", False),
    "sp": {
        "entityId": "urn:meraki-admin-jit:saml",
        "assertionConsumerService": {
            "url": f"{os.getenv('APP_URL')}/api/auth/saml/acs",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        },
        "singleLogoutService": {
            "url": f"{os.getenv('APP_URL')}/api/auth/saml/sls",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        "x509cert": "",  # Leave empty, SP cert is optional
        "privateKey": ""  # Leave empty, SP key is optional
    },
    "idp": {
        "entityId": os.getenv("DUO_ENTITY_ID"),
        "singleSignOnService": {
            "url": os.getenv("DUO_SSO_URL"),
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "singleLogoutService": {
            "url": os.getenv("DUO_SLO_URL"),
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "x509cert": os.getenv("DUO_X509_CERT")
    },
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
```

### Step 4: Implement Backend Routes

#### Example using Flask:

```python
# routes/auth.py

from flask import Blueprint, request, redirect, session, jsonify
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.utils import OneLogin_Saml2_Utils
from config.saml_settings import SAML_SETTINGS
import os

auth_bp = Blueprint('auth', __name__)

def prepare_flask_request(request):
    """Prepare Flask request for SAML library"""
    url_data = {
        'https': 'on' if request.scheme == 'https' else 'off',
        'http_host': request.host,
        'server_port': request.environ.get('SERVER_PORT', 443 if request.scheme == 'https' else 80),
        'script_name': request.path,
        'get_data': request.args.copy(),
        'post_data': request.form.copy()
    }
    return url_data

@auth_bp.route('/api/auth/saml/login')
def saml_login():
    """Initiate SAML SSO login"""
    req = prepare_flask_request(request)
    auth = OneLogin_Saml2_Auth(req, SAML_SETTINGS)
    
    # Store the return URL if provided
    return_to = request.args.get('return_to', '/')
    session['return_to'] = return_to
    
    # Redirect to Duo SSO
    return redirect(auth.login())

@auth_bp.route('/api/auth/saml/acs', methods=['POST'])
def saml_acs():
    """Assertion Consumer Service - Handle SAML response from Duo"""
    req = prepare_flask_request(request)
    auth = OneLogin_Saml2_Auth(req, SAML_SETTINGS)
    
    try:
        auth.process_response()
        errors = auth.get_errors()
        
        if errors:
            print(f"SAML Errors: {errors}")
            return jsonify({"error": "SAML authentication failed"}), 401
        
        if not auth.is_authenticated():
            return jsonify({"error": "Not authenticated"}), 401
        
        # Get user attributes from SAML assertion
        attributes = auth.get_attributes()
        name_id = auth.get_nameid()
        
        # Extract user information
        user_data = {
            'email': name_id,
            'name': attributes.get('name', [name_id])[0] if attributes.get('name') else name_id,
            'organization': attributes.get('organization', [''])[0] if attributes.get('organization') else '',
            'role': attributes.get('role', ['user'])[0] if attributes.get('role') else 'user',
        }
        
        # Create user session
        session['user'] = user_data
        session['authenticated'] = True
        session.permanent = True
        
        # Redirect to frontend callback page
        return_to = session.pop('return_to', '/')
        return redirect(f"{os.getenv('FRONTEND_URL')}/auth/callback")
        
    except Exception as e:
        print(f"SAML ACS Error: {str(e)}")
        return jsonify({"error": "Authentication processing failed"}), 500

@auth_bp.route('/api/auth/me')
def get_current_user():
    """Get current authenticated user"""
    if not session.get('authenticated'):
        return jsonify({"error": "Not authenticated"}), 401
    
    return jsonify(session.get('user', {}))

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout and clear session"""
    session.clear()
    return jsonify({"message": "Logged out successfully"})
```

### Step 5: Environment Variables

Create a `.env` file in your backend directory:

**For Local Development (with ngrok):**

```bash
# Backend Environment Variables - LOCAL DEVELOPMENT

# Application URLs - UPDATE THESE WITH YOUR NGROK URL
APP_URL=https://YOUR-NGROK-URL.ngrok-free.app
FRONTEND_URL=http://localhost:3000
SECRET_KEY=your-super-secret-session-key-change-this

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,https://YOUR-NGROK-URL.ngrok-free.app

# Duo SAML Configuration (Get these from Duo Admin Panel)
DUO_ENTITY_ID=https://sso-abc123.sso.duosecurity.com
DUO_SSO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/YourAppID/sso
DUO_SLO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/YourAppID/slo
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgI... (paste full certificate here without line breaks)"

# Session Configuration - LOCAL DEVELOPMENT
SESSION_COOKIE_SECURE=false  # Set to false for local dev, true for production
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax
SESSION_LIFETIME=43200  # 12 hours in seconds

# Database (if needed for user management)
DATABASE_URL=postgresql://user:pass@localhost/meraki_admin_jit
```

**For Production:**

```bash
# Backend Environment Variables - PRODUCTION

# Application URLs
APP_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
SECRET_KEY=use-a-strong-random-secret-key-here

# CORS Settings
ALLOWED_ORIGINS=https://your-domain.com

# Duo SAML Configuration
DUO_ENTITY_ID=https://sso-abc123.sso.duosecurity.com
DUO_SSO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/YourAppID/sso
DUO_SLO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/YourAppID/slo
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgI..."

# Session Configuration - PRODUCTION
SESSION_COOKIE_SECURE=true  # MUST be true in production
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Strict
SESSION_LIFETIME=43200

# Database
DATABASE_URL=postgresql://user:pass@production-host/meraki_admin_jit
```

## Security Considerations

### ⚠️ Important Security Settings

1. **Session Security**
   - Use secure session cookies in production
   - Set appropriate session lifetime (12-24 hours recommended)
   - Use strong session secret key

2. **HTTPS Required**
   - SAML SSO **requires HTTPS** in production
   - Configure SSL certificates properly
   - Never disable SSL verification in production

3. **Certificate Validation**
   - Always validate SAML assertions
   - Verify signature on SAML responses
   - Check assertion expiration times

4. **User Authorization**
   - Authenticate with Duo (who you are)
   - Authorize based on attributes (what you can do)
   - Implement role-based access control (RBAC)

## Testing the Implementation

### Local Development Testing with ngrok

**Complete Setup Process:**

1. **Terminal 1: Start ngrok tunnel**
   ```bash
   ngrok http 5001
   ```
   - Keep this running throughout development
   - Note the HTTPS URL (e.g., `https://abc123def456.ngrok-free.app`)
   - This URL will be different each time you restart ngrok

2. **Update Duo SSO Application Configuration**:
   - Go to Duo Admin Panel → Applications → Your SAML App
   - Update **Assertion Consumer Service (ACS) URL**:
     - `https://abc123def456.ngrok-free.app/api/auth/saml/acs`
   - Update **Service Provider Login URL**:
     - `https://abc123def456.ngrok-free.app/api/auth/saml/login`
   - Save changes
   - **You must do this every time you restart ngrok** (unless using reserved domain)

3. **Update Backend Environment Variables** (`.env` file):
   ```bash
   APP_URL=https://abc123def456.ngrok-free.app
   FRONTEND_URL=http://localhost:3000
   SESSION_COOKIE_SECURE=false
   ```

4. **Terminal 2: Start Backend Server**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Activate virtual environment (if using)
   source venv/bin/activate
   
   # Start server
   python app.py
   ```

5. **Terminal 3: Start React Frontend**
   ```bash
   # Navigate to app directory
   cd app
   
   # Start React dev server
   npm start
   ```

6. **Test the authentication flow**:
   - Open browser and navigate to `http://localhost:3000`
   - You should be redirected to `/login` (not authenticated)
   - Click "Sign In with Duo SSO" button
   - Browser will redirect through your ngrok URL to backend
   - Backend initiates SAML and redirects to Duo
   - Complete Duo authentication (username/password + MFA)
   - Duo sends SAML assertion back to your ngrok ACS URL
   - Backend validates assertion and creates session
   - Redirects to frontend `/auth/callback`
   - Frontend verifies authentication and redirects to home
   - ✅ You should now be authenticated and see your user info in header

7. **Verify the complete flow**:
   - Check that you can access all protected pages
   - Verify user name and email appear in header
   - Test logout button
   - After logout, verify redirect to login page
   - Verify protected pages redirect to login when not authenticated

### Debugging ngrok Issues

**Common ngrok problems and solutions:**

1. **"This site can't be reached" when accessing ngrok URL**:
   - Verify ngrok is still running in Terminal 1
   - Check that backend server is running on port 5001
   - Test locally first: `curl http://localhost:5001/api/auth/me`

2. **"ngrok.io refuses to connect"**:
   - Free ngrok sessions timeout after 2 hours
   - Restart ngrok and update Duo configuration with new URL

3. **CORS errors in browser console**:
   - Add your ngrok URL to ALLOWED_ORIGINS in backend
   - Ensure Flask-CORS is configured properly
   - Check that credentials: 'include' is set in frontend fetch calls

4. **"Invalid SAML response" errors**:
   - Verify ACS URL in Duo exactly matches your ngrok URL + `/api/auth/saml/acs`
   - Check that you updated Duo config after restarting ngrok
   - Verify DUO_X509_CERT in .env matches certificate from Duo

5. **Session not persisting**:
   - Check SESSION_COOKIE_SECURE is set to `false` for local dev
   - Verify SECRET_KEY is set in .env
   - Check browser cookies (Dev Tools → Application → Cookies)

### ngrok Pro Tips

**For easier development:**

1. **Use ngrok reserved domains** (requires paid account):
   ```bash
   ngrok http 5001 --domain=your-reserved-domain.ngrok.app
   ```
   - URL stays the same between restarts
   - No need to update Duo configuration constantly

2. **Create ngrok config file** (`~/.ngrok2/ngrok.yml`):
   ```yaml
   version: "2"
   authtoken: YOUR_AUTH_TOKEN
   tunnels:
     backend:
       proto: http
       addr: 5001
       inspect: true
   ```
   
   Then start with:
   ```bash
   ngrok start backend
   ```

3. **View ngrok requests**:
   - Open `http://localhost:4040` in browser
   - See all HTTP requests going through tunnel
   - Helpful for debugging SAML flow

### Production Deployment

1. **Configure DNS and SSL**
   - Point domain to your server
   - Install SSL certificate

2. **Update Duo Configuration**
   - Use production URLs
   - Enable production security settings

3. **Set Environment Variables**
   - Use production values
   - Never commit secrets to git

4. **Test Thoroughly**
   - Test login flow
   - Test logout
   - Test session expiration
   - Test protected routes

## Troubleshooting

### Common Issues

**1. "SAML response not valid"**
- Check that clocks are synchronized (NTP)
- Verify certificate is correct
- Check ACS URL matches exactly

**2. "Redirect loop"**
- Verify session cookies are being set
- Check CORS configuration
- Ensure credentials: 'include' in frontend

**3. "User attributes missing"**
- Configure attribute mapping in Duo
- Check SAML assertion contents
- Verify attribute names match

**4. "HTTPS required error"**
- Use ngrok or similar for local dev
- Configure proper SSL in production
- Never disable SSL verification

## Additional Resources

- [Duo SSO Documentation](https://duo.com/docs/sso)
- [SAML 2.0 Specification](http://docs.oasis-open.org/security/saml/)
- [python3-saml Documentation](https://github.com/onelogin/python3-saml)

## Support

For issues or questions:
1. Check Duo Admin Panel logs
2. Check backend application logs
3. Check browser console for frontend errors
4. Verify SAML assertions using browser dev tools

---

**Next Steps**: Implement the backend routes and configure Duo SSO following this guide.

