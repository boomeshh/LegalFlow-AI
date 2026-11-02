# LegalFlow AI — AI-Powered Case & Advocate Workflow Assistant

> **AI suggests → Advocate reviews → Advocate approves → Action happens.**

LegalFlow AI is an AI-assisted workflow platform designed for legal teams. It helps advocates organize cases, assign and track tasks, manage documents, monitor hearing dates, generate document summaries, search case files, and prepare client status updates while keeping the advocate in control of every important AI-assisted action.

---

## Overview

Legal professionals often manage case-related work through multiple channels such as phone calls, messages, handwritten notes, folders, PDFs, and physical documents.

When information is spread across different places, it becomes difficult to clearly track:

- Who is responsible for a task
- Whether a task is completed
- Upcoming hearing dates and deadlines
- Important case documents
- Case progress
- Client updates

LegalFlow AI brings these activities into one organized workflow system.

The platform is designed to assist legal professionals without replacing legal judgment.

---

## Problem Statement

Legal teams frequently face fragmented workflow coordination.

Task assignments, case status tracking, document search, hearing reminders, and client communication may be managed manually across calls, messages, notes, and different files.

This can lead to:

- Unclear task ownership
- Repeated follow-ups
- Difficulty tracking task progress
- Time-consuming document searches
- Missed or overlooked deadlines
- Repetitive client update preparation
- Limited visibility across the legal team

LegalFlow AI aims to reduce this coordination effort by providing a centralized workflow assistant.

---

## Solution

LegalFlow AI provides a single workspace for managing legal workflow activities.

The system combines:

- Case management
- Task assignment and tracking
- Document organization
- AI-assisted document search
- Document summarization
- Hearing and deadline reminders
- Task priority suggestions
- Client update drafting
- Advocate review and approval

The system follows a strict human-in-the-loop process:

```text
AI suggests
      ↓
Advocate reviews
      ↓
Advocate edits if required
      ↓
Advocate approves
      ↓
Action happens
```

AI assists the advocate but does not make final legal decisions.

---

## Core Features

### Dashboard

The dashboard provides a quick overview of:

- Active cases
- Open tasks
- Upcoming hearings
- Important deadlines
- Pending AI-generated drafts
- Recent workflow activity

---

### Case Management

Users can create and manage structured case records.

Each case can contain:

- Case title
- Case category
- Case status
- Assigned advocate
- Assigned junior advocate
- Hearing information
- Related tasks
- Related documents
- Client update drafts

---

### Task Assignment & Tracking

Senior advocates can assign tasks to junior advocates and monitor progress.

Supported task states include:

```text
Pending
In Progress
Done
```

Tasks can include:

- Title
- Description
- Assigned person
- Due date
- Current status
- Priority level

The system can also provide AI-assisted task priority suggestions.

---

### Document Management

LegalFlow AI provides a centralized document workspace.

Users can:

- Add documents
- View document details
- Associate documents with cases
- Search document content
- Generate document summaries
- View uploaded dates and metadata

Only synthetic demonstration documents should be used in the prototype environment.

---

### AI Document Summarization

The AI assistant can analyze document text and generate a short summary containing the most relevant information.

Example workflow:

```text
Document
   ↓
AI Analysis
   ↓
Generated Summary
   ↓
Advocate Review
```

The generated summary is treated as an assistance tool and should always be reviewed by the user.

---

### AI-Assisted Document Search

Users can search case documents using keywords or relevant terms.

The search system identifies matching documents and returns useful text previews.

Example:

```text
Search Query
      ↓
Document Matching
      ↓
Relevant Results
      ↓
Preview
```

---

### Hearing & Deadline Reminders

Important hearing dates and task deadlines are displayed clearly within the system.

The dashboard can highlight:

- Upcoming hearings
- Near deadlines
- Overdue tasks
- Important case activities

This helps users maintain better workflow visibility.

---

### AI Task Priority Suggestions

LegalFlow AI can suggest task priority based on factors such as:

- Deadline proximity
- Task status
- Task description
- Urgency-related keywords

Possible suggestions:

```text
High
Medium
Low
```

The suggestion is informational only.

The final priority decision remains with the advocate.

---

### AI-Assisted Client Update Drafting

The system can generate a draft client update using available case information.

The generated draft may include:

- Current case status
- Recent completed tasks
- Upcoming hearing information
- Pending activities

The draft is never treated as final automatically.

