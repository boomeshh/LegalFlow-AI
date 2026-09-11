from __future__ import annotations

from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import get_db, init_db, one, rows
from .schemas import (
    CaseCreate,
    DocumentCreate,
    DraftRequest,
    DraftUpdate,
    FeedbackRequest,
    SearchRequest,
    SummaryRequest,
    TaskCreate,
    TaskUpdate,
)
from .ai import evaluate_task_priority, generate_client_draft_text, search_documents, simple_summary

app = FastAPI(title="LegalFlow AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


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


# CASES
@app.get("/cases")
def list_cases():
    return rows("SELECT * FROM cases ORDER BY id")


@app.post("/cases")
def create_case(payload: CaseCreate):
    code = payload.case_code.strip().upper()
    title = payload.title.strip()
    if not code or not title:
        raise HTTPException(400, "Case code and title are required.")
    
    existing = one("SELECT * FROM cases WHERE case_code=?", (code,))
    if existing:
        raise HTTPException(400, f"Case code {code} already exists.")
    
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO cases(case_code, title, category, status, next_hearing, owner) VALUES(?,?,?,?,?,?)",
            (code, title, payload.category.strip(), payload.status.strip(), payload.next_hearing or None, payload.owner.strip()),
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


# TASKS
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
    
    with get_db() as conn:
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
    with get_db() as conn:
        conn.execute("UPDATE tasks SET status=?, assignee=?, priority=? WHERE id=?", (status, assignee, priority, task_id))
    return one("SELECT * FROM tasks WHERE id=?", (task_id,))


# DOCUMENTS
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
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO documents(case_id, name, doc_type, content, uploaded_at) VALUES(?,?,?,?,?)",
            (payload.case_id, payload.name.strip(), payload.doc_type.strip(), payload.content.strip(), created),
        )
        doc_id = cur.lastrowid
    return one("SELECT documents.*, cases.case_code FROM documents JOIN cases ON cases.id=documents.case_id WHERE documents.id=?", (doc_id,))


# AI ENDPOINTS
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
    q = payload.query.strip()
    if not q:
        return {"results": [], "mode": "demo fallback"}
    docs = rows("SELECT documents.*, cases.case_code FROM documents JOIN cases ON cases.id=documents.case_id")
    results = search_documents(docs, q)
    return {
        "results": results,
        "mode": "demo fallback",
        "notice": "Keyword-based demo search; not a legal research engine.",
    }


@app.get("/ai/task-priority/{task_id}")
def task_priority(task_id: int):
    task = one("SELECT * FROM tasks WHERE id=?", (task_id,))
    if not task:
        raise HTTPException(404, "Task not found")
    return evaluate_task_priority(task)


@app.post("/ai/client-update-draft")
def client_update_draft(payload: DraftRequest):
    case = one("SELECT * FROM cases WHERE id=?", (payload.case_id,))
    if not case:
        raise HTTPException(404, "Case not found")
    tasks = rows("SELECT * FROM tasks WHERE case_id=?", (payload.case_id,))
    text = generate_client_draft_text(case, tasks)
    created = datetime.now().isoformat(timespec="seconds")
    
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO drafts(case_id, draft_text, status, created_at) VALUES(?,?,?,?)",
            (payload.case_id, text, "Pending Review", created),
        )
        draft_id = cur.lastrowid
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


# DRAFTS
@app.patch("/drafts/{draft_id}")
def update_draft_text(draft_id: int, payload: DraftUpdate):
    draft = one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    if not draft:
        raise HTTPException(404, "Draft not found")
    if not payload.draft_text.strip():
        raise HTTPException(400, "Draft text cannot be empty.")
    
    with get_db() as conn:
        conn.execute("UPDATE drafts SET draft_text=? WHERE id=?", (payload.draft_text.strip(), draft_id))
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


@app.post("/drafts/{draft_id}/approve")
def approve_draft(draft_id: int):
    draft = one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    if not draft:
        raise HTTPException(404, "Draft not found")
    
    approved = datetime.now().isoformat(timespec="seconds")
    with get_db() as conn:
        conn.execute("UPDATE drafts SET status='Approved', approved_at=? WHERE id=?", (approved, draft_id))
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


# VALIDATION / FEEDBACK
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
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO validation_feedback(
                 tester_role, task_tested, what_worked, confusing, improvement, final_feedback, created_at
               ) VALUES(?,?,?,?,?,?,?)""",
            (*values, created),
        )
        feedback_id = cur.lastrowid
    return one("SELECT * FROM validation_feedback WHERE id=?", (feedback_id,))
