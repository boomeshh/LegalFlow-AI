from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
import re
import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "legalflow_demo.db"

app = FastAPI(title="LegalFlow AI Demo API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def rows(query: str, params=()):
    with db() as conn:
        return [dict(r) for r in conn.execute(query, params).fetchall()]


def one(query: str, params=()):
    with db() as conn:
        r = conn.execute(query, params).fetchone()
        return dict(r) if r else None


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS cases (
              id INTEGER PRIMARY KEY,
              case_code TEXT UNIQUE NOT NULL,
              title TEXT NOT NULL,
              category TEXT NOT NULL,
              status TEXT NOT NULL,
              next_hearing TEXT,
              owner TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY,
              case_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              assignee TEXT NOT NULL,
              due_date TEXT,
              status TEXT NOT NULL,
              priority TEXT NOT NULL,
              FOREIGN KEY(case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS documents (
              id INTEGER PRIMARY KEY,
              case_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              doc_type TEXT NOT NULL,
              content TEXT NOT NULL,
              uploaded_at TEXT NOT NULL,
              FOREIGN KEY(case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS drafts (
              id INTEGER PRIMARY KEY,
              case_id INTEGER NOT NULL,
              draft_text TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL,
              approved_at TEXT,
              FOREIGN KEY(case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS validation_feedback (
              id INTEGER PRIMARY KEY,
              tester_role TEXT NOT NULL,
              task_tested TEXT NOT NULL,
              what_worked TEXT NOT NULL,
              confusing TEXT NOT NULL,
              improvement TEXT NOT NULL,
              final_feedback TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )

        count = conn.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT INTO cases(id, case_code, title, category, status, next_hearing, owner) VALUES(?,?,?,?,?,?,?)",
                [
                    (1, "DEMO-CIV-001", "Property Document Review", "Civil", "Active", "2026-09-18", "Senior Advocate"),
                    (2, "DEMO-CON-002", "Service Agreement Review", "Contract", "Active", "2026-09-22", "Senior Advocate"),
                    (3, "DEMO-CIV-003", "Filing Follow-up", "Civil", "On Hold", "2026-10-03", "Junior Advocate"),
                ],
            )
            conn.executemany(
                "INSERT INTO tasks(id, case_id, title, assignee, due_date, status, priority) VALUES(?,?,?,?,?,?,?)",
                [
                    (1, 1, "Prepare document index", "Junior Advocate", "2026-09-13", "In Progress", "High"),
                    (2, 1, "Review draft note", "Senior Advocate", "2026-09-14", "Pending", "Medium"),
                    (3, 2, "Check clause differences", "Junior Advocate", "2026-09-16", "Pending", "Medium"),
                    (4, 3, "Confirm filing checklist", "Junior Advocate", "2026-09-12", "Done", "Low"),
                ],
            )
            conn.executemany(
                "INSERT INTO documents(id, case_id, name, doc_type, content, uploaded_at) VALUES(?,?,?,?,?,?)",
                [
                    (1, 1, "demo_property_note.txt", "Case Note", "This is synthetic demo content. The note lists property document references, identifies two missing attachments, and records that the senior advocate must review the final index before filing. No real client details are included.", "2026-09-08T10:00:00"),
                    (2, 2, "demo_agreement_summary.txt", "Agreement", "Synthetic service agreement demo. The document contains a payment clause, a thirty-day notice clause, and a confidentiality section. The team must compare the notice clause with the latest internal draft before review.", "2026-09-08T11:00:00"),
                    (3, 3, "demo_filing_checklist.txt", "Checklist", "Synthetic filing checklist. Verify document order, required signatures, attachment labels, and internal review status. Final submission must only occur after advocate approval.", "2026-09-09T09:00:00"),
                ],
            )


@app.on_event("startup")
def startup():
    init_db()


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None


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


@app.get("/health")
def health():
    return {"status": "ok", "mode": "demo-ai"}


@app.get("/dashboard")
def dashboard():
    cases = rows("SELECT * FROM cases ORDER BY next_hearing")
    open_tasks = rows("SELECT * FROM tasks WHERE status != 'Done' ORDER BY due_date")
    drafts = rows("SELECT * FROM drafts WHERE status='Pending Review' ORDER BY created_at DESC")
    return {
        "case_count": len(cases),
        "open_task_count": len(open_tasks),
        "pending_review_count": len(drafts),
        "upcoming_hearings": cases[:3],
        "open_tasks": open_tasks[:5],
        "pending_drafts": drafts,
    }


@app.get("/cases")
def list_cases():
    return rows("SELECT * FROM cases ORDER BY id")


@app.post("/cases")
def create_case(payload: CaseCreate):
    code = payload.case_code.strip().upper()
    if not code or not payload.title.strip():
        raise HTTPException(400, "Case code and title are required.")
    existing = one("SELECT * FROM cases WHERE case_code=?", (code,))
    if existing:
        raise HTTPException(400, f"Case code {code} already exists.")
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO cases(case_code, title, category, status, next_hearing, owner) VALUES(?,?,?,?,?,?)",
            (code, payload.title.strip(), payload.category.strip(), payload.status.strip(), payload.next_hearing or None, payload.owner.strip()),
        )
        case_id = cur.lastrowid
    return one("SELECT * FROM cases WHERE id=?", (case_id,))


@app.get("/cases/{case_id}")
def get_case(case_id: int):
    case = one("SELECT * FROM cases WHERE id=?", (case_id,))
    if not case:
        raise HTTPException(404, "Case not found")
    case["tasks"] = rows("SELECT * FROM tasks WHERE case_id=? ORDER BY due_date", (case_id,))
    case["documents"] = rows("SELECT id, case_id, name, doc_type, content, uploaded_at FROM documents WHERE case_id=?", (case_id,))
    case["drafts"] = rows("SELECT * FROM drafts WHERE case_id=? ORDER BY created_at DESC", (case_id,))
    return case


@app.get("/tasks")
def list_tasks():
    return rows(
        """SELECT tasks.*, cases.case_code FROM tasks
           JOIN cases ON cases.id=tasks.case_id ORDER BY due_date"""
    )


@app.post("/tasks")
def create_task(payload: TaskCreate):
    case = one("SELECT * FROM cases WHERE id=?", (payload.case_id,))
    if not case:
        raise HTTPException(404, "Target case not found.")
    if not payload.title.strip():
        raise HTTPException(400, "Task title is required.")
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO tasks(case_id, title, assignee, due_date, status, priority) VALUES(?,?,?,?,?,?)",
            (payload.case_id, payload.title.strip(), payload.assignee.strip(), payload.due_date or None, "Pending", payload.priority),
        )
        task_id = cur.lastrowid
    return one("SELECT tasks.*, cases.case_code FROM tasks JOIN cases ON cases.id=tasks.case_id WHERE tasks.id=?", (task_id,))


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate):
    task = one("SELECT * FROM tasks WHERE id=?", (task_id,))
    if not task:
        raise HTTPException(404, "Task not found")
    status = payload.status or task["status"]
    assignee = payload.assignee or task["assignee"]
    priority = payload.priority or task["priority"]
    with db() as conn:
        conn.execute("UPDATE tasks SET status=?, assignee=?, priority=? WHERE id=?", (status, assignee, priority, task_id))
    return one("SELECT * FROM tasks WHERE id=?", (task_id,))


@app.get("/documents")
def list_documents():
    return rows(
        """SELECT documents.id, documents.case_id, documents.name, documents.doc_type,
                  documents.content, documents.uploaded_at, cases.case_code
           FROM documents JOIN cases ON cases.id=documents.case_id
           ORDER BY uploaded_at DESC"""
    )


@app.get("/documents/{document_id}")
def get_document(document_id: int):
    doc = one(
        """SELECT documents.*, cases.case_code FROM documents
           JOIN cases ON cases.id=documents.case_id WHERE documents.id=?""",
        (document_id,),
    )
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@app.post("/documents")
def create_document(payload: DocumentCreate):
    case = one("SELECT * FROM cases WHERE id=?", (payload.case_id,))
    if not case:
        raise HTTPException(404, "Case not found")
    if not payload.name.strip() or not payload.content.strip():
        raise HTTPException(400, "Document name and content are required.")
    created = datetime.now().isoformat(timespec="seconds")
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO documents(case_id, name, doc_type, content, uploaded_at) VALUES(?,?,?,?,?)",
            (payload.case_id, payload.name.strip(), payload.doc_type.strip(), payload.content.strip(), created),
        )
        doc_id = cur.lastrowid
    return one("SELECT documents.*, cases.case_code FROM documents JOIN cases ON cases.id=documents.case_id WHERE documents.id=?", (doc_id,))


def simple_summary(text: str) -> str:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if len(sentences) <= 2:
        return " ".join(sentences)
    ranked = sorted(sentences, key=lambda s: len(set(re.findall(r"\w+", s.lower()))), reverse=True)
    chosen = ranked[:2]
    return " ".join(chosen)


@app.post("/ai/summary")
def ai_summary(payload: SummaryRequest):
    doc = one("SELECT * FROM documents WHERE id=?", (payload.document_id,))
    if not doc:
        raise HTTPException(404, "Document not found")
    return {
        "document": doc["name"],
        "summary": simple_summary(doc["content"]),
        "mode": "demo fallback",
        "notice": "AI-assisted demo summary. Advocate review required.",
    }


@app.post("/ai/search")
def ai_search(payload: SearchRequest):
    q = payload.query.strip().lower()
    if not q:
        return {"results": [], "mode": "demo fallback"}
    docs = rows("SELECT documents.*, cases.case_code FROM documents JOIN cases ON cases.id=documents.case_id")
    terms = [t for t in re.findall(r"\w+", q) if len(t) > 2]
    scored = []
    for doc in docs:
        hay = (doc["name"] + " " + doc["content"]).lower()
        score = sum(hay.count(t) for t in terms)
        if score:
            scored.append({
                "document_id": doc["id"],
                "name": doc["name"],
                "case_code": doc["case_code"],
                "score": score,
                "preview": doc["content"][:220] + ("..." if len(doc["content"]) > 220 else ""),
            })
    scored.sort(key=lambda x: x["score"], reverse=True)
    return {"results": scored, "mode": "demo fallback", "notice": "Keyword-based demo search; not a legal research engine."}


@app.get("/ai/task-priority/{task_id}")
def task_priority(task_id: int):
    task = one("SELECT * FROM tasks WHERE id=?", (task_id,))
    if not task:
        raise HTTPException(404, "Task not found")
    suggested = task["priority"]
    reason = "Existing demo priority retained."
    if task["status"] != "Done" and task["due_date"]:
        try:
            days = (date.fromisoformat(task["due_date"]) - date.today()).days
            if days <= 2:
                suggested = "High"
                reason = f"Due date ({task['due_date']}) is within 2 days. Urgency recommended."
            elif days <= 5:
                suggested = "Medium"
                reason = f"Due date ({task['due_date']}) is within 5 days."
        except ValueError:
            pass
    return {"suggested_priority": suggested, "reason": reason, "notice": "Suggestion only. Advocate decides."}


@app.post("/ai/client-update-draft")
def client_update_draft(payload: DraftRequest):
    case = one("SELECT * FROM cases WHERE id=?", (payload.case_id,))
    if not case:
        raise HTTPException(404, "Case not found")
    tasks = rows("SELECT * FROM tasks WHERE case_id=?", (payload.case_id,))
    done = sum(1 for t in tasks if t["status"] == "Done")
    total = len(tasks)
    text = (
        f"Client Status Update for {case['case_code']} ({case['title']}):\n"
        f"- Current Case Status: {case['status']}\n"
        f"- Task Progress: {done} of {total} scheduled tasks completed.\n"
        f"- Next Hearing / Milestone: {case['next_hearing'] or 'TBD'}\n\n"
        "Draft Note: Please be advised that preliminary document checks are underway. "
        "The senior advocate will present the index during the upcoming proceeding. "
        "[AI Generated Draft - Advocate Review Required before client dispatch]"
    )
    created = datetime.now().isoformat(timespec="seconds")
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO drafts(case_id, draft_text, status, created_at) VALUES(?,?,?,?)",
            (payload.case_id, text, "Pending Review", created),
        )
        draft_id = cur.lastrowid
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


@app.patch("/drafts/{draft_id}")
def update_draft_text(draft_id: int, payload: DraftUpdate):
    draft = one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    if not draft:
        raise HTTPException(404, "Draft not found")
    if not payload.draft_text.strip():
        raise HTTPException(400, "Draft text cannot be empty.")
    with db() as conn:
        conn.execute("UPDATE drafts SET draft_text=? WHERE id=?", (payload.draft_text.strip(), draft_id))
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


@app.post("/drafts/{draft_id}/approve")
def approve_draft(draft_id: int):
    draft = one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    if not draft:
        raise HTTPException(404, "Draft not found")
    approved = datetime.now().isoformat(timespec="seconds")
    with db() as conn:
        conn.execute("UPDATE drafts SET status='Approved', approved_at=? WHERE id=?", (approved, draft_id))
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


@app.get("/validation")
def list_feedback():
    return rows("SELECT * FROM validation_feedback ORDER BY created_at DESC")


@app.post("/validation")
def create_feedback(payload: FeedbackRequest):
    values = [
        payload.tester_role, payload.task_tested, payload.what_worked,
        payload.confusing, payload.improvement, payload.final_feedback,
    ]
    if any(not v.strip() for v in values):
        raise HTTPException(400, "Please complete all feedback fields with real tester input.")
    created = datetime.now().isoformat(timespec="seconds")
    with db() as conn:
        cur = conn.execute(
            """INSERT INTO validation_feedback(
                 tester_role, task_tested, what_worked, confusing, improvement, final_feedback, created_at
               ) VALUES(?,?,?,?,?,?,?)""",
            (*values, created),
        )
        feedback_id = cur.lastrowid
    return one("SELECT * FROM validation_feedback WHERE id=?", (feedback_id,))