It must pass through the advocate review process.

```text
Case Information
      ↓
AI Draft
      ↓
Pending Review
      ↓
Advocate Edit / Review
      ↓
Approved
```

---

## Advocate Review & Approval

Human review is one of the core principles of LegalFlow AI.

AI-generated content remains in:

```text
Pending Review
```

until an advocate reviews it.

The advocate can:

- Read the generated content
- Edit the content
- Reject incorrect information
- Approve the final version

Only after approval does the status change to:

```text
Approved
```

This ensures that AI supports legal work without replacing professional judgment.

---

## Solution Ideation

Several focused solutions were explored before selecting the integrated LegalFlow AI platform.

### 1. Smart Case Calendar

A centralized calendar for:

- Hearing dates
- Filing deadlines
- Important case events
- Automated reminders

---

### 2. Advocate–Junior Task Coordinator

A focused task management system for:

- Task assignment
- Ownership tracking
- Progress monitoring
- Follow-up management

---

### 3. AI Document Organizer

An AI-assisted document workspace for:

- Organizing files
- Searching documents
- Summarizing content
- Finding important information

---

### 4. Hearing & Deadline Reminder System

A focused reminder system for:

- Court hearings
- Filing deadlines
- Important legal dates
- Pending actions

---

### 5. Client Update Draft Assistant

An AI assistant that generates case progress drafts for advocate review.

---

### 6. Legal Search & Summary Workspace

A document intelligence tool focused on:

- Document search
- Information extraction
- Document summaries
- Relevant text discovery

---

### 7. Task Priority Assistant

An AI-supported system that helps identify tasks that may require earlier attention.

---

### 8. LegalFlow AI — Integrated Workflow Assistant

The selected solution combines the strongest features of the previous ideas into one unified platform.

It includes:

- Case management
- Task tracking
- Document intelligence
- Hearing reminders
- AI summaries
- Search assistance
- Priority suggestions
- Client update drafting
- Human review and approval

The **Advocate–Junior Task Coordinator** remains a strong focused alternative because of its simplicity and high implementation feasibility.

---

## Solution Comparison

| Solution | Problem Relevance | User Value | AI Usefulness | Technical Feasibility | Privacy / Safety |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Smart Case Calendar | High | High | Medium | High | High |
| Advocate–Junior Task Coordinator | High | High | Medium | High | High |
| AI Document Organizer | High | High | High | Medium | Medium |
| Hearing & Deadline Reminders | High | High | Low | High | High |
| Client Update Draft Assistant | High | High | High | High | Medium |
| Legal Search & Summary Workspace | High | High | High | Medium | Medium |
| Task Priority Assistant | Medium | High | High | High | High |
| **LegalFlow AI** | **High** | **High** | **High** | **High** | **Medium** |

### Selected Solution

**LegalFlow AI — Integrated Workflow Assistant**

It was selected because it addresses multiple connected workflow problems within one system instead of solving only one isolated problem.

### Runner-Up

**Advocate–Junior Task Coordinator**

It provides a focused and technically simple solution for improving task delegation and workflow visibility.

---

## System Architecture

```text
+----------------------------------------------------------+
|                  Next.js / React Frontend                |
|                                                          |
| Dashboard | Cases | Tasks | Documents | Validation       |
+----------------------------------------------------------+
                            |
                       REST API
                            |
                            v
+----------------------------------------------------------+
|                     FastAPI Backend                      |
|                         Python                           |
+----------------------------------------------------------+
            |                    |                    |
            v                    v                    v
+------------------+   +-------------------+   +------------------+
| SQLite Database  |   | AI Logic Engine   |   | Feedback Module  |
|                  |   |                   |   |                  |
| Cases            |   | Summarization     |   | Tester Role      |
| Tasks            |   | Search            |   | Task Tested      |
| Documents        |   | Priority Suggest. |   | Observations     |
| Drafts           |   | Client Drafting   |   | Suggestions      |
+------------------+   +-------------------+   +------------------+
```

---

## Technology Stack

### Frontend

- Next.js
- React
- JavaScript
- Vanilla CSS

### Backend

- Python
- FastAPI
- REST API

### Database

- SQLite

### AI Layer

The prototype contains a deterministic AI-style processing layer for:

- Document summarization
- Keyword-based search
- Task priority suggestions
- Client update drafting

The architecture can later be extended to integrate external LLM or NLP services.

---

## AI Architecture

