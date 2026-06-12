@echo off
echo Starting MindTalk...
start "Proxy Server" cmd /k "cd /d "D:\Claude ai\MindTalk" && node proxy.js"
timeout /t 2
start "Expo App" cmd /k "cd /d "D:\Claude ai\MindTalk" && npx expo start --web --port 3000 --clear"
echo Both servers started. Open http://localhost:3000 in your browser.
