既然你已经把整个项目的架构从零散的脚本升级到了“全自动化”级别，这份全新的 `README.md` 将以最专业的方式展示你的成果。它不仅能让你的项目在 GitHub 上脱颖而出，也能清晰地向 **HKBU** 的教授和同学展示你的工程思维。

---

# 🤖 HKBU AI chatbot Workstation

欢迎使用 **HKBU AI chatbot**！这是一个基于 **FastAPI (Python)** 和 **React (Vite)** 构建的现代化智能对话工作站。本项目现已全面集成 **HKBU GenAI Platform** 的系列模型，并提供全自动化的环境部署方案。


---

## ✨ 核心亮点 (Features)

* **全自动引导**：内置 `env_setup.py`，一键检测并安装 Python 与 Node.js 环境。
* **智能环境管理**：`main.py` 自动处理 Python 虚拟环境 (venv) 与前端依赖 (npm) 的安装与更新。
* **一键启动协同**：通过 `main.py` 同时唤起前后端服务，并自动开启浏览器访问界面。

---

## 🛠️ 快速上手 (Quick Start)

为了确保最佳兼容性，请按以下顺序执行脚本：

### 1. 系统环境初始化 (仅限 Windows 首次运行)

如果你电脑里还没有 Python 或 Node.js，请下载 Python 后运行此脚本：

```batch
env_setup.py

```

*脚本将通过 Windows Winget 自动配置底层工具链。完成后请重启 VS Code。*

### 2. 项目依赖安装

安装 Python 库及前端包（会自动处理虚拟环境）：

```bash
python env_setup.py

```

### 3. 一键启动

启动前后端服务并打开聊天窗口：

```bash
python main.py

```

---

## 📂 项目结构 (Project Structure)

```text
HKBUAIchatbot/
├── backend/            # FastAPI 后端逻辑
│   ├── venv/           # Python 虚拟环境 (自动生成)
│   └── main.py         # Gemini 调用核心
├── frontend/           # React 前端界面
│   ├── node_modules/   # 前端依赖 (自动生成)
│   └── src/            # UI 组件与版权声明
├── env_setup.py        # 环境安装脚本
└── main.py       # 一键启动器

```

---

## 📧 联系与支持

如有任何问题，欢迎通过 **25284053@life.hkbu.edu.hk** 校园邮箱与我联系。

---

## ⚖️ 版权声明 (Copyright)

**© 2026 ShiJir0755 . All Rights Reserved.**
本项目仅供学术交流与学习使用。未经许可，禁止将本项目用于任何商业用途。
