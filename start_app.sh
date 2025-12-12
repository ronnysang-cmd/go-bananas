#!/bin/bash

echo "🍌 Starting Go Bananas App..."

# Kill any existing server on port 5500
lsof -ti:5500 | xargs kill -9 2>/dev/null || true

# Start the server in background
node server.js &
SERVER_PID=$!

# Wait for server to start
echo "Starting server..."
sleep 3

# Open browser
echo "Opening app in browser..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5500
elif command -v open > /dev/null; then
    open http://localhost:5500
else
    echo "Please open http://localhost:5500 in your browser"
fi

echo "🍌 Go Bananas is running!"
echo "Press Ctrl+C to stop the app"

# Wait for user to stop
trap "echo 'Stopping server...'; kill $SERVER_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait $SERVER_PID