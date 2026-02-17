"""
Meraki Admin JIT - Backend Application

Flask application providing SAML SSO authentication with Duo Security
for Just-in-Time admin access provisioning.
"""

from flask import Flask, jsonify, session
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv
import os
import logging
from datetime import timedelta

# Load environment variables
load_dotenv()

# Import routes
from routes.auth import auth_bp
from routes.meraki import meraki_bp


def create_app():
    """
    Application factory function.
    Creates and configures the Flask application.
    """
    app = Flask(__name__)
    
    # ===================
    # Configuration
    # ===================
    
    # Secret key for session management
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Session configuration
    app.config['SESSION_TYPE'] = os.getenv('SESSION_TYPE', 'filesystem')
    app.config['SESSION_PERMANENT'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = os.getenv('SESSION_COOKIE_HTTPONLY', 'true').lower() == 'true'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(
        seconds=int(os.getenv('PERMANENT_SESSION_LIFETIME', 43200))  # Default 12 hours
    )

    # When frontend (e.g. localhost) and backend (e.g. ngrok) are different origins, the browser
    # will not send a SameSite=Lax cookie on fetch(). Use SameSite=None; Secure so the cookie
    # is sent on cross-origin requests and the callback can confirm the session.
    app_url = os.getenv('APP_URL', '')
    if app_url.startswith('https://') or 'ngrok' in app_url:
        app.config['SESSION_COOKIE_SAMESITE'] = 'None'
        app.config['SESSION_COOKIE_SECURE'] = True
    else:
        app.config['SESSION_COOKIE_SAMESITE'] = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
        app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    
    # Optional: Redis session store
    if app.config['SESSION_TYPE'] == 'redis':
        app.config['SESSION_REDIS'] = os.getenv('SESSION_REDIS', 'redis://localhost:6379')
    
    # ===================
    # CORS Configuration
    # ===================
    
    # Get allowed origins from environment
    allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    
    CORS(app, 
         origins=allowed_origins,
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # ===================
    # Session Management
    # ===================
    
    Session(app)
    
    # ===================
    # Logging Configuration
    # ===================
    
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting Meraki Admin JIT Backend in {os.getenv('FLASK_ENV', 'development')} mode")
    
    # ===================
    # Register Blueprints
    # ===================
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(meraki_bp)
    
    # ===================
    # Health Check Endpoint
    # ===================
    
    @app.route('/health')
    def health_check():
        """Health check endpoint for monitoring"""
        return jsonify({
            'status': 'healthy',
            'service': 'meraki-admin-jit-backend',
            'environment': os.getenv('FLASK_ENV', 'development')
        })
    
    @app.route('/')
    def index():
        """Root endpoint"""
        return jsonify({
            'service': 'Meraki Admin JIT Backend',
            'version': '1.0.0',
            'status': 'running',
            'authentication': 'SAML SSO with Duo Security',
            'endpoints': {
                'health': '/health',
                'saml_login': '/api/auth/saml/login',
                'saml_acs': '/api/auth/saml/acs',
                'current_user': '/api/auth/me',
                'logout': '/api/auth/logout',
                'metadata': '/api/auth/metadata'
            }
        })
    
    # ===================
    # Error Handlers
    # ===================
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        logger.error(f"Internal server error: {str(error)}")
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 errors"""
        return jsonify({'error': 'Unauthorized'}), 401
    
    # ===================
    # Request/Response Logging
    # ===================
    
    @app.before_request
    def log_request():
        """Log incoming requests"""
        from flask import request
        logger.debug(f"{request.method} {request.path} from {request.remote_addr}")
    
    @app.after_request
    def log_response(response):
        """Log responses and add security headers"""
        from flask import request
        
        # Log response
        logger.debug(f"{request.method} {request.path} -> {response.status_code}")
        
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        return response
    
    return app


# ===================
# Application Entry Point
# ===================

if __name__ == '__main__':
    app = create_app()
    
    # Get configuration from environment
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    # Print startup information
    print("\n" + "="*50)
    print("🚀 Meraki Admin JIT Backend Starting...")
    print("="*50)
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Debug Mode: {debug}")
    print(f"Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}")
    print(f"App URL: {os.getenv('APP_URL', 'http://localhost:5001')}")
    print("\n📝 Available Endpoints:")
    print(f"  Health Check: http://{host}:{port}/health")
    print(f"  SAML Login:   http://{host}:{port}/api/auth/saml/login")
    print(f"  Current User: http://{host}:{port}/api/auth/me")
    print(f"  Logout:       http://{host}:{port}/api/auth/logout")
    print(f"  Metadata:     http://{host}:{port}/api/auth/metadata")
    print("="*50 + "\n")
    
    # Verify environment variables
    if not os.getenv('SECRET_KEY') or os.getenv('SECRET_KEY') == 'your-super-secret-key-change-this-in-production':
        print("⚠️  WARNING: Using default SECRET_KEY. Set a secure SECRET_KEY in .env file!")
    
    if not os.getenv('DUO_ENTITY_ID'):
        print("⚠️  WARNING: DUO_ENTITY_ID not set. Configure Duo settings in .env file!")
    
    if not os.getenv('DUO_SSO_URL'):
        print("⚠️  WARNING: DUO_SSO_URL not set. Configure Duo settings in .env file!")
    
    if not os.getenv('DUO_X509_CERT'):
        print("⚠️  WARNING: DUO_X509_CERT not set. Configure Duo certificate in .env file!")
    
    print("\n💡 Remember to:")
    print(f"  1. Start ngrok: ngrok http {port}")
    print("  2. Update APP_URL in .env with ngrok URL")
    print("  3. Update Duo ACS URL with: <ngrok-url>/api/auth/saml/acs")
    print("  4. Restart this server after changing .env")
    print("\n")
    
    # Run the application
    app.run(host=host, port=port, debug=debug)

