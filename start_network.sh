#!/bin/bash

# Get local IP address
IP=$(hostname -I | awk '{print $1}')

echo "🍌 Starting Go Bananas App..."
echo "📱 Access from this device: http://localhost:5500"
echo "🌐 Access from other devices: http://$IP:5500"
echo ""

# Start the server
node server.js