import json
import uuid
from datetime import datetime
from pathlib import Path

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import CHAT_HISTORY_PATH, CONVERSATIONS_DIR, USER_PROFILE_PATH


def _load(path: Path, default):
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return default
    return default


def _save(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Legacy single chat history (kept for backward compat)
# ---------------------------------------------------------------------------

def load_chat_history() -> list:
    return _load(CHAT_HISTORY_PATH, [])


def save_chat_history(messages: list) -> None:
    _save(CHAT_HISTORY_PATH, messages)


# ---------------------------------------------------------------------------
# User profile
# ---------------------------------------------------------------------------

def load_user_profile() -> dict:
    return _load(USER_PROFILE_PATH, {})


def save_user_profile(profile: dict) -> None:
    _save(USER_PROFILE_PATH, profile)


# ---------------------------------------------------------------------------
# Multi-conversation management
# ---------------------------------------------------------------------------

def _conv_path(conv_id: str) -> Path:
    return CONVERSATIONS_DIR / f"{conv_id}.json"


def list_conversations() -> list[dict]:
    """Return summary list sorted by last updated (newest first)."""
    result = []
    for path in CONVERSATIONS_DIR.glob("*.json"):
        data = _load(path, {})
        if data and data.get("id"):
            result.append({
                "id": data["id"],
                "title": data.get("title", "新对话"),
                "created_at": data.get("created_at", ""),
                "updated_at": data.get("updated_at", ""),
                "message_count": len(data.get("messages", [])),
            })
    result.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return result


def create_conversation(title: str = "新对话") -> dict:
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    data = {
        "id": conv_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }
    _save(_conv_path(conv_id), data)
    return data


def load_conversation(conv_id: str) -> dict | None:
    data = _load(_conv_path(conv_id), None)
    return data


def save_conversation_messages(conv_id: str, messages: list, title: str | None = None) -> None:
    path = _conv_path(conv_id)
    now = datetime.utcnow().isoformat()
    data = _load(path, {
        "id": conv_id,
        "title": "新对话",
        "created_at": now,
    })
    data["messages"] = messages
    data["updated_at"] = now
    if title is not None:
        data["title"] = title
    _save(path, data)


def update_conversation_title(conv_id: str, title: str) -> bool:
    path = _conv_path(conv_id)
    data = _load(path, None)
    if data is None:
        return False
    data["title"] = title
    data["updated_at"] = datetime.utcnow().isoformat()
    _save(path, data)
    return True


def delete_conversation(conv_id: str) -> bool:
    path = _conv_path(conv_id)
    if path.exists():
        path.unlink()
        return True
    return False
