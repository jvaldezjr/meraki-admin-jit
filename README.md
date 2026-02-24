# Meraki Admin JIT

Just-in-Time (JIT) provisioning of Meraki Dashboard admin privileges. A secure web app for managing time-limited admin access with **SAML SSO** (Duo Security) and JWT-based auth.

## Features

- **SAML SSO** with Duo Security (MFA)
- **JWT auth** – frontend exchanges one-time code for token; no cross-origin cookies
- **Just-in-Time Access** – request and grant temporary admin privileges
- **Access tracking** – current access, approvals, change logs
- **Modern UI** – Cisco Magnetic Design System
- **Protected routes** – auth required for all app routes

## Prerequisites

- **Node.js** 14+ and npm
- **Python** 3.8+ (backend)
- **ngrok** account (free tier OK) – SAML requires HTTPS
- **Duo Security** account with SSO

## Quick Start

### Three terminals (daily workflow)

```bash
# Terminal 1: ngrok (keep running)
ngrok http 5001
# Copy the HTTPS URL (e.g. https://abc123.ngrok-free.app)

# Terminal 2: Backend
cd backend
# If using pyenv-virtualenv: venv auto-activates. Else: source venv/bin/activate
python app.py
# Or with 1Password CLI for Meraki key: op run --env-file=.env.op -- python app.py

# Terminal 3: Frontend
cd app
npm start
```

Then open **http://localhost:3000**, click **Sign In with Duo SSO**, and complete Duo login.

