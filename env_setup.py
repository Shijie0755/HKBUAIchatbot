import subprocess
import sys
import os
import shutil

def run_command(command, cwd=None):
    """运行终端命令并实时打印输出"""
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            cwd=cwd
        )
        for line in process.stdout:
            print(line, end='')
        process.wait()
        return process.returncode == 0
    except Exception as e:
        print(f"❌ Execution failed: {e}")
        return False

def setup():
    print("=" * 50)
    print("🚀 HKBU Chatbot - Professional Environment Setup")
    print("=" * 50)

    # 1. 检查 Python 版本 (需 >= 3.8)
    if sys.version_info < (3, 8):
        print(f"❌ Error: Python 3.8+ is required. Your version: {sys.version}")
        return

    # 2. 检查 Node.js
    if not shutil.which("npm"):
        print("❌ Error: npm (Node.js) not found. Please install it first.")
        return
    print("✅ System environment check passed.\n")

    # 3. 后端环境配置
    print("[1/2] Configuring Backend...")
    backend_dir = os.path.join(os.getcwd(), "backend")
    venv_dir = os.path.join(backend_dir, "venv")
    
    # 创建虚拟环境
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        run_command(f'"{sys.executable}" -m venv venv', cwd=backend_dir)
    
    # 安装 Python 依赖
    pip_path = os.path.join(venv_dir, "Scripts", "pip.exe") if os.name == 'nt' else os.path.join(venv_dir, "bin", "pip")
    print("Installing Python dependencies...")
    run_command(f'"{pip_path}" install --upgrade pip', cwd=backend_dir)
    run_command(f'"{pip_path}" install -r requirements.txt', cwd=backend_dir)

    print("\n" + "-" * 30 + "\n")

    # 4. 前端环境配置
    print("[2/2] Configuring Frontend...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("Running npm install (this may take a while)...")
        run_command("npm install", cwd=frontend_dir)
    else:
        print("✅ node_modules already exists. Skipping.")

    print("\n" + "=" * 50)
    print("🎉 SETUP SUCCESSFUL! You can now run main.bat")
    print("=" * 50)

if __name__ == "__main__":
    setup()