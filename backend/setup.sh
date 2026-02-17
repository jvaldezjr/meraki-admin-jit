#!/bin/bash

# Meraki Admin JIT Backend Setup Script
# This script helps you set up the backend environment quickly

set -e  # Exit on error

echo ""
echo "===================================="
echo "Meraki Admin JIT - Backend Setup"
echo "===================================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp env.example .env
    
    # Generate a random secret key
    SECRET_KEY=$(openssl rand -hex 32)
    
    # Update SECRET_KEY in .env (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-super-secret-key-change-this-in-production/$SECRET_KEY/" .env
    else
        sed -i "s/your-super-secret-key-change-this-in-production/$SECRET_KEY/" .env
    fi
    
    echo "✅ .env file created with random SECRET_KEY"
    echo ""
    echo "⚠️  IMPORTANT: You still need to configure:"
    echo "   - APP_URL (your ngrok HTTPS URL)"
    echo "   - DUO_ENTITY_ID"
    echo "   - DUO_SSO_URL"
    echo "   - DUO_X509_CERT"
    echo ""
    echo "   Edit .env file and fill in these values from Duo Admin Panel"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "===================================="
echo "✅ Setup Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo ""
echo "1. 🔧 Configure Duo SSO in Duo Admin Panel"
echo "   (See ../SAML_SETUP.md for instructions)"
echo ""
echo "2. 🌐 Start ngrok in a separate terminal:"
echo "   ngrok http 5000"
echo ""
echo "3. 📝 Update .env file with:"
echo "   - Your ngrok HTTPS URL (APP_URL)"
echo "   - Duo configuration values"
echo ""
echo "4. 🚀 Start the backend server:"
echo "   python app.py"
echo ""
echo "5. 💻 Start the frontend (in another terminal):"
echo "   cd ../app && npm start"
echo ""
echo "===================================="
echo ""

