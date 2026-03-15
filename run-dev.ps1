# run-dev.ps1
# Script to run both backend and frontend development servers

$RootPath = Get-Location

Write-Host "--- Starting on-call-agent Dev Environment ---" -ForegroundColor Cyan

# Start Backend
Write-Host "[1/2] Launching Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Starting Backend...'; uv run uvicorn app.main:app --reload" -WindowStyle Normal

# Start Frontend
Write-Host "[2/2] Launching Frontend (Vite + React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Starting Frontend...'; pnpm dev" -WindowStyle Normal

Write-Host "`nServers are starting in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173 (default Vite port)"
