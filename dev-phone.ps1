# Phone-Accessible NPM Dev Script
Write-Host "Starting phone-accessible npm dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "This will make your dev server accessible from your phone!" -ForegroundColor Cyan
Write-Host ""

# Get and display network information
Write-Host "Your computer's IP address(es):" -ForegroundColor Yellow
try {
    $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
    foreach ($ip in $ipAddresses) {
        Write-Host "  $($ip.IPAddress):3000" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not retrieve IP addresses automatically" -ForegroundColor Red
}

Write-Host ""
Write-Host "Use one of these IP addresses + :3000 on your phone" -ForegroundColor Cyan
Write-Host "Example: http://192.168.1.100:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Starting phone-accessible dev server..." -ForegroundColor Cyan
        
        # Run the phone-accessible dev command
        npm run dev:phone
        
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
