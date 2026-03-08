from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

CONVERSATIONS_DIR = DATA_DIR / "conversations"
CONVERSATIONS_DIR.mkdir(exist_ok=True)

CHAT_HISTORY_PATH = DATA_DIR / "chat_history.json"
USER_PROFILE_PATH = DATA_DIR / "user_profile.json"

HKBU_API_BASE = "https://genai.hkbu.edu.hk/api/v0/rest/deployments"

MODELS: dict[str, dict] = {
    "o3-mini":          {"deployment": "o3-mini",          "api_version": "2024-12-01-preview", "family": "gpt"},
    "o1":               {"deployment": "o1",               "api_version": "2024-12-01-preview", "family": "gpt"},
    "gpt-4.1-mini":     {"deployment": "gpt-4.1-mini",     "api_version": "2024-12-01-preview", "family": "gpt"},
    "gpt-4.1":          {"deployment": "gpt-4.1",          "api_version": "2024-12-01-preview", "family": "gpt"},
    "gpt-5-mini":       {"deployment": "gpt-5-mini",       "api_version": "2024-12-01-preview", "family": "gpt"},
    "gpt-5":            {"deployment": "gpt-5",            "api_version": "2024-12-01-preview", "family": "gpt"},
    # Gemini: 必须使用 api-version=v1（或 v1beta），忽略文档中的日期格式；endpoint 中 {model} 为平台部署名；认证用 "api-key" header。
    "gemini-2.5-flash": {"deployment": "gemini-2.5-flash", "api_version": "v1",         "family": "gemini"},
    "gemini-2.5-pro":   {"deployment": "gemini-2.2.5-pro", "api_version": "v1",         "family": "gemini"},
}
