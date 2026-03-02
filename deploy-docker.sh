#!/bin/bash

# Load configuration
source ./deploy-config.sh

# Image and Archive Names
IMAGE_NAME="voicedish"
IMAGE_TAG="latest"
TAR_FILE="$IMAGE_NAME.tar"

# Step 1: Build Docker Image Locally (targeting Linux AMD64)
echo "🐳 Building Docker Image Locally (linux/amd64)..."
docker build --platform linux/amd64 -t $IMAGE_NAME:$IMAGE_TAG .

# Step 2: Save Image to Tarball
echo "📦 Saving Image to Tarball..."
docker save -o $TAR_FILE $IMAGE_NAME:$IMAGE_TAG

# Step 3: Upload Tarball to Server
echo "🚀 Uploading Image to Server..."
echo "Server Target: $SSH_USER@$SSH_IP:/tmp/$TAR_FILE"
scp -i "$SSH_KEY" $TAR_FILE "$SSH_USER@$SSH_IP:/tmp/$TAR_FILE"

# Step 4: Execute Remote Commands
echo "🔄 Deploying on Server..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_IP" << EOF
    # Setup Deployment Directory
    mkdir -p $DEPLOY_DIR

    # Load Docker Image
    echo "📥 Loading Docker Image..."
    docker load -i /tmp/$TAR_FILE
    
    # Stop and Remove Existing Container
    echo "🛑 Stopping existing container..."
    docker stop $IMAGE_NAME || true
    docker rm $IMAGE_NAME || true

    # Ensure .env exists (copy example if not)
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        echo "⚠️ .env file missing in $DEPLOY_DIR! Creating empty one..."
        touch $DEPLOY_DIR/.env
        echo "Please edit $DEPLOY_DIR/.env with your secrets!"
    fi

    # Run New Container
    echo "▶️ Running new container..."
    docker run -d \\
        --name $IMAGE_NAME \\
        --restart unless-stopped \\
        -p 3000:3000 \\
        -v $DEPLOY_DIR/.env:/app/.env \\
        -v $DEPLOY_DIR/orders.db:/app/orders.db \\
        $IMAGE_NAME:$IMAGE_TAG

    # Cleanup Remote Tar
    rm /tmp/$TAR_FILE
    echo "✅ Docker Deployment Complete!"
EOF

# Cleanup Local Tar
rm $TAR_FILE
echo "🧹 Local cleanup done."