LegalFlow AI uses AI only as an assistant.

### Document Summarization

The system extracts useful sentences from document text and creates a short summary.

### Document Search

Search terms are compared against indexed document content and matching text previews are returned.

### Task Priority

Task information and deadline proximity are used to provide a suggested priority.

### Client Update Drafting

Available case information is combined into a structured client update draft.

All generated content remains subject to human review.

---

## Responsible AI

LegalFlow AI follows a human-in-the-loop design.

### Core Rule

```text
AI suggests → Advocate reviews → Advocate approves → Action happens
```

### AI Does

- Summarize information
- Search documents
- Extract relevant information
- Suggest task priority
- Prepare draft content

### AI Does Not

- Provide final legal decisions
- Automatically approve legal documents
- Send client communication without review
- Submit court documents
- Modify official court records
- Replace advocate judgment

---

## Privacy & Security Principles

Legal information may contain sensitive or confidential content.

The system therefore follows several basic principles:

- Use synthetic demo data during development
- Avoid storing real confidential legal records in the prototype
- Restrict access to authorized users
- Keep AI-generated content clearly identifiable
- Require human review before approval
- Avoid autonomous legal actions
- Protect stored case and document information

---

## Validation & Feedback

The application includes a feedback section for real users to evaluate the prototype.

The form captures:

- Role
- Task tested
- What worked
- What was confusing
- Suggested improvement
- Final feedback

No feedback is pre-generated.

Actual tester observations can be added after using the application.

---

## Project Structure

```text
LegalFlow-AI/
│
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── legalflow_demo.db
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.js
│   │   ├── cases/
│   │   ├── tasks/
│   │   ├── documents/
│   │   └── validation/
│   └── package.json
│
├── PHASE1_IDEATE.md
└── README.md
```

---

## Setup

### Prerequisites

Install:

- Node.js 18 or newer
- Python 3.9 or newer

---

## Run Backend

```bash
cd backend

py -3.12 -m venv .venv312
```

### Windows

```bash
.venv312\Scripts\activate
```

### macOS / Linux

```bash
source .venv312/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

---

## Run Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Demo Flow

A simple demonstration flow is:

```text
Dashboard
   ↓
Cases
   ↓
Generate Client Update Draft
   ↓
Advocate Review
   ↓
Approve Draft
   ↓
Tasks
   ↓
AI Priority Suggestion
   ↓
Documents
   ↓
AI Search / Summary
   ↓
Feedback
```

### Dashboard

View:

- Active cases
- Pending tasks
- Hearing reminders
- AI drafts awaiting review

### Cases

Open a case and generate a client update draft.

### Advocate Review

Review or edit the AI-generated draft before approving it.

### Tasks

View assigned tasks and request an AI priority suggestion.

### Documents

Search document content and generate summaries.

### Feedback

Enter real user feedback after testing the system.

---

## Review 2 — New Features

### 1. Hybrid Retrieval Abstraction (AI Search)

`backend/app/retrieval.py` introduces a clean retrieval interface:

```
BaseRetriever          (abstract)
  ├── KeywordRetriever (default — no extra deps, deterministic TF matching)
  └── VectorRetriever  (future — FAISS + sentence-transformers stub)
```

Switch backend by setting an environment variable before starting the server:

```bash
# Default (no change required)
RETRIEVAL_BACKEND=keyword

