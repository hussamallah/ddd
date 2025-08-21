@echo off
echo Starting phone-accessible npm dev server...
echo.
echo This will make your dev server accessible from your phone!
echo.
echo Your computer's IP address(es):
ipconfig | findstr "IPv4"
echo.
echo Use one of these IP addresses + :3000 on your phone
echo Example: http://192.168.1.100:3000
echo.
echo Press Ctrl+C to stop

:loop
echo.
echo [%date% %time%] Starting phone-accessible dev server...
npm run dev:phone
echo.
echo [%date% %time%] Dev server stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
