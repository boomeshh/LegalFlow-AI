# LegalFlow AI — AI-Powered Case & Advocate Workflow Assistant

**Course / Context:** CoE Semester 3 Project: Better Tomorrow  
**Track:** PATHWAY A — Continuation Track  
**Core Operating Principle:**

> **AI suggests → Advocate reviews → Advocate approves → Action happens.**

---

## Executive Summary
LegalFlow AI is an AI-assisted workflow platform designed specifically for legal teams (senior advocates, junior advocates, and legal clerks). It addresses fragmented coordination by organizing cases, delegating tasks, highlighting hearing deadlines, indexing case documents with AI summarization and search, and generating client updates—while strictly maintaining human advocate oversight over all AI output.

---

## Problem Statement
Legal professionals frequently experience fragmented workflow coordination. Task assignments, case status tracking, document search, hearing reminders, and client updates are typically scattered across phone calls, instant messages, paper notes, and unindexed files. This fragmentation leads to:
- Unclear task ownership between senior and junior advocates.
- Lack of visibility into document updates and procedural deadlines.
- Time wasted manually drafting repetitive client progress reports.
- Risk of missed court dates or delayed filing timelines.

---

## Solution Overview
LegalFlow AI acts as a centralized assistant for legal workflows. Key capabilities:
1. **Dashboard:** Unified view of active cases, pending tasks, upcoming court dates, and pending AI review drafts.
2. **Case Management:** Structured case profiles, assigned advocates, category filters, and quick draft actions.
3. **Task Assignment & Tracking:** Senior-to-junior task delegation, status tracking (`Pending`, `In Progress`, `Done`), and AI task priority suggestions.
4. **Document Management:** Centralized case file library with instant preview and uploaded date tracking.
5. **AI Document Summary & Search:** Instant text summarization and keyword match search over case files.
6. **Hearing & Deadline Reminders:** Visual highlight banners and countdown alerts for upcoming court appearances.
7. **AI-Assisted Client Update Drafting:** Automated draft generation synthesizing case status and completed task metrics.
8. **Advocate Review & Approval Flow:** Strict review interface where drafts remain in `Pending Review` until approved or edited by an advocate.
9. **Tester Validation Module:** Clean evaluation form and table for structured feedback from real testers (students, advocates, faculty).

---

## 3-Phase Project Process

### Phase 1 — IDEATE
Explored 8 distinct solution concepts across 5 criteria (Problem relevance, User value, AI usefulness, Technical feasibility, Privacy/safety).
- **Selected Solution:** *LegalFlow AI — Integrated Workflow Assistant* (unified case, task, document, reminder, and drafting solution).
- **Runner-up:** *Advocate–Junior Task Coordinator* (focused delegation model).
- Details in [`PHASE1_IDEATE.md`](./PHASE1_IDEATE.md).

### Phase 2 — PROTOTYPE
Built a clean, responsive, low-to-mid/high fidelity working web prototype:
- **Frontend:** Next.js / React with Vanilla CSS tokens & responsive layout.
- **Backend:** Python FastAPI with SQLite database (`legalflow_demo.db`).
- **AI Integration:** Transparent deterministic AI fallback mode that generates summaries, searches excerpts, suggests priority, and drafts updates without requiring paid third-party API keys.

### Phase 3 — VALIDATE
Integrated an interactive feedback collection section (`/validation`) featuring a blank-slate feedback form and table capturing Role, Task Tested, What Worked, What Was Confusing, Suggested Improvement, and Final Feedback.

---

## System Architecture

```text
+-------------------------------------------------------------+
|                     Next.js React Web App                   |
|  (Dashboard, Cases, Tasks, Documents + AI, Validation UI)   |
+-------------------------------------------------------------+
                              |
                     REST API / JSON
                              v
+-------------------------------------------------------------+
|                    FastAPI Backend (Python)                 |
+-------------------------------------------------------------+
           /                      |                       \
          v                       v                        v
+--------------------+  +-------------------+  +--------------------+
| SQLite DB          |  | AI Logic Engine   |  | Validation Module  |
| - cases            |  | - Summarizer      |  | - tester feedback  |
| - tasks            |  | - Keyword Search  |  | - rating & status  |
| - documents        |  | - Priority Hints  |  +--------------------+
| - drafts           |  | - Client Drafter  |
+--------------------+  +-------------------+

Responsible AI Boundary:
AI suggests -> Advocate reviews -> Advocate approves -> Action happens.
```

---

## AI Usage & Fallback Architecture
The backend contains a deterministic, transparent **Demo AI Engine**:
- **Summarization:** Extracts core informative sentences from document text without external LLM dependencies.
- **Search:** Performs token-matching over indexed document text with context preview.
- **Task Priority:** Evaluates deadline proximity and keywords to suggest High/Medium/Low priority.
- **Drafting:** Assembles case status metrics into professional client update templates.

This ensures 100% reliable local demos for academic evaluation while maintaining a pluggable architecture for real LLM integration (e.g. OpenAI / Gemini API).

---

## Privacy & Responsible AI Safeguards
- **Synthetic Data Only:** The system pre-loads sample demo data. No real legal files, client names, or confidential court records are stored or processed.
- **No Autonomous Action:** The AI cannot send emails, file pleadings, or modify court records automatically.
- **Human Authority:** Every AI draft requires explicit advocate approval before status changes to `Approved`.
- **Transparency:** All AI outputs feature clear disclaimers indicating they are AI-generated suggestions requiring human review.

---

## Setup & Run Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 2. Run Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 3. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will run at `http://localhost:3000`.

---

## Demo Review Flow (For Evaluators)
1. **Dashboard (`/`):** Observe overall case count, open task count, pending AI drafts, and upcoming hearing alerts.
2. **Cases (`/cases`):** View demo legal cases. Click **"Generate client update draft"** on any case to trigger the AI drafting flow.
3. **Advocate Review:** Notice the draft appears in **Pending Review** status. Review the draft, edit if needed, and click **"Approve draft"**.
4. **Tasks (`/tasks`):** View senior/junior assignments. Click **"AI priority"** to receive an automated urgency recommendation.
5. **Documents + AI (`/documents`):** Try searching terms like `notice clause` or click **"Generate summary"** on any synthetic document.
6. **Validation (`/validation`):** Enter real evaluator feedback in the form to test feedback collection.

