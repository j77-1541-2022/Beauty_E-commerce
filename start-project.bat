@echo off
setlocal

title Glow Beyond Beauty - Startup

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV=%ROOT%venv"
set "PYTHON_EXE=%VENV%\Scripts\python.exe"

echo ================================================
echo   Glow Beyond Beauty - Project Startup
echo ================================================
echo.

where python >nul 2>&1
if errorlevel 1 goto :no_python

where node >nul 2>&1
if errorlevel 1 goto :no_node

where npm >nul 2>&1
if errorlevel 1 goto :no_npm

if not exist "%BACKEND%\manage.py" goto :missing_backend
if not exist "%FRONTEND%\package.json" goto :missing_frontend

if exist "%PYTHON_EXE%" goto :venv_ok
echo [INFO] Creating Python virtual environment...
python -m venv "%VENV%"
if errorlevel 1 goto :venv_fail

:venv_ok
echo [INFO] Ensuring backend dependencies are installed...
"%PYTHON_EXE%" -m pip install -r "%BACKEND%\requirements.txt"
if errorlevel 1 goto :pip_fail

if exist "%FRONTEND%\node_modules" goto :frontend_deps_ok
echo [INFO] Installing frontend dependencies (first run)...
pushd "%FRONTEND%"
npm install
if errorlevel 1 (
    popd
    goto :npm_install_fail
)
popd

:frontend_deps_ok
echo [INFO] Starting backend at http://localhost:8000 ...
powershell -NoProfile -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location -LiteralPath ''%BACKEND%''; & ''%PYTHON_EXE%'' manage.py runserver'"

echo [INFO] Starting frontend at http://localhost:3001 ...
powershell -NoProfile -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location -LiteralPath ''%FRONTEND%''; npm run dev -- --host --port 3001'"

echo [INFO] Opening frontend in your default browser...
start "" "http://localhost:3001"

echo.
echo [DONE] Backend and frontend startup commands launched.
echo You can close this window; servers run in their own terminals.
echo.
pause
exit /b 0

:no_python
echo [ERROR] Python is not installed or not on PATH.
pause
exit /b 1

:no_node
echo [ERROR] Node.js is not installed or not on PATH.
pause
exit /b 1

:no_npm
echo [ERROR] npm is not installed or not on PATH.
pause
exit /b 1

:missing_backend
echo [ERROR] Could not find backend\manage.py.
echo Make sure this batch file stays in the project root.
pause
exit /b 1

:missing_frontend
echo [ERROR] Could not find frontend\package.json.
echo Make sure this batch file stays in the project root.
pause
exit /b 1

:venv_fail
echo [ERROR] Failed to create virtual environment.
pause
exit /b 1

:pip_fail
echo [ERROR] Failed to install backend dependencies.
pause
exit /b 1

:npm_install_fail
echo [ERROR] Failed to install frontend dependencies.
pause
exit /b 1
