@echo off
REM Stop and remove containers for the development compose file
cd /d "%~dp0"
echo Stopping frontend (docker compose -f docker-compose.dev.yml down)...
docker compose -f docker-compose.dev.yml down
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: docker compose down failed. Check Docker Desktop or run the command manually for details.
  pause
  exit /b %ERRORLEVEL%
)
echo.
echo Frontend stopped and removed.
pause
