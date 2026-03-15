# run-ui.ps1
# Script to run the frontend React UI independently

Write-Host "--- Starting on-call-agent Frontend UI ---" -ForegroundColor Cyan

# Change directory to frontend
Set-Location -Path (Join-Path $PSScriptRoot "frontend")

# Run Vite dev server
Write-Host "Launching Vite at http://localhost:5173" -ForegroundColor Yellow
pnpm dev
