# Quick Start Cheat Sheet

⚡ **Fast setup for Meraki Admin JIT with Duo SAML SSO**

## ⚠️ Important Note

**Frontend Only (Currently Built):**
- The React frontend is complete and can run standalone
- You'll see the UI, but authentication won't work yet

**Full Authentication (Requires Backend):**
- You need to implement the Python backend first
- See `SAML_SETUP.md` for backend implementation guide

## First Time Setup

### 1. Install ngrok
```bash
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN  # Get from https://dashboard.ngrok.com
```

### 2. Configure Duo SSO
- Duo Admin Panel → Applications → Protect an Application
- Search "Generic SAML Service Provider"
- Configure (will update URLs daily):
  - Entity ID: `urn:meraki-admin-jit:saml`
  - ACS URL: `https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/acs`
  - Login URL: `https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/login`
- Download metadata and note certificate

### 3. Backend Setup (You Need to Create This)
```bash
# Create backend directory
mkdir backend
cd backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install python3-saml Flask Flask-Session Flask-CORS

# Create .env file
cat > .env << EOF
APP_URL=https://YOUR-NGROK-URL.ngrok-free.app
FRONTEND_URL=http://localhost:3000
SECRET_KEY=$(openssl rand -hex 32)
SESSION_COOKIE_SECURE=false
DUO_ENTITY_ID=https://sso-xxx.sso.duosecurity.com
DUO_SSO_URL=https://sso-xxx.sso.duosecurity.com/saml2/sp/XXX/sso
DUO_X509_CERT="YOUR_CERT_HERE"
EOF
```

### 4. Frontend Setup
```bash
cd app
npm install
```

## Daily Workflow (3 Terminals)

### Terminal 1: ngrok
```bash
ngrok http 5001

# 📋 Copy the HTTPS URL that appears
# Example: https://abc123.ngrok-free.app
```

### Terminal 2: Backend (Once Created)
```bash
cd backend
source venv/bin/activate

# Update .env with new ngrok URL
# Edit .env file: APP_URL=https://abc123.ngrok-free.app

# Start backend (file needs to be created - see SAML_SETUP.md)
python app.py
```

### Terminal 3: Frontend
```bash
cd app
npm start
```

### Browser: Update Duo
1. Go to Duo Admin Panel
2. Update ACS URL: `https://abc123.ngrok-free.app/api/auth/saml/acs`
3. Update Login URL: `https://abc123.ngrok-free.app/api/auth/saml/login`
4. Save

### Test
- Open `http://localhost:3000`
- Click "Sign In with Duo SSO"
- ✅ Should redirect through Duo and back

## Every Time ngrok Restarts

- [ ] Note new ngrok HTTPS URL
- [ ] Update Duo ACS URL
- [ ] Update backend `.env` file
- [ ] Restart backend server

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "SAML response invalid" | Verify ACS URL in Duo matches ngrok URL exactly |
| CORS errors | Add ngrok URL to backend CORS config |
| Session not persisting | Set `SESSION_COOKIE_SECURE=false` in .env |
| Can't reach ngrok URL | Check ngrok is running, backend is on port 5001 |
| Duo times out | Free ngrok sessions expire after 2 hours - restart |

## Useful Commands

```bash
# Check backend is running
curl http://localhost:5001/api/auth/me

# View ngrok requests (helpful for debugging)
open http://localhost:4040

# Generate new secret key
openssl rand -hex 32

# Test Duo certificate format
echo "$DUO_X509_CERT" | openssl x509 -text -noout
```

## File Locations

- Frontend: `/app/src/`
- Backend: `/backend/` (create this)
- Config: `.env` (backend), `.env.local` (frontend)
- Docs: `SAML_SETUP.md`, `NGROK_SETUP.md`, `README.md`

## Pro Tips

💡 **Get ngrok reserved domain** ($8/month) so URL never changes
💡 **Keep ngrok terminal visible** to see when it disconnects
💡 **Use ngrok web interface** at `http://localhost:4040` for debugging
💡 **Save Duo config as draft** to quickly restore when ngrok URL changes

---

**Full Documentation**: See `SAML_SETUP.md` and `NGROK_SETUP.md` for complete guides

