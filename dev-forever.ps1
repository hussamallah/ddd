# Always Running NPM Dev Script
Write-Host "Starting always-running npm dev server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Starting dev server..." -ForegroundColor Cyan
        
        # Run the dev command
        npm run dev
        
        Write-Host ""
        Write-Host "[$timestamp] Dev server stopped. Restarting in 3 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        Write-Host ""
    }
    catch {
        Write-Host "Error occurred: $_" -ForegroundColor Red
        Write-Host "Restarting in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}
