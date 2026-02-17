# Create Your .env Configuration File

The `.env` file contains your SAML configuration but is protected from being committed to git for security.

## Quick Create

Run this command in the backend directory:

```bash
cd backend
cp env.example .env
```

Or manually create `backend/.env` with the content below.

## Complete .env File Template

Create a file named `.env` in the `backend/` directory with this content:

```bash
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_HOST=0.0.0.0
FLASK_PORT=5001

# Secret Key - GENERATE A NEW ONE!
# Run: openssl rand -hex 32
SECRET_KEY=your-generated-secret-key-here

# Application URLs
# UPDATE WITH YOUR NGROK URL EVERY TIME YOU RESTART NGROK
APP_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# CORS Configuration
# Add your ngrok URL here when you get it
ALLOWED_ORIGINS=http://localhost:3000

# ========================================
# Duo SAML Configuration
# ========================================
# See DUO_SETUP_CHECKLIST.md for detailed instructions

# Entity ID from Duo
DUO_ENTITY_ID=

# Single Sign-On URL from Duo
DUO_SSO_URL=

# Single Logout URL from Duo
DUO_SLO_URL=

# X.509 Certificate from Duo (SINGLE LINE, no BEGIN/END tags)
DUO_X509_CERT=

# ========================================
# Session Configuration
# ========================================
SESSION_TYPE=filesystem
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax
SESSION_PERMANENT=true
PERMANENT_SESSION_LIFETIME=43200

# ========================================
# Logging
# ========================================
LOG_LEVEL=INFO
```

## Step-by-Step Setup

### 1. Create the file

```bash
cd backend
cp env.example .env
```

### 2. Generate SECRET_KEY

```bash
openssl rand -hex 32
```

Copy the output and paste it as your SECRET_KEY in .env

### 3. Start ngrok

```bash
ngrok http 5001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 4. Update APP_URL and ALLOWED_ORIGINS

Edit `.env`:
```bash
APP_URL=https://abc123.ngrok-free.app
ALLOWED_ORIGINS=http://localhost:3000,https://abc123.ngrok-free.app
```

### 5. Configure Duo SSO

Follow **DUO_SETUP_CHECKLIST.md** to:
- Create SAML app in Duo Admin Panel
- Get DUO_ENTITY_ID, DUO_SSO_URL, DUO_SLO_URL
- Get DUO_X509_CERT

### 6. Paste Duo values into .env

```bash
DUO_ENTITY_ID=https://sso-abc123.sso.duosecurity.com
DUO_SSO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/sso
DUO_SLO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/slo
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgIJAKL...entire cert as one line..."
```

### 7. Verify your .env file

Check that:
- ✅ SECRET_KEY is set (not default value)
- ✅ APP_URL is your ngrok HTTPS URL
- ✅ ALLOWED_ORIGINS includes ngrok URL
- ✅ All DUO_* variables are filled in
- ✅ DUO_X509_CERT is one line (no breaks)

## Example Completed .env

```bash
FLASK_APP=app.py
FLASK_ENV=development
FLASK_HOST=0.0.0.0
FLASK_PORT=5001

SECRET_KEY=a1b2c3d4e5f6789012345678901234567890123456789012345678901234

APP_URL=https://abc123def456.ngrok-free.app
FRONTEND_URL=http://localhost:3000

ALLOWED_ORIGINS=http://localhost:3000,https://abc123def456.ngrok-free.app

DUO_ENTITY_ID=https://sso-abc123.sso.duosecurity.com
DUO_SSO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/sso
DUO_SLO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/slo
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgIJAKL0YjefU5paFQKCAQEAw8..."

SESSION_TYPE=filesystem
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax
SESSION_PERMANENT=true
PERMANENT_SESSION_LIFETIME=43200

LOG_LEVEL=INFO
```

## Test Your Configuration

```bash
# 1. Activate virtual environment
cd backend
source venv/bin/activate

# 2. Start backend
python app.py

# 3. Check for errors
# You should see no warnings about missing DUO_ variables
```

## Security Notes

⚠️ **Important**:
- `.env` file is in `.gitignore` - it will NOT be committed to git
- NEVER commit .env file to version control
- NEVER share your SECRET_KEY or DUO credentials
- Generate a NEW SECRET_KEY for production

## Troubleshooting

### "No such file or directory: .env"

Create the file:
```bash
cd backend
touch .env
# Then edit it and paste the template above
```

### "DUO_ENTITY_ID not set" warning

Your .env file isn't being read. Check:
- File is named exactly `.env` (not `.env.txt`)
- File is in `backend/` directory
- You're running `python app.py` from backend directory

### Changes not taking effect

Restart the backend server after editing .env:
- Stop with Ctrl+C
- Run `python app.py` again

---

**Next Steps**: After creating .env, see **DUO_SETUP_CHECKLIST.md** for Duo configuration.

