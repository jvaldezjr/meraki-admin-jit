# Meraki Admin JIT - Backend

Python Flask backend providing SAML SSO authentication with Duo Security.

## Quick Start

### 1. Setup Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env and fill in your values:
# - SECRET_KEY (generate with: openssl rand -hex 32)
# - APP_URL (your ngrok URL)
# - DUO_ENTITY_ID, DUO_SSO_URL, DUO_X509_CERT (from Duo Admin Panel)
```

### 4. Start ngrok (Required for SAML)

```bash
# In a separate terminal
ngrok http 5001

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
# Update .env: APP_URL=https://abc123.ngrok-free.app
```

### 5. Update Duo Configuration

1. Go to Duo Admin Panel
2. Navigate to your SAML application
3. Update ACS URL to: `https://abc123.ngrok-free.app/api/auth/saml/acs`
4. Save changes

### 6. Run the Backend

```bash
python app.py
```

The server will start on http://localhost:5001

## API Endpoints

### Health Check
```
GET /health
```

### Authentication Endpoints
```
GET  /api/auth/saml/login      # Initiate SAML login
POST /api/auth/saml/acs        # SAML callback (Duo posts here)
GET  /api/auth/saml/sls        # SAML logout
GET  /api/auth/me              # Get current user
POST /api/auth/logout          # Logout
GET  /api/auth/metadata        # SAML SP metadata
```

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── env.example           # Environment variables template
├── .gitignore           # Git ignore file
├── config/              # Configuration modules
│   ├── __init__.py
│   └── saml_settings.py # SAML configuration
└── routes/              # API routes
    ├── __init__.py
    └── auth.py          # Authentication routes
```

## Environment Variables

See `env.example` for all available configuration options.

### Required Variables

- `SECRET_KEY` - Flask session secret (generate with `openssl rand -hex 32`)
- `APP_URL` - Your ngrok HTTPS URL
- `DUO_ENTITY_ID` - From Duo Admin Panel
- `DUO_SSO_URL` - From Duo Admin Panel
- `DUO_X509_CERT` - From Duo Admin Panel (single line)

### Optional Variables

- `FRONTEND_URL` - React app URL (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level (default: INFO)
- `SESSION_TYPE` - Session storage (filesystem or redis)

## Development Workflow

1. **Start ngrok** (keep running)
   ```bash
   ngrok http 5001
   ```

2. **Update .env** with ngrok URL
   ```bash
   APP_URL=https://your-new-ngrok-url.ngrok-free.app
   ```

3. **Update Duo** ACS URL in Duo Admin Panel

4. **Restart backend**
   ```bash
   python app.py
   ```

5. **Start frontend** (in another terminal)
   ```bash
   cd ../app && npm start
   ```

## Testing

### Test Health Check
```bash
curl http://localhost:5001/health
```

### Test Authentication Status
```bash
curl http://localhost:5001/api/auth/me
# Should return 401 Unauthorized if not logged in
```

### View SAML Metadata
```bash
curl http://localhost:5001/api/auth/metadata
```

## Troubleshooting

### ImportError: No module named 'flask'
- Activate virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

### SAML Response Invalid
- Check APP_URL in .env matches ngrok URL exactly
- Verify Duo ACS URL matches: `<ngrok-url>/api/auth/saml/acs`
- Check DUO_X509_CERT is correct (no line breaks)

### Session Not Persisting
- Set `SESSION_COOKIE_SECURE=false` for local development
- Check `SECRET_KEY` is set in .env
- Verify browser accepts cookies

### CORS Errors
- Add your ngrok URL to `ALLOWED_ORIGINS` in .env
- Restart backend after changing .env

## Production Deployment

For production deployment:

1. Set `FLASK_ENV=production` in .env
2. Set `SESSION_COOKIE_SECURE=true`
3. Use strong `SECRET_KEY`
4. Use Redis for session storage
5. Use proper HTTPS (not ngrok)
6. Set up proper logging
7. Use WSGI server (gunicorn/uWSGI)

Example production start:
```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## Security Notes

- ✅ All SAML assertions are validated
- ✅ Sessions use secure cookies in production
- ✅ HTTPS required for SAML
- ✅ CORS restricted to frontend URL
- ✅ Security headers added automatically
- ⚠️ Never commit .env file to git
- ⚠️ Change SECRET_KEY in production

## Support

See parent directory documentation:
- `../SAML_SETUP.md` - Complete SAML setup guide
- `../NGROK_SETUP.md` - ngrok configuration
- `../QUICK_START.md` - Quick reference

## License

[Include your license here]

