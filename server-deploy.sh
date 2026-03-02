#!/bin/bash

APP_NAME="voicedish"
PORT="3000"

echo "🐳 Building Docker Image on Server..."
# Build the image using the Dockerfile in the current directory
docker build -t $APP_NAME .

echo "🛑 Stopping existing container..."
docker stop $APP_NAME || true
docker rm $APP_NAME || true

echo "▶️ Running container..."
# Ensure .env exists
if [ ! -f ".env" ]; then
    echo "⚠️ .env file missing! Creating empty one..."
    touch .env
fi

# Run with volume mounts
docker run -d \
    --name $APP_NAME \
    --restart unless-stopped \
    -p $PORT:3000 \
    -v $(pwd)/.env:/app/.env \
    -v $(pwd)/orders.db:/app/orders.db \
    $APP_NAME

echo "✅ Deployment Success! App is running on port $PORT"
