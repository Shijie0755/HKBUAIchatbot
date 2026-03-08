import subprocess
import sys
import os
import shutil

def run_command(command, cwd=None):
    """运行系统命令"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd)
        return result.returncode == 0
    except Exception:
        return False

def auto_install(app_name, winget_id):
    """通用 winget 安装逻辑"""
    print(f"🌐 Attempting to install {app_name} via winget...")
    cmd = f"winget install {winget_id} --silent --accept-source-agreements --accept-package-agreements"
    if run_command(cmd):
        print(f"✅ {app_name} installation triggered! ")
        print(f"⚠️  IMPORTANT: You MUST RESTART your VS Code/Terminal after this finishes.")
        return True
    return False

def setup():
    print("=" * 60)
    print("🚀 HKBU Chatbot - GOD MODE SETUP (Python + Node + Venv)")
    print("=" * 60)

    # 1. 检查 Python 版本 (需 >= 3.8)
    current_ver = f"{sys.version_info.major}.{sys.version_info.minor}"
    print(f"🔍 Current Python: {current_ver}")
    
    if sys.version_info < (3, 8):
        print(f"❌ Your Python version ({current_ver}) is TOO OLD for FastAPI.")
        choice = input("Do you want me to install the latest Python 3.12 for you? (y/n): ")
        if choice.lower() == 'y':
            auto_install("Python 3.12", "Python.Python.3.12")
            print("\n[STOP] Please restart your computer/terminal after Python finishes installing.")
            return
        else:
            return

    # 2. 检查 Node.js/npm
    if not shutil.which("npm"):
        print("❓ npm not found.")
        choice = input("Install Node.js (LTS) automatically? (y/n): ")
        if choice.lower() == 'y':
            auto_install("Node.js", "OpenJS.NodeJS.LTS")
            print("\n[STOP] Restart terminal after Node.js finishes installing.")
            return
    else:
        print("✅ Node.js detected.")

    # 3. 后端环境配置
    print("\n[1/2] Configuring Backend...")
    backend_dir = os.path.join(os.getcwd(), "backend")
    venv_dir = os.path.join(backend_dir, "venv")
    
    # 如果版本换了，旧的 venv 必须删除重建
    if os.path.exists(venv_dir):
        # 简单检查 venv 是否匹配当前 python
        print("Checking existing virtual environment...")
        # 如果你想强制重装，可以取消下面这行的注释
        # shutil.rmtree(venv_dir) 

    if not os.path.exists(venv_dir):
        print("Creating fresh virtual environment...")
        run_command(f'"{sys.executable}" -m venv venv', cwd=backend_dir)
    
    pip_path = os.path.join(venv_dir, "Scripts", "pip.exe") if os.name == 'nt' else os.path.join(venv_dir, "bin", "pip")
    run_command(f'"{pip_path}" install --upgrade pip', cwd=backend_dir)
    run_command(f'"{pip_path}" install -r requirements.txt', cwd=backend_dir)

    # 4. 前端环境配置
    print("\n[2/2] Configuring Frontend...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    if os.path.exists(os.path.join(frontend_dir, "package.json")):
        run_command("npm install", cwd=frontend_dir)
    
    print("\n" + "=" * 60)
    print("🎉 ALL SYSTEMS READY! Jiafu, your workstation is optimized.")
    print("=" * 60)

if __name__ == "__main__":
    setup()