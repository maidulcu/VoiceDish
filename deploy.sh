#!/bin/bash

# Load configuration
source ./deploy-config.sh

echo "🚀 Deploying VoiceDish to Server..."
echo "Server: $SSH_USER@$SSH_IP"
echo "Target Dir: $DEPLOY_DIR"

# SSH Command to execute on server
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_IP" << EOF
    # Ensure directory exists
    if [ ! -d "$DEPLOY_DIR" ]; then
        echo "📂 Directory not found. Cloning repository..."
        git clone $REPO_URL $DEPLOY_DIR
    else
        echo "📂 Directory exists. pulling latest changes..."
        cd $DEPLOY_DIR
        git pull origin $BRANCH
    fi

    cd $DEPLOY_DIR

    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --production

    # Setup .env if missing (You should manually configure this first time)
    if [ ! -f .env ]; then
        echo "⚠️ .env file missing! Copying example..."
        cp .env.example .env
        echo "❗ Please remember to edit .env with real secrets!"
    fi

    # Database Setup (Create empty if missing)
    # The app will create tables on start, but let's ensure permissions are fine
    touch orders.db

    # Restart Application
    echo "🔄 Restarting Service..."
    # Check if process exists in PM2
    if pm2 list | grep -q "voicedish"; then
        pm2 restart voicedish
    else
        echo "Starting new PM2 process..."
        pm2 start src/index.js --name "voicedish"
    fi

    echo "✅ Deployment Complete!"
EOF
