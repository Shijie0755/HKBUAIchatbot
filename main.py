import subprocess
import sys
import os
import time
import webbrowser
import signal

# 进程列表，用于最后统一关闭
processes = []

def start_backend():
    """启动 FastAPI 后端"""
    print("🐍 [1/2] Starting FastAPI Backend...")
    backend_dir = os.path.join(os.getcwd(), "backend")
    # 自动识别虚拟环境中的 python 路径
    python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe") if os.name == 'nt' else os.path.join(backend_dir, "venv", "bin", "python")
    
    if not os.path.exists(python_exe):
        print("❌ Error: Virtual environment not found. Please run setup_all.py first!")
        return None

    # 启动命令
    cmd = f'"{python_exe}" -m uvicorn main:app --reload --port 8000'
    p = subprocess.Popen(cmd, shell=True, cwd=backend_dir)
    return p

def start_frontend():
    """启动 React 前端"""
    print("⚛️ [2/2] Starting React Frontend...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("❌ Error: node_modules not found. Please run setup_all.py first!")
        return None

    # 启动命令
    p = subprocess.Popen("npm run dev", shell=True, cwd=frontend_dir)
    return p

def main():
    print("=" * 50)
    print("🌟 HKBU Chatbot Workstation - Unified Launcher")
    print("=" * 50)

    # 1. 启动后端
    backend_p = start_backend()
    if backend_p: processes.append(backend_p)

    # 2. 启动前端
    frontend_p = start_frontend()
    if frontend_p: processes.append(frontend_p)

    if len(processes) < 2:
        print("🛑 Startup failed. Please check the errors above.")
        return

    # 3. 等待几秒后自动打开浏览器
    print("\n⏳ Waiting for services to initialize...")
    time.sleep(5)
    print("🌐 Opening browser to http://localhost:5173")
    webbrowser.open("http://localhost:5173")

    print("\n" + "!" * 50)
    print("🔥 App is RUNNING! Press Ctrl+C to stop all services.")
    print("!" * 50 + "\n")

    try:
        # 保持主进程运行
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all services...")
        for p in processes:
            if os.name == 'nt':
                # Windows 下优雅地结束子进程树
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)])
            else:
                p.terminate()
        print("✅ Cleanup complete. Goodbye, Jiafu!")

if __name__ == "__main__":
    main()