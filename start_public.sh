#!/bin/bash

echo "🍌 Starting Go Bananas with Public Access..."
echo ""

# Start the server in background
node server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Start ngrok tunnel
echo "🌐 Creating public tunnel..."
./ngrok http 5500 --log=stdout | grep -o 'https://[^[:space:]]*\.ngrok-free\.app' | head -1

# Keep server running
wait $SERVER_PID