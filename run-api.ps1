# run-api.ps1
# Script to run the backend FastAPI server independently

Write-Host "--- Starting on-call-agent Backend API ---" -ForegroundColor Cyan

# Change directory to backend
Set-Location -Path (Join-Path $PSScriptRoot "backend")

# Run FastAPI
Write-Host "Launching FastAPI at http://localhost:8000" -ForegroundColor Yellow
uv run uvicorn app.main:app --reload
