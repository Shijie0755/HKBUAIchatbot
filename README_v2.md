# HKBU GenAI Workstation v2 — FastAPI + React

Decoupled architecture:  
- **Backend** → FastAPI (Python) – proxies HKBU API, persists history/profile  
- **Frontend** → React + Vite – Gemini-style Light Mode UI

---

## Project Layout

```
chatbot/
├── backend/                 ← FastAPI server
│   ├── main.py              ← API endpoints
│   ├── config.py            ← Models registry, paths
│   ├── models.py            ← Pydantic request/response schemas
│   ├── services/
│   │   ├── api_client.py    ← Async HKBU Gateway calls (httpx)
│   │   ├── persistence.py   ← JSON read/write (chat_history, user_profile)
│   │   └── profile_learner.py ← Background user-profile extraction
│   ├── data/                ← Auto-created; stores chat_history.json, user_profile.json
│   └── requirements.txt
│
├── frontend/                ← React + Vite app
│   ├── index.html
│   ├── vite.config.js       ← Dev proxy: /api → http://localhost:8000
│   ├── package.json
│   └── src/
│       ├── App.jsx           ← Root component, global drag-and-drop
│       ├── index.css         ← Gemini Light Mode theme (CSS variables)
│       ├── api/client.js     ← fetch() wrappers for all backend endpoints
│       ├── hooks/useChat.js  ← Chat state, file processing helpers
│       └── components/
│           ├── ChatMessage.jsx   ← User pill / Assistant plain bubble + Markdown
│           ├── InputBar.jsx      ← Floating pill: [+] textarea [➤] + thumbnails
│           ├── SettingsModal.jsx ← API key, model, temperature, clear history
│           ├── DragOverlay.jsx   ← Full-screen drop target (blue border)
│           └── TokenFooter.jsx   ← Session token counter
│
└── README_v2.md             ← this file
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11 + |
| Node.js | 18 + |
| npm | 9 + |

---

## 1 — Backend setup

```powershell
cd chatbot\backend

# Create & activate virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server (auto-reload on file changes)
uvicorn main:app --reload --port 8000
```

Swagger UI available at **http://localhost:8000/docs**

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/models` | List available models |
| POST | `/chat` | Send a chat turn, returns reply + token usage |
| GET | `/history` | Load persisted chat history |
| POST | `/history` | Save chat history |
| DELETE | `/history` | Clear chat history |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |
| DELETE | `/profile` | Reset user profile |

---

## 2 — Frontend setup

```powershell
cd chatbot\frontend

# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note:** The Vite dev proxy forwards every `/api/*` request to the backend,  
> so both servers must be running simultaneously.

---

## 3 — Using the app

1. Click the ⚙️ gear icon (top-right) and enter your **HKBU API Key**.
2. Select a model (default: `gemini-2.5-flash`).
3. Type in the input bar and press **Enter** or the blue send button.
4. **Attach files** via the `+` icon — images are sent as inline base64, code/text files are embedded as fenced code blocks.
5. **Drag & drop** any file onto the window → blue overlay appears → drop to add to pending attachments.

---

## 4 — Production build

```powershell
# Build frontend static files
cd chatbot\frontend
npm run build          # outputs to frontend/dist/

# Serve static files from FastAPI (add to main.py if needed):
# from fastapi.staticfiles import StaticFiles
# app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
```

---

## Architecture notes

- **No secrets in frontend** — the API key is stored only in `localStorage` and sent per-request to the backend, which forwards it to HKBU. Never committed to source.
- **Profile learning** runs as a FastAPI `BackgroundTask` after each `/chat` response — it calls the HKBU API a second time to extract user facts and merges them into `data/user_profile.json`.
- **Base64 images** are encoded on the frontend (`FileReader.readAsDataURL`) before being included in the `messages` payload. The backend forwards them verbatim to the HKBU multimodal endpoint.
