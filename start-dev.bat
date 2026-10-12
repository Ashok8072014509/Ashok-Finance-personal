@echo off
echo Starting Ashok Finance Systems...
echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
start "Ashok Finance Backend" cmd /k "cd backend && python main.py"
echo.
echo Starting React Vite Frontend on http://localhost:5173 ...
start "Ashok Finance Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo All systems started! You can close this window.
