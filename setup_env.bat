@echo off
:: 切换代码页到 UTF-8，防止中文乱码
chcp 65001 >nul

echo ==================================================
echo   🚀 HKBU Chatbot Workstation - 自动环境配置
echo ==================================================
echo.

:: 1. 检查并安装后端依赖
echo [1/2] 正在配置后端 Python 环境...
if not exist "backend\requirements.txt" (
    echo ❌ 错误：未在 backend 目录下找到 requirements.txt 
    goto error
)

cd backend
:: 建议创建一个虚拟环境，防止污染系统 Python
if not exist "venv" (
    echo 正在创建虚拟环境...
    python -m venv venv
)
echo 正在激活虚拟环境并安装依赖... 
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo.
echo --------------------------------------------------
echo.

:: 2. 检查并安装前端依赖
echo [2/2] 正在配置前端 Node.js 环境...
if not exist "frontend\package.json" (
    echo ❌ 错误：未在 frontend 目录下找到 package.json 
    goto error
)

cd frontend
echo 正在运行 npm install，这可能需要几分钟，请稍候... 
call npm install
cd ..

echo.
echo ==================================================
echo ✅ 所有环境配置完成！
echo 现在你可以运行 main.bat 启动项目了。
echo ==================================================
pause
exit

:error
echo.
echo 🛑 配置过程中出现错误，请检查上述日志。
pause