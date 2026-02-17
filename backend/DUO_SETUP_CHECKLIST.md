# Duo SAML Setup Checklist

Follow these steps to configure your `.env` file with Duo SAML settings.

## Step 1: Access Duo Admin Panel

1. Go to: https://admin.duosecurity.com
2. Log in with your Duo admin credentials

## Step 2: Create SAML Application

1. Click **Applications** in the left sidebar
2. Click **Protect an Application** button
3. Search for: `Generic SAML Service Provider`
4. Click **Protect** next to it

## Step 3: Configure Application Settings

### Basic Information:
- **Name**: `Meraki Admin JIT` (or your preferred name)
- **Entity ID**: `urn:meraki-admin-jit:saml`

### Service Provider URLs:

**⚠️ IMPORTANT: These URLs will change each time you restart ngrok!**

For local development, you need to:
1. Start ngrok: `ngrok http 5001`
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
3. Update these URLs in Duo:

- **Assertion Consumer Service (ACS) URL**:
  ```
  https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/acs
  ```
  Example: `https://abc123def456.ngrok-free.app/api/auth/saml/acs`

- **Single Logout URL (optional)**:
  ```
  https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/sls
  ```

- **Service Provider Login URL**:
  ```
  https://YOUR-NGROK-URL.ngrok-free.app/api/auth/saml/login
  ```

### NameID Format:
- Select: `Email Address` or `Persistent`

### Signature Options:
- ✅ **Sign Response**: Enabled
- ✅ **Sign Assertion**: Enabled

### Attributes (Optional but Recommended):

Map these attributes to send user information:
- `name` → User's full name
- `email` → User's email address
- `givenName` → First name
- `sn` → Last name
- `organization` → Organization name
- `role` → User role/group

Click **Save Configuration**

## Step 4: Copy Duo Values to .env

After saving, you'll see these values in Duo. Copy them to your `backend/.env` file:

### 1. Entity ID
In Duo, look for: **Entity ID** or **IdP Entity ID**

Copy this to `.env`:
```bash
DUO_ENTITY_ID=https://sso-abc123.sso.duosecurity.com
```

### 2. Single Sign-On URL
In Duo, look for: **Single Sign-On URL** or **SSO URL**

Copy this to `.env`:
```bash
DUO_SSO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/sso
```

### 3. Single Logout URL
In Duo, look for: **Single Logout URL** or **SLO URL**

Copy this to `.env`:
```bash
DUO_SLO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/slo
```

### 4. X.509 Certificate
In Duo, look for: **X.509 Certificate** or **Certificate**

You'll see something like:
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL...
(multiple lines)
...ending text
-----END CERTIFICATE-----
```

**⚠️ IMPORTANT**: Copy ONLY the certificate content (not the BEGIN/END lines) as a **SINGLE LINE** (remove all line breaks):

Copy to `.env`:
```bash
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgIJAKL0YjefUpaSDFJKSD...rest of cert without line breaks..."
```

## Step 5: Update .env File

Edit `backend/.env` and update these sections:

```bash
# 1. Update your ngrok URL (after starting ngrok)
APP_URL=https://abc123.ngrok-free.app

# 2. Add ngrok URL to CORS
ALLOWED_ORIGINS=http://localhost:3000,https://abc123.ngrok-free.app

# 3. Paste Duo values
DUO_ENTITY_ID=https://sso-abc123.sso.duosecurity.com
DUO_SSO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/sso
DUO_SLO_URL=https://sso-abc123.sso.duosecurity.com/saml2/sp/DXXXXXXXXX/slo
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgIJAKL...entire cert as single line..."

# 4. Generate and set a secure SECRET_KEY
# Run: openssl rand -hex 32
SECRET_KEY=your-generated-secret-key-here
```

## Step 6: Assign Users in Duo

1. In Duo Admin Panel, go to your SAML application
2. Click the **Users** tab
3. Add users who should have access
4. Save changes

## Step 7: Test Configuration

1. **Start ngrok**:
   ```bash
   ngrok http 5001
   ```

2. **Verify your .env file**:
   - APP_URL matches ngrok HTTPS URL
   - All DUO_* variables are filled in
   - DUO_X509_CERT has no line breaks

3. **Start backend**:
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```

4. **Check for warnings**:
   - No warnings about missing DUO_ variables
   - Server starts successfully

5. **Start frontend**:
   ```bash
   cd app
   npm start
   ```

6. **Test login**:
   - Open http://localhost:3000
   - Click "Sign In with Duo SSO"
   - Should redirect to Duo login
   - After authentication, should redirect back to app

## Troubleshooting

### Certificate Format Issues

❌ **Wrong** (has line breaks):
```bash
DUO_X509_CERT="MIIDXTCCAkWg
AwIBAgIJAKL0
YjefUpaSDFJ"
```

✅ **Correct** (single line):
```bash
DUO_X509_CERT="MIIDXTCCAkWgAwIBAgIJAKL0YjefUpaSDFJ..."
```

### URL Mismatches

Make sure:
- Duo ACS URL **exactly** matches: `https://your-ngrok-url/api/auth/saml/acs`
- No trailing slashes
- HTTPS (not HTTP)
- Includes full path `/api/auth/saml/acs`

### ngrok URL Changed

Every time you restart ngrok:
1. Note new ngrok HTTPS URL
2. Update Duo ACS URL in Duo Admin Panel
3. Update APP_URL in backend/.env
4. Update ALLOWED_ORIGINS in backend/.env
5. Restart backend server

## Quick Reference

**Files to Edit:**
- `backend/.env` - Your configuration file

**Duo Admin Panel:**
- https://admin.duosecurity.com

**ngrok Command:**
```bash
ngrok http 5001
```

**Start Backend:**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Generate SECRET_KEY:**
```bash
openssl rand -hex 32
```

---

**Need Help?** Check:
- SAML_SETUP.md - Complete setup guide
- NGROK_SETUP.md - ngrok troubleshooting
- backend/README.md - Backend documentation

