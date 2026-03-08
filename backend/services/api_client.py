import re

import httpx

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import HKBU_API_BASE, MODELS


def build_system_message(profile: dict) -> str:
    base = (
        "You are a helpful, knowledgeable AI assistant on the HKBU GenAI Workstation. "
        "Respond concisely and accurately. Support both English and Chinese."
    )
    if profile:
        facts = "; ".join(f"{k}: {v}" for k, v in profile.items() if v)
        if facts:
            base += f"\n\nKnown user context – {facts}"
    return base


async def call_hkbu_api(
    api_key: str,
    model_key: str,
    messages: list,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> tuple[str, dict]:
    """Async HKBU GenAI Gateway call. Returns (reply_text, usage_dict)."""
    cfg = MODELS[model_key]
    url = (
        f"{HKBU_API_BASE}/{cfg['deployment']}/chat/completions"
        f"?api-version={cfg['api_version']}"
    )
    headers = {"api-key": api_key, "Content-Type": "application/json"}
    payload = {"messages": messages}

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()

    data = resp.json()
    return data["choices"][0]["message"]["content"], data.get("usage", {})


async def check_hkbu_connection(api_key: str, model_key: str) -> tuple[bool, str]:
    """Send a minimal request to HKBU API (max_tokens=1). Returns (success, message)."""
    cfg = MODELS[model_key]
    url = (
        f"{HKBU_API_BASE}/{cfg['deployment']}/chat/completions"
        f"?api-version={cfg['api_version']}"
    )
    headers = {"api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            return True, "连接成功"
        return False, f"状态码 {resp.status_code}: {resp.text[:400]}"
    except httpx.TimeoutException:
        return False, "请求超时"
    except Exception as e:
        return False, str(e)[:400]


def estimate_tokens(text: str) -> int:
    cjk  = len(re.findall(r"[\u4e00-\u9fff\u3400-\u4dbf]", text))
    rest = len(text) - cjk
    return cjk + rest // 4
