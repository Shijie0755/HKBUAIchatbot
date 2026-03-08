@echo off
:: 启动后端
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

:: 启动前端
start cmd /k "cd frontend && npm run dev"