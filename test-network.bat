@echo off
echo Testing network configuration for phone access...
echo.
echo 1. Checking if port 3000 is available...
netstat -an | findstr :3000
echo.
echo 2. Your computer's IP addresses:
ipconfig | findstr "IPv4"
echo.
echo 3. Testing localhost access...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo    Localhost:3000 - OK
) else (
    echo    Localhost:3000 - NOT ACCESSIBLE (start dev server first)
)
echo.
echo 4. To start phone-accessible dev server:
echo    - Double-click dev-phone.bat
echo    - Or run: npm run dev:phone
echo.
echo 5. Then access from your phone using:
echo    http://YOUR_IP:3000
echo.
pause
