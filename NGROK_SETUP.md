# ngrok Setup for Local SAML Development

This is a quick reference guide for using ngrok with Duo SAML SSO during local development.

## Why ngrok is Required

**SAML SSO requires HTTPS** for security. Since your localhost doesn't have HTTPS, ngrok creates a secure HTTPS tunnel to your local development server. Duo needs to send SAML assertions to a public HTTPS URL (the ACS endpoint), which ngrok provides.

### Why port 5001?

On **macOS**, port **5000** is used by **AirPlay Receiver**. If you use 5000 for the backend, you may get "Address already in use" or conflicts when AirPlay is on. This project uses **5001** by default so it does not compete with AirPlay. You can override with `FLASK_PORT` in `.env` if needed.

## Initial Setup (One-Time)

### 1. Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Linux:**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

**Or download from**: https://ngrok.com/download

### 2. Create ngrok Account

1. Sign up at: https://dashboard.ngrok.com/signup (free tier is sufficient)
2. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

### 3. Configure ngrok with Your Token

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

## Daily Development Workflow

### Step 1: Start ngrok Tunnel

Open a terminal and run (backend defaults to port **5001** to avoid conflict with macOS AirPlay on 5000):

```bash
ngrok http 5001
```

You'll see output like:

```
ngrok                                                                    (Ctrl+C to quit)

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:5001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📝 Copy the HTTPS URL**: `https://abc123def456.ngrok-free.app`

⚠️ **Important**: This URL is different every time you restart ngrok (unless you have a paid reserved domain)

### Step 2: Update Duo Configuration

1. Go to **Duo Admin Panel**: https://admin.duosecurity.com
2. Navigate to: **Applications** → Your SAML Application
3. Update these fields with your new ngrok URL:

   - **Assertion Consumer Service URL**: 
     ```
     https://abc123def456.ngrok-free.app/api/auth/saml/acs
     ```
   
   - **Service Provider Login URL**:
     ```
     https://abc123def456.ngrok-free.app/api/auth/saml/login
     ```

4. Click **Save** or **Save Changes**

### Step 3: Update Backend Environment Variables

Edit your backend `.env` file:

```bash
# Update this line with your current ngrok URL
APP_URL=https://abc123def456.ngrok-free.app

# Keep these the same
FRONTEND_URL=http://localhost:3000

# When APP_URL is https (e.g. ngrok), the backend automatically sets the session
# cookie to SameSite=None; Secure so the frontend (localhost) can send it when
# calling the API. You do not need to set SESSION_COOKIE_SECURE manually.
```

### Step 4: Start Backend Server

```bash
# Terminal 2 (separate from ngrok)
cd /path/to/your/backend
source venv/bin/activate  # if using virtualenv
python app.py
```

### Step 5: Set Frontend API URL

So that "Sign in with Duo" goes to your backend (and Duo can reach the ACS), the frontend must use your **ngrok** URL for auth.

Create or edit `app/.env.local`:

```bash
# Use your ngrok URL so login redirect and callbacks hit the backend
REACT_APP_API_BASE_URL=https://abc123def456.ngrok-free.app
```

Restart the React app after changing this (`npm start` again).

### Step 6: Start React Frontend

```bash
# Terminal 3 (separate from ngrok and backend)
cd /path/to/meraki-admin-jit/app
npm start
```

### Step 7: Test Authentication

1. Open browser to `http://localhost:3000`
2. Click "Sign In with Duo SSO"
3. Complete Duo authentication
4. You should be redirected back and authenticated

## ngrok Free Tier Limitations

- **URL changes on restart**: You get a new random URL each time
- **2-hour session timeout**: Free sessions expire after 2 hours of inactivity
- **40 connections/minute**: Should be plenty for development

## ngrok Paid Features (Optional)

If you're tired of updating Duo configuration constantly:

### Reserved Domains ($8/month)

Get a permanent subdomain that never changes:

```bash
ngrok http 5001 --domain=my-reserved-domain.ngrok.app
```

Benefits:
- Same URL every time
- No need to update Duo configuration
- Configure once and forget

### Create Account: https://dashboard.ngrok.com/billing/subscription

## Troubleshooting

### ngrok says "command not found"

**Fix**: Add ngrok to your PATH or use full path:
```bash
/usr/local/bin/ngrok http 5001
```

### "ERR_NGROK_108: You must sign up"

**Fix**: You need to authenticate with your token:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### "tunnel not found" or "tunnel session not ready yet"

**Fix**: Wait a few seconds after starting ngrok before making requests

### Can't connect to ngrok URL from browser

**Fix**: 
1. Verify ngrok is still running (check Terminal 1)
2. Verify backend is running on port 5001
3. Test locally first: `curl http://localhost:5001/api/auth/me`

### CORS errors when accessing through ngrok

**Fix**: Add your ngrok URL to backend CORS configuration:
```python
# In your Flask app
CORS(app, origins=[
    "http://localhost:3000",
    "https://abc123def456.ngrok-free.app"  # Add your ngrok URL
], supports_credentials=True)
```

### ngrok tunnel works but Duo returns error

**Fix**: 
1. Verify ACS URL in Duo **exactly** matches: `https://YOUR-URL.ngrok-free.app/api/auth/saml/acs`
2. No trailing slashes
3. Must use HTTPS (not HTTP)
4. Must include `/api/auth/saml/acs` path

## Useful ngrok Commands

### View Web Interface

ngrok provides a web interface at: `http://localhost:4040`

This shows:
- All HTTP requests through the tunnel
- Request/response details
- Helpful for debugging SAML flow

### Custom Subdomain (Paid only)

```bash
ngrok http 5001 --subdomain=myapp
# Creates: https://myapp.ngrok.io
```

### Specify Region

```bash
ngrok http 5001 --region=us
# Options: us, eu, ap, au, sa, jp, in
```

### Save Configuration File

Create `~/.ngrok2/ngrok.yml`:

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

## Quick Reference Card

**Daily Checklist:**
- [ ] Start ngrok: `ngrok http 5001`
- [ ] Copy HTTPS URL from ngrok output
- [ ] Update Duo ACS URL with new ngrok URL
- [ ] Update backend .env APP_URL with new ngrok URL
- [ ] Start backend server
- [ ] Start React frontend
- [ ] Test login at http://localhost:3000

**Every Time You Restart ngrok:**
- [ ] Note new ngrok URL
- [ ] Update Duo configuration
- [ ] Update backend .env file
- [ ] Restart backend server

## Alternative to ngrok

If you prefer other tools:
- **localtunnel**: Free, but less stable
- **Cloudflare Tunnel**: Free, more complex setup
- **localhost.run**: Simple SSH tunneling
- **Tailscale Funnel**: Great for teams

However, ngrok is the most widely used and best documented for SAML development.

---

**Pro Tip**: Keep the ngrok terminal visible so you can quickly see when it disconnects or needs restarting. Set up a reserved domain if you're doing this frequently!

