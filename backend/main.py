"""
HKBU GenAI Workstation – FastAPI Backend
Run: uvicorn main:app --reload --port 8000  (from backend/ directory)
"""

import json

import httpx
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import MODELS
from models import (
    ChatRequest, CheckStatusBody, ConversationCreate, ConversationMessagesUpdate,
    ConversationTitleUpdate, HistoryBody, ProfileBody,
)
from services.api_client import build_system_message, call_hkbu_api, check_hkbu_connection, estimate_tokens
from services.persistence import (
    create_conversation, delete_conversation, list_conversations,
    load_chat_history, load_conversation, load_user_profile,
    save_chat_history, save_conversation_messages, save_user_profile,
    update_conversation_title,
)
from services.profile_learner import learn_profile

app = FastAPI(title="HKBU GenAI Workstation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health / meta
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/models")
def get_models():
    return {"models": list(MODELS.keys()), "details": MODELS}


@app.post("/check-status")
async def check_status(body: CheckStatusBody):
    if body.model not in MODELS:
        raise HTTPException(400, f"Unknown model: {body.model!r}")
    success, message = await check_hkbu_connection(body.api_key, body.model)
    return {"ok": success, "message": message}


# ---------------------------------------------------------------------------
# Legacy single chat history
# ---------------------------------------------------------------------------

@app.get("/history")
def get_history():
    return {"messages": load_chat_history()}


@app.post("/history")
def post_history(body: HistoryBody):
    save_chat_history(body.messages)
    return {"ok": True}


@app.delete("/history")
def delete_history():
    save_chat_history([])
    return {"ok": True}


# ---------------------------------------------------------------------------
# User profile
# ---------------------------------------------------------------------------

@app.get("/profile")
def get_profile():
    return {"profile": load_user_profile()}


@app.put("/profile")
def put_profile(body: ProfileBody):
    save_user_profile(body.profile)
    return {"ok": True}


@app.delete("/profile")
def delete_profile():
    save_user_profile({})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Multi-conversation management
# ---------------------------------------------------------------------------

@app.get("/conversations")
def get_conversations():
    return {"conversations": list_conversations()}


@app.post("/conversations")
def post_conversation(body: ConversationCreate):
    conv = create_conversation(body.title)
    return conv


@app.get("/conversations/{conv_id}")
def get_conversation(conv_id: str):
    conv = load_conversation(conv_id)
    if conv is None:
        raise HTTPException(404, f"Conversation {conv_id!r} not found")
    return conv


@app.patch("/conversations/{conv_id}/title")
def patch_conversation_title(conv_id: str, body: ConversationTitleUpdate):
    ok = update_conversation_title(conv_id, body.title)
    if not ok:
        raise HTTPException(404, f"Conversation {conv_id!r} not found")
    return {"ok": True}


@app.put("/conversations/{conv_id}/messages")
def put_conversation_messages(conv_id: str, body: ConversationMessagesUpdate):
    save_conversation_messages(conv_id, body.messages, body.title)
    return {"ok": True}


@app.delete("/conversations/{conv_id}")
def delete_conv(conv_id: str):
    ok = delete_conversation(conv_id)
    if not ok:
        raise HTTPException(404, f"Conversation {conv_id!r} not found")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Chat endpoint
# ---------------------------------------------------------------------------

@app.post("/chat")
async def chat(req: ChatRequest, background_tasks: BackgroundTasks):
    if req.model not in MODELS:
        raise HTTPException(400, f"Unknown model: {req.model!r}")

    profile = load_user_profile()
    if req.system_prompt and req.system_prompt.strip():
        system_content = req.system_prompt.strip()
    else:
        system_content = build_system_message(profile)
    system_msg = {"role": "system", "content": system_content}
    api_messages = [system_msg] + [m for m in req.messages if m.get("role") != "system"]

    try:
        reply, usage = await call_hkbu_api(
            req.api_key, req.model, api_messages,
            req.temperature, req.max_tokens,
        )
    except httpx.HTTPStatusError as exc:
        body = ""
        try:
            body = exc.response.text[:400]
        except Exception:
            pass
        raise HTTPException(exc.response.status_code, f"HKBU API error: {body}")
    except httpx.TimeoutException:
        raise HTTPException(504, "HKBU API request timed out")
    except Exception as exc:
        raise HTTPException(500, str(exc))

    all_msgs = req.messages + [{"role": "assistant", "content": reply}]

    # Save to specific conversation if provided, else fall back to legacy history
    if req.conversation_id:
        # Auto-generate title from first user message if needed
        conv = load_conversation(req.conversation_id)
        title = None
        if conv and conv.get("title") == "新对话" and len(all_msgs) <= 2:
            # Use first user message (truncated) as title
            first_user = next((m for m in all_msgs if m.get("role") == "user"), None)
            if first_user:
                raw = first_user.get("content", "")
                if isinstance(raw, list):
                    raw = next((p.get("text", "") for p in raw if isinstance(p, dict) and p.get("type") == "text"), "")
                title = str(raw)[:40].strip() or "新对话"
        save_conversation_messages(req.conversation_id, all_msgs, title)
    else:
        save_chat_history(all_msgs)

    # Extract last user text for profile learning
    user_text = ""
    for m in reversed(req.messages):
        if m.get("role") == "user":
            c = m.get("content", "")
            if isinstance(c, list):
                for part in c:
                    if isinstance(part, dict) and part.get("type") == "text":
                        user_text = part["text"]
                        break
            else:
                user_text = str(c)
            break

    background_tasks.add_task(
        learn_profile, req.api_key, req.model, user_text, reply, profile
    )

    in_tok  = usage.get("prompt_tokens",     estimate_tokens(json.dumps(api_messages)))
    out_tok = usage.get("completion_tokens", estimate_tokens(reply))

    return {
        "reply": reply,
        "usage": {
            "prompt_tokens":     in_tok,
            "completion_tokens": out_tok,
            "total_tokens":      in_tok + out_tok,
        },
    }
