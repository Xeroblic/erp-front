@echo off
REM Start development environment (build & run in background)
cd /d "%~dp0"
echo Starting frontend dev container (docker compose -f docker-compose.dev.yml up -d --build)...
docker compose -f docker-compose.dev.yml up -d --build
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: docker compose failed. Check Docker Desktop or run the command manually for details.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Frontend should be running at http://localhost:5173
echo To follow logs run: docker compose -f docker-compose.dev.yml logs -f frontend
pause
