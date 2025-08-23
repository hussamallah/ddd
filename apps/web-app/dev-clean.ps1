# Clean Development Server Startup Script
# This script prevents multiple dev servers from running simultaneously

Write-Host "🧹 Cleaning up any existing development servers..." -ForegroundColor Yellow

# Stop all Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear build cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cleared .next build cache" -ForegroundColor Green
}

# Clear webpack cache if it exists
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cleared webpack cache" -ForegroundColor Green
}

Write-Host "🚀 Starting clean development server..." -ForegroundColor Green
Write-Host "💡 Use Ctrl+C to stop the server cleanly" -ForegroundColor Cyan

# Start the development server
npm run dev
