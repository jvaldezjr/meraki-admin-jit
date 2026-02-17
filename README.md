# Meraki Admin JIT

Just-in-Time (JIT) Provisioning of Meraki Dashboard Admin Privileges

A secure web application for managing time-limited administrative access to Cisco Meraki Dashboard, with SAML SSO authentication via Duo Security.

## Features

- 🔐 **SAML SSO Authentication** with Duo Security multi-factor authentication
- ⏱️ **Just-in-Time Access** - Request and grant temporary admin privileges
- 📊 **Access Tracking** - View current access, approval workflow, and change logs
- 🎨 **Modern UI** - Built with Cisco Magnetic Design System components
- 🔒 **Secure by Default** - All routes protected, session-based authentication

## Quick Start

### Current Status

✅ **Frontend**: Fully implemented with authentication UI, protected routes, and Magnetic components  
⚠️ **Backend**: Needs to be implemented (see [SAML_SETUP.md](SAML_SETUP.md))

### Prerequisites

- Node.js 14+ and npm
- Python 3.8+ (for backend - to be created)
- ngrok account (free tier sufficient)
- Duo Security account with SSO enabled

### Running the Frontend (What's Already Built)

1. **Install Frontend Dependencies**:
   ```bash
   cd app
   npm install
   ```

2. **Start React Development Server**:
   ```bash
   npm start
   ```

3. **View in Browser**:
   - Open `http://localhost:3000`
   - You'll see the login page (authentication won't work yet without backend)

### Setting Up Complete Authentication (Backend Required)

To enable full SAML SSO authentication with Duo:

1. **Set Up ngrok** (Required for SAML):
   ```bash
   # Install ngrok
   brew install ngrok  # macOS
   
   # Authenticate
   ngrok config add-authtoken YOUR_TOKEN
   
   # Start tunnel (will need to be running when you create backend)
   ngrok http 5001
   ```
   
   📖 See **[NGROK_SETUP.md](NGROK_SETUP.md)** for detailed ngrok instructions

2. **Create and Configure Backend**:
   
   📖 See **[SAML_SETUP.md](SAML_SETUP.md)** for complete backend implementation guide
   
   You'll need to:
   - Create backend directory structure
   - Implement SAML authentication endpoints
   - Configure Duo SSO in Duo Admin Panel
   - Set up environment variables

3. **Once Backend is Created, Start All Servers**:
   ```bash
   # Terminal 1: Keep ngrok running
   ngrok http 5001
   
   # Terminal 2: Backend server (once created)
   cd backend
   python app.py
   
   # Terminal 3: React frontend
   cd app && npm start
   ```

4. **Access Application**:
   - Open browser to `http://localhost:3000`
   - Click "Sign In with Duo SSO"
   - Complete authentication
   - Full app functionality available!

## Project Structure

```
meraki-admin-jit/
├── app/                          # ✅ React frontend (COMPLETE)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AppHeader.js    # App header with user profile
│   │   │   ├── Layout.js       # Main layout wrapper
│   │   │   ├── Navigation.js   # Side navigation menu
│   │   │   └── ProtectedRoute.js # Auth wrapper for routes
│   │   ├── contexts/           
│   │   │   └── AuthContext.js  # Authentication state management
│   │   ├── pages/              # Application pages
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── CallbackPage.js
│   │   │   ├── MyAccessPage.js
│   │   │   ├── RequestAccessPage.js
│   │   │   ├── ApprovalsPage.js
│   │   │   ├── SnapshotsPage.js
│   │   │   ├── ChangeLogPage.js
│   │   │   └── AdminPage.js
│   │   └── App.js              # Main app component with routing
│   ├── package.json
│   └── env.example             # Environment variables template
├── backend/                     # ⚠️ Python backend (TO BE CREATED)
│   └── [See SAML_SETUP.md for implementation]
├── SAML_SETUP.md               # Complete SAML/Duo setup guide
├── NGROK_SETUP.md              # ngrok setup and troubleshooting
├── QUICK_START.md              # Quick reference cheat sheet
└── README.md                   # This file
```

## Documentation

- **[SAML_SETUP.md](SAML_SETUP.md)** - Complete guide for SAML SSO with Duo integration
- **[NGROK_SETUP.md](NGROK_SETUP.md)** - ngrok setup, daily workflow, and troubleshooting
- **[LICENSE](LICENSE)** - Project license

## Technology Stack

### Frontend
- **React** 17 - UI framework
- **React Router** 6 - Client-side routing
- **Cisco Magnetic** - Design system components
- **Create React App** - Build tooling

### Backend (⚠️ To Be Implemented)
- **Python** 3.8+ - Will need to be set up
- **Flask** or **FastAPI** - Web framework (your choice)
- **python3-saml** - SAML authentication library
- **PostgreSQL** - Database (optional for now)

### Authentication
- **SAML 2.0** - Authentication protocol
- **Duo Security** - Identity Provider (IdP) with MFA
- **Session-based auth** - Secure cookie sessions

## Development Workflow

### Current State - Frontend Only

Right now you can run the frontend to see the UI:

```bash
cd app
npm start
```

This will show you:
- Login page with Duo SSO button
- All the navigation and page layouts
- Protected route behavior (redirects to login)

However, authentication won't work until you implement the backend.

### Full Development Workflow (After Backend is Created)

1. Start ngrok (note the HTTPS URL)
2. Update Duo ACS URL if ngrok URL changed
3. Update backend `.env` with ngrok URL
4. Start backend server
5. Start React frontend
6. Develop and test with full authentication!

### When ngrok Restarts

Every time you restart ngrok, you must:
1. Note the new HTTPS URL
2. Update Duo Admin Panel with new ACS URL
3. Update backend `.env` file
4. Restart backend server

💡 **Tip**: Consider ngrok's paid plan for a reserved domain that never changes!

## Security Considerations

- ✅ All routes require authentication (except login)
- ✅ SAML assertions validated by backend
- ✅ Session cookies with HttpOnly and SameSite flags
- ✅ HTTPS required in production
- ✅ Duo MFA enforced for all logins
- ✅ No credentials stored in source code

## Contributing

1. Create a feature branch
2. Make your changes
3. Test authentication flow
4. Submit a pull request

## Troubleshooting

### Can't Access Application
- Verify all three terminals are running (ngrok, backend, frontend)
- Check ngrok URL is updated in Duo and backend `.env`
- Check browser console for errors

### SAML Authentication Fails
- Verify Duo ACS URL matches ngrok URL exactly
- Check backend logs for SAML validation errors
- Verify Duo X.509 certificate in `.env`

### Session Not Persisting
- Ensure `SESSION_COOKIE_SECURE=false` for local development
- Check browser cookies in DevTools
- Verify `SECRET_KEY` is set in backend `.env`

📖 See [SAML_SETUP.md](SAML_SETUP.md) and [NGROK_SETUP.md](NGROK_SETUP.md) for detailed troubleshooting.

## Support

For issues or questions:
- Check the documentation in `SAML_SETUP.md` and `NGROK_SETUP.md`
- Review Duo Admin Panel logs
- Check backend application logs
- Inspect browser console (F12)

## License

[Include your license here]

---

**Ready to get started?** Follow the Quick Start guide above or dive into [SAML_SETUP.md](SAML_SETUP.md) for detailed instructions!
