@echo off
echo Your computer's IP addresses for phone access:
echo.
ipconfig | findstr "IPv4"
echo.
echo Use any of these IP addresses + :3000 on your phone
echo Example: http://192.168.1.100:3000
echo.
pause
