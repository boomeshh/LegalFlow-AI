from __future__ import annotations

from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
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
from .auth import (
    LoginRequest,
    TokenResponse,
    get_current_user,
    require_permission,
    login_handler,
)

app = FastAPI(title="LegalFlow AI API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    # Startup creates missing tables and seeds only an empty demo database.
    init_db()


# ---------------------------------------------------------------------------
# Public endpoints (no auth required)
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "mode": "demo-ai", "version": "1.1.0"}


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Demo login. Returns a signed JWT for use as Bearer token.

    Demo credentials:
      senior_advocate / demo123  — full access
      junior_advocate / demo123  — tasks + limited case/doc access
      client          / demo123  — read-only case status
    """
    return login_handler(payload)


@app.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    """Return current authenticated user info."""
    from .auth import ROLE_PERMISSIONS
    return {
        "username": user["username"],
        "role": user["role"],
        "display_name": user["display_name"],
        "permissions": sorted(ROLE_PERMISSIONS.get(user["role"], [])),
    }


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.get("/dashboard")
def dashboard(_user: dict = Depends(require_permission("dashboard:read"))):
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


# ---------------------------------------------------------------------------
# Cases
# ---------------------------------------------------------------------------

@app.get("/cases")
def list_cases(_user: dict = Depends(require_permission("cases:read"))):
    return rows("SELECT * FROM cases ORDER BY id")


@app.post("/cases")
def create_case(payload: CaseCreate, _user: dict = Depends(require_permission("cases:write"))):
    # Normalize identifiers before checking uniqueness so casing does not
    # create visually duplicate demo cases.
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
def get_case(case_id: int, _user: dict = Depends(require_permission("cases:read"))):
    case = one("SELECT * FROM cases WHERE id=?", (case_id,))
    if not case:
        raise HTTPException(404, "Case not found")
    case["tasks"] = rows("SELECT * FROM tasks WHERE case_id=? ORDER BY due_date", (case_id,))
    case["documents"] = rows("SELECT id, case_id, name, doc_type, content, uploaded_at FROM documents WHERE case_id=?", (case_id,))
    case["drafts"] = rows("SELECT * FROM drafts WHERE case_id=? ORDER BY created_at DESC", (case_id,))
    return case


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@app.get("/tasks")
def list_tasks(_user: dict = Depends(require_permission("tasks:read"))):
    return rows(
        """SELECT tasks.*, cases.case_code FROM tasks
           JOIN cases ON cases.id=tasks.case_id ORDER BY due_date"""
    )


@app.post("/tasks")
def create_task(payload: TaskCreate, _user: dict = Depends(require_permission("tasks:write"))):
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
def update_task(task_id: int, payload: TaskUpdate, _user: dict = Depends(require_permission("tasks:write"))):
    task = one("SELECT * FROM tasks WHERE id=?", (task_id,))
    if not task:
        raise HTTPException(404, "Task not found")
    status = payload.status or task["status"]
    assignee = payload.assignee or task["assignee"]
    priority = payload.priority or task["priority"]
    with get_db() as conn:
        conn.execute("UPDATE tasks SET status=?, assignee=?, priority=? WHERE id=?", (status, assignee, priority, task_id))
    return one("SELECT * FROM tasks WHERE id=?", (task_id,))


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

@app.get("/documents")
def list_documents(_user: dict = Depends(require_permission("documents:read"))):
    return rows(
        """SELECT documents.id, documents.case_id, documents.name, documents.doc_type,
                  documents.content, documents.uploaded_at, cases.case_code
           FROM documents JOIN cases ON cases.id=documents.case_id
           ORDER BY uploaded_at DESC"""
    )


@app.get("/documents/{document_id}")
def get_document(document_id: int, _user: dict = Depends(require_permission("documents:read"))):
    doc = one(
        """SELECT documents.*, cases.case_code FROM documents
           JOIN cases ON cases.id=documents.case_id WHERE documents.id=?""",
        (document_id,),
    )
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@app.post("/documents")
def create_document(payload: DocumentCreate, _user: dict = Depends(require_permission("documents:write"))):
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


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------

@app.post("/ai/summary")
def ai_summary(payload: SummaryRequest, _user: dict = Depends(require_permission("ai:summary"))):
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
def ai_search(payload: SearchRequest, _user: dict = Depends(require_permission("ai:search"))):
    # Blank search is a valid no-result request; retrieval is skipped.
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
def task_priority(task_id: int, _user: dict = Depends(require_permission("ai:priority"))):
    task = one("SELECT * FROM tasks WHERE id=?", (task_id,))
    if not task:
        raise HTTPException(404, "Task not found")
    return evaluate_task_priority(task)


@app.post("/ai/client-update-draft")
def client_update_draft(payload: DraftRequest, _user: dict = Depends(require_permission("ai:all"))):
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


# ---------------------------------------------------------------------------
# Drafts
# ---------------------------------------------------------------------------

@app.patch("/drafts/{draft_id}")
def update_draft_text(draft_id: int, payload: DraftUpdate, _user: dict = Depends(require_permission("drafts:write"))):
    draft = one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    if not draft:
        raise HTTPException(404, "Draft not found")
    if not payload.draft_text.strip():
        raise HTTPException(400, "Draft text cannot be empty.")

    with get_db() as conn:
        conn.execute("UPDATE drafts SET draft_text=? WHERE id=?", (payload.draft_text.strip(), draft_id))
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


@app.post("/drafts/{draft_id}/approve")
def approve_draft(draft_id: int, _user: dict = Depends(require_permission("drafts:approve"))):
    draft = one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    if not draft:
        raise HTTPException(404, "Draft not found")

    approved = datetime.now().isoformat(timespec="seconds")
    with get_db() as conn:
        conn.execute("UPDATE drafts SET status='Approved', approved_at=? WHERE id=?", (approved, draft_id))
    return one("SELECT * FROM drafts WHERE id=?", (draft_id,))


# ---------------------------------------------------------------------------
# Validation / Feedback
# ---------------------------------------------------------------------------

@app.get("/validation")
def list_feedback(_user: dict = Depends(require_permission("validation:read"))):
    return rows("SELECT * FROM validation_feedback ORDER BY created_at DESC")


@app.post("/validation")
def create_feedback(payload: FeedbackRequest, _user: dict = Depends(require_permission("validation:write"))):
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
