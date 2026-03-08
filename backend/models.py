from pydantic import BaseModel
from typing import Any


class ChatRequest(BaseModel):
    api_key: str
    model: str
    messages: list[dict[str, Any]]
    temperature: float = 0.7
    max_tokens: int = 4096
    system_prompt: str | None = None
    conversation_id: str | None = None  # save to specific conversation


class ChatResponse(BaseModel):
    reply: str
    usage: dict[str, int]


class HistoryBody(BaseModel):
    messages: list[dict[str, Any]]


class ProfileBody(BaseModel):
    profile: dict[str, str]


class ConversationCreate(BaseModel):
    title: str = "新对话"


class ConversationTitleUpdate(BaseModel):
    title: str


class ConversationMessagesUpdate(BaseModel):
    messages: list[dict[str, Any]]
    title: str | None = None


class CheckStatusBody(BaseModel):
    api_key: str
    model: str
