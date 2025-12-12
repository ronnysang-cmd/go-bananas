#!/bin/bash
# Keep the app running in background

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Start app with PM2
pm2 start server.js --name "go-bananas"
pm2 save
pm2 startup

echo "🍌 Go Bananas is now running in background!"
echo "📱 Access: http://localhost:3000/access"
echo "🌐 Network: http://$(hostname -I | awk '{print $1}'):3000/access"
echo ""
echo "Commands:"
echo "  pm2 status        - Check status"
echo "  pm2 stop go-bananas - Stop app"
echo "  pm2 restart go-bananas - Restart app"