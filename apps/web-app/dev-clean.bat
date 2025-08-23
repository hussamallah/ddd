@echo off
echo 🧹 Cleaning up any existing development servers...

REM Stop all Node.js processes
taskkill /f /im node.exe >nul 2>&1

REM Clear build cache
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cleared .next build cache
)

REM Clear webpack cache if it exists
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cleared webpack cache
)

echo 🚀 Starting clean development server...
echo 💡 Use Ctrl+C to stop the server cleanly

REM Start the development server
npm run dev