**When you restart ngrok:** update Duo ACS URL and backend `APP_URL` (see [When ngrok restarts](#when-ngrok-restarts)).

---

## First-time setup

### 1. ngrok (one-time)

- Sign up: https://dashboard.ngrok.com/signup  
- Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken  

```bash
brew install ngrok    # macOS
ngrok config add-authtoken YOUR_TOKEN
```

Port **5001** is used so the backend doesn’t conflict with macOS AirPlay on 5000.

### 2. Backend

**Option A: pyenv + pyenv-virtualenv (recommended if you use pyenv)**

```bash
# Ensure the plugin is loaded (add to shell if not already):
# eval "$(pyenv init -)"
# eval "$(pyenv virtualenv-init -)"

# Create a virtualenv with your pyenv Python (e.g. 3.14.3)
pyenv virtualenv 3.14.3 meraki-admin-jit-3.14.3

# Use it for the backend (writes backend/.python-version; auto-activates when you cd backend)
cd backend
pyenv local meraki-admin-jit-3.14.3

# Install deps and config (venv is already active)
pip install -r requirements.txt
cp env.example .env
```

From then on, `cd backend` will activate `meraki-admin-jit-3.14.3` automatically. To recreate the venv (e.g. after upgrading Python): `pyenv uninstall meraki-admin-jit-3.14.3` then run the `pyenv virtualenv` and `pyenv local` steps again.

**Option B: stdlib venv**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp env.example .env
```

Edit **backend/.env**:

- `SECRET_KEY` – generate: `openssl rand -hex 32`
- `APP_URL` – your ngrok HTTPS URL (e.g. `https://abc123.ngrok-free.app`)
- `FRONTEND_URL` – `http://localhost:3000`
- `ALLOWED_ORIGINS` – `http://localhost:3000,https://YOUR-NGROK-URL.ngrok-free.app`
- Duo values (see [Duo SAML configuration](#duo-saml-configuration))

### 3. Duo SAML configuration

1. **Duo Admin Panel** → Applications → Protect an Application → **Generic SAML Service Provider** → Protect.
2. Configure:
   - **Entity ID:** `urn:meraki-admin-jit:saml`
   - **ACS URL:** `https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/acs`
   - **Service Provider Login URL:** `https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/login`
   - **NameID:** Email Address
   - **Sign response** and **Sign assertion:** enabled
3. **Attribute mapping** (so the app can show first name in the header and display name + email in the profile dropdown):
   - In the Duo SAML app configuration, find **Attributes** or **Attribute mapping**.
   - Map your directory attributes to these **SAML attribute names** (the app expects these exact names):
     - **Display name / full name** → SAML attribute name: `displayName` or `name` or `cn` (one is enough).
     - **First name** → SAML attribute name: `givenName` or `firstName`.
     - **Last name** → `sn` or `surname` or `lastName` (optional).
     - **Email** is already provided as NameID; you can also send it as an attribute if needed.
   - Example: if your IdP has "First Name" and "Display Name", map them to `givenName` and `displayName` respectively.
4. Copy into **backend/.env**:
   - **Entity ID** → `DUO_ENTITY_ID`
   - **Single Sign-On URL** → `DUO_SSO_URL`
   - **Single Logout URL** → `DUO_SLO_URL`
   - **X.509 Certificate** → `DUO_X509_CERT` (single line, no `-----BEGIN/END-----`, no line breaks)

### 4. Frontend

```bash
cd app
npm install
```

Optional **app/.env.local** if the API is not on the same host:

```bash
REACT_APP_API_BASE_URL=https://YOUR-NGROK-URL.ngrok-free.app
```

(Default is `http://localhost:5001`.)

---

## Project structure

```
meraki-admin-jit/
├── app/                    # React frontend
│   ├── src/
│   │   ├── components/     # AppHeader, Layout, Navigation, ProtectedRoute
│   │   ├── contexts/       # AuthContext
│   │   ├── pages/          # Home, Login, Callback, MyAccess, etc.
│   │   └── App.js
│   ├── package.json
│   └── env.example
├── backend/                 # Flask API
│   ├── app.py
│   ├── requirements.txt
│   ├── env.example
│   ├── config/             # saml_settings
│   └── routes/             # auth (SAML, token, me, logout)
└── README.md
```

---

## Backend

### Environment variables (backend/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Session/JWT secret; use `openssl rand -hex 32` |
| `APP_URL` | Yes | ngrok HTTPS URL (or production URL) |
| `FRONTEND_URL` | No | Default `http://localhost:3000` |
| `ALLOWED_ORIGINS` | No | CORS origins, comma-separated |
| `DUO_ENTITY_ID` | Yes | From Duo Admin Panel |
| `DUO_SSO_URL` | Yes | From Duo Admin Panel |
| `DUO_SLO_URL` | No | From Duo Admin Panel |
| `DUO_X509_CERT` | Yes | Duo cert, single line, no line breaks |
| `SESSION_COOKIE_SECURE` | No | `false` for local dev |
| `FLASK_PORT` | No | Default `5001` |
| `MERAKI_DASHBOARD_API_KEY` | For My Access | Meraki Dashboard API key (used by `/api/meraki/organizations`) |

To use the local **dashboard-api-python** library instead of PyPI `meraki`, install it with:  
`pip install -e /path/to/dashboard-api-python`, then ensure `MERAKI_DASHBOARD_API_KEY` is set (in `.env` or via 1Password below).

### 1Password CLI (optional)

To provide **MERAKI_DASHBOARD_API_KEY** (and optionally other secrets) from 1Password instead of plaintext in `.env`:

1. **Install and sign in** to [1Password CLI](https://developer.1password.com/docs/cli/) (`op signin`).
2. **Store the Meraki API key** in a 1Password item and copy its **secret reference** (e.g. `op://VaultName/ItemName/credential`).
3. **Create backend/.env.op** (do not commit it; it’s in `.gitignore`):
   ```bash
   cp backend/.env.op.example backend/.env.op
   # Edit .env.op and set MERAKI_DASHBOARD_API_KEY=op://YourVault/YourItem/field_name
   ```
4. **Run the backend with `op run`** so 1Password injects the secret into the environment (backend only; frontend has no Meraki key):

   ```bash
   cd backend
   source venv/bin/activate
   op run --env-file=.env.op -- python app.py
   ```

Keep your normal **.env** for non-secret config (e.g. `APP_URL`, `FRONTEND_URL`, Duo IDs). `op run` overlays the variables from `.env.op` (with references resolved) onto the process environment, and `python-dotenv` still loads `.env`, so both apply. For production you can also store **SECRET_KEY** and **DUO_X509_CERT** in 1Password and add their `op://` references to `.env.op` so no secrets live in plaintext `.env`.

### API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/meraki/organizations` | List organizations (auth required; uses dashboard-api-python) |
| GET | `/api/auth/saml/login` | Start SAML SSO |
| POST | `/api/auth/saml/acs` | SAML callback (Duo posts here) |
| GET | `/api/auth/saml/sls` | SAML logout |
| POST | `/api/auth/token` | Exchange one-time code for JWT |
| GET | `/api/auth/me` | Current user (Bearer or session) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/metadata` | SAML SP metadata |

### Auth flow (summary)

1. User clicks “Sign In” → frontend redirects to backend `/api/auth/saml/login`.
2. Backend redirects to Duo; user completes MFA.
3. Duo POSTs to `/api/auth/saml/acs`; backend validates, creates one-time code, redirects to frontend `/auth/callback?code=...`.
4. Frontend POSTs `code` to `/api/auth/token`, receives JWT and user; stores token and redirects to app.

---

## Frontend (app)

If you use an **internal npm registry** (e.g. for `@magnetic/*`), ensure `~/.npmrc` (or `app/.npmrc`) is configured so `npm install` resolves. Then from **app/**:

```bash
cd app
npm install
npm start
```

- `npm start` – dev server at http://localhost:3000
- `npm test` – test runner
- `npm run build` – production build

See [Create React App](https://create-react-app.dev/) for more.

---

## ngrok

SAML requires HTTPS. ngrok gives you an HTTPS URL to your local backend.

- **Start:** `ngrok http 5001`
- **Inspect requests:** http://localhost:4040
- **Free tier:** URL changes on restart; ~2-hour session limit. Paid reserved domains keep the same URL.

### When ngrok restarts

1. Note the new HTTPS URL.
2. In Duo Admin Panel, set ACS URL to `https://NEW-URL/api/auth/saml/acs` and Login URL to `https://NEW-URL/api/auth/saml/login`.
3. In **backend/.env**, set `APP_URL` and add the new URL to `ALLOWED_ORIGINS`.
4. Restart the backend.

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| “Invalid or expired code” / stuck on callback | Don’t refresh callback; use a fresh login so the one-time code isn’t reused. |
| SAML response invalid | ACS URL in Duo must match exactly: `https://YOUR-NGROK-URL/api/auth/saml/acs` (no trailing slash). `APP_URL` in .env must match ngrok URL. |
| 401 / not authenticated | Ensure backend is running, `REACT_APP_API_BASE_URL` points to backend (or omit for localhost:5001). |
| CORS errors | Add frontend and ngrok URLs to `ALLOWED_ORIGINS` in backend .env and restart backend. |
| Session / cookie issues | For local dev use `SESSION_COOKIE_SECURE=false`. Ensure `SECRET_KEY` is set. |
| ModuleNotFoundError (e.g. jwt, flask) | Activate venv and run `pip install -r requirements.txt` in **backend**. |

**Useful commands:**

```bash
curl http://localhost:5001/health
curl http://localhost:5001/api/auth/me   # expect 401 when not logged in
openssl rand -hex 32   # new SECRET_KEY
```

---

## Production deployment

- Use real HTTPS (no ngrok).
- Set `FLASK_ENV=production`, `SESSION_COOKIE_SECURE=true`, strong `SECRET_KEY`.
- Set `APP_URL` and `FRONTEND_URL` to production domains.
- Run with a WSGI server, e.g. `gunicorn -w 4 -b 0.0.0.0:5001 app:app`.
- Prefer Redis (or similar) for session storage.

---

## Technology stack

- **Frontend:** React, React Router, Cisco Magnetic, Create React App
- **Backend:** Python 3.8+, Flask, python3-saml, PyJWT, Flask-Session, Flask-CORS
- **Auth:** SAML 2.0, Duo Security (IdP), JWT (Bearer), one-time code exchange

---

## Security

- No credentials in source; use environment variables and .env (not committed).
- All app routes except login and callback require auth.
- SAML assertions validated; JWTs signed with `SECRET_KEY`.
- CORS restricted to configured origins; secure cookies in production.

---

## License

[Include your license here.]
