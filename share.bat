@echo off
echo Starting Ngrok Tunnels...
echo.
echo IMPORTANT: You must have an Ngrok Authtoken configured.
echo 1. If you haven't, get it from https://dashboard.ngrok.com/get-started/your-authtoken
echo 2. Run: npx ngrok config add-authtoken <YOUR_TOKEN>
echo.
echo Starting tunnels for Frontend (3000) and Backend (5000)...
cd frontend
npx ngrok start --all --config=../ngrok.yml
pause
