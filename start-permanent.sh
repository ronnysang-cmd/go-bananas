#!/bin/bash
# Start app permanently in background

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f ngrok 2>/dev/null

# Start server in background
nohup node server.js > server.log 2>&1 &
echo "Server started in background"

# Wait for server to start
sleep 3

# Start ngrok in background
nohup ./ngrok http 3000 > ngrok.log 2>&1 &
echo "Ngrok tunnel started"

# Wait and show the public URL
sleep 5
echo ""
echo "🍌 Go Bananas is now running permanently!"
echo "📱 Local: http://localhost:3000/access"
echo "🌐 Public URL: Check ngrok.log for the https URL"
echo ""
echo "To stop: pkill -f 'node.*server.js' && pkill -f ngrok"