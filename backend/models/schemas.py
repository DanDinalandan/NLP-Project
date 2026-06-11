from pydantic import BaseModel
from typing import Optional, List
import json


class FolderCreate(BaseModel):
    name: str


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    privacy: Optional[str] = None


class FlashcardCreate(BaseModel):
    folder_id: int
    front: str
    back: str
    file_id: Optional[int] = None


class FlashcardUpdate(BaseModel):
    front: str
    back: str


class MCQOption(BaseModel):
    label: str
    text: str


class MCQCreate(BaseModel):
    folder_id: int
    question: str
    options: List[MCQOption]
    correct_answer: str
    explanation: str = ""
    file_id: Optional[int] = None


class ChatMessageCreate(BaseModel):
    content: str
    # When set, RAG query is restricted to these source file IDs only
    file_ids: Optional[List[int]] = None


class LoginRequest(BaseModel):
    email: str
    password: str
