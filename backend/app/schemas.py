from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class CaseCreate(BaseModel):
    case_code: str
    title: str
    category: str
    status: str = "Active"
    next_hearing: Optional[str] = None
    owner: str = "Senior Advocate"


class TaskCreate(BaseModel):
    case_id: int
    title: str
    assignee: str = "Junior Advocate"
    due_date: Optional[str] = None
    priority: str = "Medium"


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None


class DocumentCreate(BaseModel):
    case_id: int
    name: str
    doc_type: str
    content: str


class DraftUpdate(BaseModel):
    draft_text: str


class SummaryRequest(BaseModel):
    document_id: int


class SearchRequest(BaseModel):
    query: str


class DraftRequest(BaseModel):
    case_id: int


class FeedbackRequest(BaseModel):
    tester_role: str
    task_tested: str
    what_worked: str
    confusing: str
    improvement: str
    final_feedback: str
