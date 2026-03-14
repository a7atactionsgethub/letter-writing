@echo off
setlocal
echo ------------------------------------------
echo Indian Letter Generator
echo ------------------------------------------
if not exist node_modules (
    echo [1/2] Installing dependencies...
    call npm install
)
echo [2/2] Starting development server...
echo The browser should open automatically at http://localhost:5173
call npm run dev
pause
