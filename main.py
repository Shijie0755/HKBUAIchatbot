import subprocess
import os
import sys
import time
import webbrowser
import signal

def launch():
    # 1. 确定路径
    root_dir = os.getcwd()
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # 2. 找到 Python 虚拟环境执行文件
    python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe") if os.name == 'nt' else os.path.join(backend_dir, "venv", "bin", "python")
    
    if not os.path.exists(python_exe):
        print("❌ Error: venv not found. Please run setup_all.py first!")
        return

    print("=" * 50)
    print("🤖 HKBU Smart Chatbot - Unified Launcher")
    print("=" * 50)

    # 3. 启动后端 (8000 端口)
    print("\n[1/2] Launching Backend Server...")
    # 使用 creationflags=subprocess.CREATE_NEW_CONSOLE 让它在独立窗口运行，方便看日志
    backend_proc = subprocess.Popen(
        f'"{python_exe}" -m uvicorn main:app --reload --port 8000',
        shell=True,
        cwd=backend_dir,
        creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
    )

    # 4. 启动前端 (5173 端口)
    print("[2/2] Launching Frontend (Vite)...")
    frontend_proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        cwd=frontend_dir,
        creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
    )

    # 5. 自动弹出浏览器
    print("\n⏳ Initializing services...")
    time.sleep(3)  # 给系统一点喘息时间
    url = "http://localhost:5173"
    print(f"🌐 Opening browser to {url}")
    webbrowser.open(url)

    print("\n" + "★" * 50)
    print("  SUCCESS: Both systems are now live!")
    print("  - Backend: http://127.0.0.1:8000")
    print("  - Frontend: http://localhost:5173")
    print("  Close the two new windows to stop the servers.")
    print("  Press Ctrl+C in THIS window to exit this launcher.")
    print("★" * 50)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping launcher...")

if __name__ == "__main__":
    launch()