# Mahoraga Agent Testing Script
# Set your API token
$env:MAHORAGA_TOKEN = "Y0ILrlD0kzwD67wKgnokrS/hvOTOqiFZSqzyKGtCAKcDLqr6N+NGzqBtOb7v/Yie"
$WORKER_URL = "https://mahoraga.samuelsmith442.workers.dev"

Write-Host "=== Mahoraga Agent Testing ===" -ForegroundColor Cyan
Write-Host ""

# Enable the agent
Write-Host "1. Enabling agent..." -ForegroundColor Yellow
$enableResponse = Invoke-RestMethod -Uri "$WORKER_URL/agent/enable" -Headers @{"Authorization"="Bearer $env:MAHORAGA_TOKEN"} -Method GET
Write-Host "Response: $($enableResponse | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

# Check status
Write-Host "2. Checking agent status..." -ForegroundColor Yellow
$statusResponse = Invoke-RestMethod -Uri "$WORKER_URL/agent/status" -Headers @{"Authorization"="Bearer $env:MAHORAGA_TOKEN"} -Method GET
Write-Host "Enabled: $($statusResponse.enabled)" -ForegroundColor Green
Write-Host "Account Cash: $($statusResponse.account.cash)" -ForegroundColor Green
Write-Host "Crypto Enabled: $($statusResponse.config.crypto_enabled)" -ForegroundColor Green
Write-Host "Crypto Symbols: $($statusResponse.config.crypto_symbols -join ', ')" -ForegroundColor Green
Write-Host ""

# Check costs
Write-Host "3. Checking LLM costs..." -ForegroundColor Yellow
$costsResponse = Invoke-RestMethod -Uri "$WORKER_URL/agent/costs" -Headers @{"Authorization"="Bearer $env:MAHORAGA_TOKEN"} -Method GET
Write-Host "Total Cost: `$$($costsResponse.total_usd)" -ForegroundColor Green
Write-Host "API Calls: $($costsResponse.calls)" -ForegroundColor Green
Write-Host ""

# Trigger manual analysis
Write-Host "4. Triggering manual analysis..." -ForegroundColor Yellow
$triggerResponse = Invoke-RestMethod -Uri "$WORKER_URL/agent/trigger" -Headers @{"Authorization"="Bearer $env:MAHORAGA_TOKEN"} -Method GET
Write-Host "Response: $($triggerResponse | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

# View logs
Write-Host "5. Viewing recent logs..." -ForegroundColor Yellow
$logsResponse = Invoke-RestMethod -Uri "$WORKER_URL/agent/logs" -Headers @{"Authorization"="Bearer $env:MAHORAGA_TOKEN"} -Method GET
Write-Host "Recent activity:" -ForegroundColor Green
$logsResponse.logs | Select-Object -First 5 | ForEach-Object {
    Write-Host "  [$($_.timestamp)] $($_.action)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host "Worker URL: $WORKER_URL" -ForegroundColor White
Write-Host "Dashboard: Run 'cd dashboard && npm run dev' to start" -ForegroundColor White
Write-Host ""
Write-Host "Monitor your agent at: $WORKER_URL/agent/status" -ForegroundColor White