# Future semantic search (requires: pip install faiss-cpu sentence-transformers)
RETRIEVAL_BACKEND=vector
```

The existing keyword search continues to work without any change.

---

### 2. Authentication & RBAC

A simple demo JWT-based auth layer has been added.

**Demo credentials** (password for all: `demo123`):

| Username | Role | Access |
| :--- | :--- | :--- |
| `senior_advocate` | Senior Advocate | Full access — cases, tasks, documents, drafts, AI |
| `junior_advocate` | Junior Advocate | Tasks, case/doc read, AI search & summary |
| `client` | Client | Read-only dashboard and case list |

**Login endpoint:**

```
POST /auth/login
{ "username": "senior_advocate", "password": "demo123" }
```

All protected endpoints require a `Bearer` token in the `Authorization` header.

The frontend has a `/login` page with one-click demo role shortcuts. The navigation bar shows the current user and a sign-out button. Each page redirects to login if unauthenticated.

This is a **demo-only** implementation. No real credentials are used or stored.

---

### 3. Automated Tests (pytest + GitHub Actions CI)

A pytest suite in `backend/tests/test_api.py` covers:

- Health check
- Authentication (login, `/auth/me`, bad credentials, RBAC enforcement)
- Dashboard
- Cases (list, create, get, error cases)
- Tasks (list, create, update, role checks)
- Documents (list, get, create, validation)
- AI endpoints (summary, search, task-priority, client-draft)
- Drafts (update text, approve, RBAC)
- Validation / Feedback (list, create, role checks)
- Retrieval abstraction unit tests

**Run tests locally:**

```bash
cd backend
py -3.12 -m venv .venv312
.venv312\Scripts\activate   # Windows
source .venv312/bin/activate # macOS/Linux
pip install -r requirements.txt
pytest tests/ -v
```

**GitHub Actions CI** (`.github/workflows/ci.yml`) runs automatically on push to `main`, `dev`, or `review-2` branches and on pull requests to `main`. It runs:

1. `pytest` against the backend (Python 3.11)
2. `npm run build` against the frontend (Node.js 20)

---

## Implementation Reference

The sections below describe the current implementation in `backend/app` and
the frontend API client. They are intentionally limited to routes and data
that exist in this repository.

### API endpoints

All protected routes require `Authorization: Bearer <access_token>`. The
permission column names are the RBAC tags enforced by the backend.

| Method | Route | Authentication / permission | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Return service status, mode, and version. |
| POST | `/auth/login` | Public | Validate a demo username/password and return a JWT, role, and display name. |
| GET | `/auth/me` | Bearer token | Return the authenticated user and sorted permissions. |
| GET | `/dashboard` | `dashboard:read` | Return case, open-task, pending-draft, hearing, and task dashboard data. |
| GET | `/cases` | `cases:read` | List cases ordered by ID. |
| POST | `/cases` | `cases:write` | Create a case after normalization and duplicate-code checks. |
| GET | `/cases/{case_id}` | `cases:read` | Return one case with related tasks, documents, and drafts. |
| GET | `/tasks` | `tasks:read` | List tasks with their case codes. |
| POST | `/tasks` | `tasks:write` | Create a pending task for an existing case. |
| PATCH | `/tasks/{task_id}` | `tasks:write` | Update a task's status, assignee, and/or priority. |
| GET | `/documents` | `documents:read` | List documents with case codes and metadata/content. |
| GET | `/documents/{document_id}` | `documents:read` | Return one document with its case code. |
| POST | `/documents` | `documents:write` | Create a document for an existing case. |
| POST | `/ai/summary` | `ai:summary` | Return a deterministic summary for a document. |
| POST | `/ai/search` | `ai:search` | Search document names/content using the configured retrieval backend. |
| GET | `/ai/task-priority/{task_id}` | `ai:priority` | Suggest priority from task status and due-date proximity. |
| POST | `/ai/client-update-draft` | `ai:all` | Generate and persist a pending client-update draft for a case. |
| PATCH | `/drafts/{draft_id}` | `drafts:write` | Edit draft text. |
| POST | `/drafts/{draft_id}/approve` | `drafts:approve` | Mark a draft approved and record the approval time. |
| GET | `/validation` | `validation:read` | List tester feedback, newest first. |
| POST | `/validation` | `validation:write` | Validate and persist tester feedback. |

Request and response shapes are defined by the Pydantic models in
`backend/app/schemas.py` and by the route return values in
`backend/app/main.py`. FastAPI's generated documentation is available at
`http://localhost:8000/docs` while the backend is running.

### Authentication and RBAC

The prototype has three in-memory demo users. All use the password `demo123`.
The backend signs JWTs for eight hours with the demo secret in
`backend/app/auth.py`; this is not production authentication.

| Role | Permissions |
|---|---|
| `senior_advocate` | Full case, task, document, draft, AI, validation, and dashboard access. |
| `junior_advocate` | Read cases/documents; read/write tasks; read drafts; summary/search/priority AI; read/write validation; dashboard. |
| `client` | Read cases and dashboard only. |

The frontend uses role permissions to show or hide controls, but the backend
dependency checks are the security boundary. A missing or invalid token is
`401`; an authenticated role without a permission is `403`.

### SQLite schema

The default database is `backend/legalflow_demo.db`. Tests can override it
with `LEGALFLOW_DB`. `init_db()` creates the following tables if they do not
exist. SQLite stores the declared types below using its normal type affinity.

