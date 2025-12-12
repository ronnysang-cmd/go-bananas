# Public Access Setup

## Option 1: Router Port Forwarding (Recommended)
Your public IP: **196.223.170.90**

1. Access router admin: `192.168.1.1` or `192.168.0.1`
2. Add port forwarding rule:
   - External Port: 5500
   - Internal IP: 192.168.0.109
   - Internal Port: 5500
   - Protocol: TCP
3. Access globally: `http://196.223.170.90:5500`

## Option 2: ngrok (Requires Account)
1. Sign up: https://dashboard.ngrok.com/signup
2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run: `./ngrok config add-authtoken YOUR_TOKEN`
4. Run: `./ngrok http 5500`

## Current Access:
- Local: `http://localhost:5500`
- Network: `http://192.168.0.109:5500`