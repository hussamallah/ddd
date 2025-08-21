@echo off
echo Starting always-running npm dev server...
echo Press Ctrl+C to stop

:loop
echo.
echo [%date% %time%] Starting dev server...
npm run dev
echo.
echo [%date% %time%] Dev server stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