| Table | Field | SQLite type | Constraints / relationship |
|---|---|---|---|
| `cases` | `id` | INTEGER | Primary key. |
| `cases` | `case_code` | TEXT | Unique, not null. |
| `cases` | `title` | TEXT | Not null. |
| `cases` | `category` | TEXT | Not null. |
| `cases` | `status` | TEXT | Not null. |
| `cases` | `next_hearing` | TEXT | Nullable; stored as a date string when supplied. |
| `cases` | `owner` | TEXT | Not null. |
| `tasks` | `id` | INTEGER | Primary key. |
| `tasks` | `case_id` | INTEGER | Not null; foreign key to `cases.id`. |
| `tasks` | `title` | TEXT | Not null. |
| `tasks` | `assignee` | TEXT | Not null. |
| `tasks` | `due_date` | TEXT | Nullable; stored as a date string. |
| `tasks` | `status` | TEXT | Not null. |
| `tasks` | `priority` | TEXT | Not null. |
| `documents` | `id` | INTEGER | Primary key. |
| `documents` | `case_id` | INTEGER | Not null; foreign key to `cases.id`. |
| `documents` | `name` | TEXT | Not null. |
| `documents` | `doc_type` | TEXT | Not null. |
| `documents` | `content` | TEXT | Not null. |
| `documents` | `uploaded_at` | TEXT | Not null; ISO timestamp string. |
| `drafts` | `id` | INTEGER | Primary key. |
| `drafts` | `case_id` | INTEGER | Not null; foreign key to `cases.id`. |
| `drafts` | `draft_text` | TEXT | Not null. |
| `drafts` | `status` | TEXT | Not null. |
| `drafts` | `created_at` | TEXT | Not null; ISO timestamp string. |
| `drafts` | `approved_at` | TEXT | Nullable; ISO timestamp after approval. |
| `validation_feedback` | `id` | INTEGER | Primary key. |
| `validation_feedback` | `tester_role` | TEXT | Not null. |
| `validation_feedback` | `task_tested` | TEXT | Not null. |
| `validation_feedback` | `what_worked` | TEXT | Not null. |
| `validation_feedback` | `confusing` | TEXT | Not null. |
| `validation_feedback` | `improvement` | TEXT | Not null. |
| `validation_feedback` | `final_feedback` | TEXT | Not null. |
| `validation_feedback` | `created_at` | TEXT | Not null; ISO timestamp string. |

The relationships are one-to-many from `cases` to `tasks`, `documents`, and
`drafts`. `validation_feedback` is independent and has no foreign keys.
The application uses parameterized SQL queries through `rows()`, `one()`,
and short-lived connections in `backend/app/database.py`.

### Error handling

FastAPI route code raises `HTTPException` for authentication (`401`),
authorization (`403`), invalid business input (`400`), and missing resources
(`404`). Pydantic request-model failures are handled by FastAPI as `422`
responses. Unexpected backend exceptions are not converted into fake success
responses and should be investigated in server logs.

The frontend API client converts non-2xx responses into errors and preserves
FastAPI's `detail` text. It removes the stored token after `401` responses.
Page handlers show loading/action failures in the existing notice UI. The
Next.js route-level boundary in `frontend/app/error.js` covers unexpected
React rendering errors and provides a retry action; it does not replace
backend or page-level API handling.

### Testing and verification

Backend tests use a temporary SQLite file and cover authentication, RBAC,
endpoint success paths, validation, not-found cases, empty search input, AI
helpers, and retrieval ranking. The frontend currently has no separate
component-test framework, so `npm run build` is the production compilation
check, including the App Router boundary.

See [`TESTING.md`](TESTING.md) for the complete test-case inventory,
edge-case expectations, commands, and guidance for adding tests. The CI
workflow runs `pytest tests/ -v --tb=short` in `backend` and `npm run build`
in `frontend`.

---

Possible future improvements include:

- Secure cloud document storage
- Better document indexing
- Advanced semantic search
- Notification services
- Calendar integration
- Audit logs
- Real LLM integration
- Encryption for sensitive content
- Improved case analytics
- Deployment with a production database

---

## Project Goal

LegalFlow AI is designed to make legal workflow coordination more organized, visible, and efficient.

The goal is not to automate legal judgment.

The goal is to give legal professionals better tools for managing information, tasks, documents, deadlines, and communication while keeping human professionals in control.

> **AI assists. The advocate decides.**
