#!/bin/bash

# Load configuration
source ./deploy-config.sh

# Zip Name
APP_NAME="voicedish"
ZIP_FILE="${APP_NAME}.zip"

# Clean up previous zip if exists
rm $ZIP_FILE 2>/dev/null

echo "🤐 Zipping source code..."

# Create a temporary directory for clean packaging
TEMP_DIR="build_temp"
mkdir -p $TEMP_DIR

# Copy necessary files to temp dir
# This ensures we only include what we want, avoiding complex exclude patterns
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/ 2>/dev/null
cp Dockerfile $TEMP_DIR/
cp server-deploy.sh $TEMP_DIR/
# Copy src directory
cp -r src $TEMP_DIR/
# Add executable permissions to server-deploy.sh
chmod +x $TEMP_DIR/server-deploy.sh

# Create the zip from the temp directory content
cd $TEMP_DIR
zip -r ../$ZIP_FILE .
cd ..

# Cleanup temp dir
rm -rf $TEMP_DIR

echo "📦 Zip created: $ZIP_FILE"

echo "🚀 Uploading Zip to Server..."
echo "Server: $SSH_USER@$SSH_IP"
echo "Target: /tmp/$ZIP_FILE"

scp -i "$SSH_KEY" $ZIP_FILE "$SSH_USER@$SSH_IP:/tmp/$ZIP_FILE"

echo "🔄 Deploying on Server..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_IP" << EOF
    # Setup Deployment Directory
    mkdir -p $DEPLOY_DIR
    
    # 1. Unzip
    echo "📂 Unzipping to $DEPLOY_DIR..."
    unzip -o /tmp/$ZIP_FILE -d $DEPLOY_DIR
    
    # 2. Execute Server Deploy Script
    echo "▶️ Running Server Setup..."
    cd $DEPLOY_DIR
    # Ensure script is executable
    chmod +x server-deploy.sh
    ./server-deploy.sh

    # 3. Cleanup Remote Zip
    rm /tmp/$ZIP_FILE
    echo "✅ Zip Deployment Complete!"
EOF

# Cleanup Local
rm $ZIP_FILE
echo "🧹 Local cleanup done."
