import json
import re

from services.api_client import call_hkbu_api
from services.persistence import save_user_profile

_PROMPT = (
    "Based on the following conversation turn, extract any NEW factual information "
    "about the user (e.g. name, major, university, interests, programming languages, "
    "preferred language). Return ONLY a JSON object with string keys and values. "
    "If nothing new is found, return {}. Do NOT include commentary – only JSON."
)


async def learn_profile(
    api_key: str,
    model_key: str,
    user_msg: str,
    ai_msg: str,
    current_profile: dict,
) -> dict:
    try:
        msgs = [
            {"role": "system", "content": _PROMPT},
            {
                "role": "user",
                "content": (
                    f"Current profile: {json.dumps(current_profile)}\n\n"
                    f"User said: {user_msg}\n\nAI replied: {ai_msg}"
                ),
            },
        ]
        text, _ = await call_hkbu_api(api_key, model_key, msgs, 0.0, 300)
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            facts = json.loads(m.group())
            if isinstance(facts, dict) and facts:
                current_profile.update({k: v for k, v in facts.items() if v})
                save_user_profile(current_profile)
    except Exception:
        pass
    return current_profile
