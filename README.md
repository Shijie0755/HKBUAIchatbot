# HKBU GenAI Chatbot Workstation

> 一个为香港浸会大学学生量身定制的智能助手工作站。

---

## 🌟 项目简介 (Introduction)

本项目是一个基于 **FastAPI (后端)** 与 **React/Vite (前端)** 架构的 AI 聊天工作站 。它不仅接入了 **HKBU GenAI API**，还具备“个人画像学习”功能，能够根据与用户的交流自动记录偏好和背景。

**核心亮点：**

* 
**双引擎架构**：前后端分离，性能稳健，响应迅速 。


* **身份感知 (Profile Learner)**：内置自动化逻辑，能记住你的名字、专业及兴趣（如 Python、ICPC 等）。
* 
**一键式体验**：提供自动化脚本，极大简化了环境配置与启动流程 。


---

## 🚀 快速开始 (Quick Start)

### 1. 前置要求

* 安装 [Python 3.10+](https://www.python.org/)
* 安装 [Node.js (v18+)](https://nodejs.org/)

### 2. 环境配置

1. **克隆项目**：
```bash
git clone https://github.com/你的用户名/仓库名.git
cd chatbot

```


2. **一键安装依赖**：
双击运行根目录下的 `setup_env.bat` 。此脚本会自动创建 Python 虚拟环境并安装所有前后端依赖包 。


3. **填写 API Key**：
在 `backend/` 目录下，根据 `config.py` 的提示填入你的 **HKBU API Key** 。



### 3. 启动项目

双击运行 `main.bat` 。

* **前端地址**：`http://localhost:5173`
* **后端 API**：`http://localhost:8000`

---

## 🛠️ 技术栈 (Tech Stack)

* 
**Frontend**: React, Vite, Tailwind CSS 。


* **Backend**: FastAPI, Uvicorn, HTTPX。
* 
**Logic**: Profile Learning Algorithm (基于提示词工程的事实提取) 。



---

## 🤝 贡献与反馈

如果你在运行过程中遇到任何问题，欢迎通过 GitHub Issues 提交 。

---
