# Mahoraga Dashboard Quick Start
# Run this script to start the dashboard: .\start-dashboard.ps1

$env:MAHORAGA_TOKEN = "Y0ILrlD0kzwD67wKgnokrS/hvOTOqiFZSqzyKGtCAKcDLqr6N+NGzqBtOb7v/Yie"
$env:MAHORAGA_API_URL = "https://mahoraga.samuelsmith442.workers.dev"

Write-Host "Starting Mahoraga Dashboard..." -ForegroundColor Cyan
Write-Host "Worker:    $env:MAHORAGA_API_URL" -ForegroundColor Gray
Write-Host "Dashboard: http://localhost:3000" -ForegroundColor Green
Write-Host ""

Set-Location -Path "$PSScriptRoot\dashboard"
npm run dev
