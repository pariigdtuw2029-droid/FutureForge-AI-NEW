# FutureForge AI

An AI-powered career operating system: resume analysis, skill-gap
detection, learning-plan generation, project recommendations, internship
matching, and career memory — all backed by Gemini + LangGraph, served
through a FastAPI backend and a static HTML/CSS/JS dashboard.

This is the refactored, integrated, and restyled version of the original
project. See **"What changed, phase by phase"** below for a full account
of what was fixed and why. If you just want to run it, start here:

## Quick start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env with your real MongoDB URL, a secret key, and your
# Gemini API key

uvicorn app.main:app --reload --port 8000
```

Swagger UI: **http://127.0.0.1:8000/docs**
Health check: **http://127.0.0.1:8000/health**

Requires a running MongoDB instance (local or Atlas) reachable at the
`MONGODB_URL` you put in `.env`.

### 2. Frontend

The frontend is plain HTML/CSS/JS with no build step. Serve it with any
static file server — e.g. the VS Code "Live Server" extension (this is
what the backend's CORS config expects by default: `127.0.0.1:5500` /
`localhost:5500`), or:

```bash
cd frontend
python -m http.server 5500
```

Then open **http://127.0.0.1:5500/index.html**.

If you serve the frontend from a different host/port, update
`allow_origins` in `backend/app/main.py` to match.

### 3. Try it

1. Sign up / log in (`index.html` → `auth/login.html`).
2. From the dashboard, upload a resume PDF and analyze it.
3. Run Skill Gap → Learning Plan for a target role.
4. Save your profile to Memory, generate a project idea, get internship
   recommendations.

---

## Project structure

```
FutureForge-AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routers, CORS, error handling
│   │   ├── routers/              # One file per API area (auth, resume, agents, ...)
│   │   ├── services/              # Business logic + AI agents
│   │   ├── graph/                 # LangGraph orchestrator (career_ai → guidance → opportunity)
│   │   ├── schemas.py             # Pydantic request/response models
│   │   ├── models.py              # MongoDB document shapes
│   │   ├── database.py            # MongoDB connection
│   │   ├── chroma_db/              # Pre-built vector store for RAG agents
│   │   └── knowledge/              # Source text the vector store was built from
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html                 # Landing page
    ├── auth/                       # Login / signup
    └── dashboard/                  # Main app (resume, skill gap, learning plan, projects, ...)
```

Note: the original project also contained a second, separate FastAPI
backend at its repository root (`/app`) with a different, non-overlapping
set of agents. Per instruction, this deliverable treats `backend/app` as
the one canonical backend; `/app` was left out of scope entirely and
isn't part of this package.

---

## What changed, phase by phase

### Phase 1 — Analysis

Found the project actually contained **two separate, unmerged FastAPI
backends** (`/app` and `backend/app`) from different contributors, plus a
third-party static frontend (`prachi frontend/`, renamed to `frontend/`
here). `backend/app` was confirmed as canonical; `/app` is out of scope.

### Phase 2 — Backend refinement & agent exposure

Fixed three bugs that were breaking real functionality before any
refactor:
- `POST /orchestrator/` crashed on every call (state didn't match what
  the wired graph nodes actually read).
- `services/career_service.py` couldn't be imported (referenced a
  function that didn't exist).
- `resume_service.py` / `internship_service.py` used `await` on
  synchronous pymongo calls, raising `TypeError` on every save/history call.

Exposed agents that had **no API access at all** before this (skill-gap,
learning-plan, structured resume extraction/analysis) under a new
`/agents` router. Added centralized error handling
(`{success, data, message}` envelope), structured logging, and a
`requirements.txt` (didn't exist for this backend before).

### Phase 3 — Frontend ↔ backend integration

Found and fixed a bug that broke the **entire dashboard**: `dashboard.js`
declared `const analyzeResumeBtn` twice, a `SyntaxError` that meant none
of the dashboard's JavaScript ran in any browser, regardless of backend
correctness.

Also found that `POST /resume/analyze` — which looked "wired" — never
actually worked: the schema had no field to receive resume content, and
the frontend only ever sent a filename string. Added a real
`POST /resume/upload` endpoint (extracts PDF text server-side) and
rewired the frontend to use it.

Wired Skill Gap, Learning Planner, Save/Retrieve Memory, and Project
Generator to their real endpoints, each with a local fallback if the API
call fails. Left Interview Coach, AI Mentor Report, and the unified
Career Report un-wired **on purpose** (documented inline) — no backend
agent exists for the first, the second needs a data-collection flow this
UI doesn't have yet, and the third is a client-side rollup with no 1:1
endpoint (`/orchestrator/` is the closest real equivalent).

### Phase 4 — UI/UX premium upgrade

Replaced the two competing neon accent colors (`#ff4fd8` magenta +
`#8A2BE2` purple, used inconsistently ~180 times) with one disciplined
accent plus a single sparing "forge" highlight color — closer to the
Stripe/Notion/Vercel restraint that was asked for. Toned down the
background glow, unified typography (Outfit + Inter + JetBrains Mono for
score numbers) across all three pages, normalized border-radius from 11
inconsistent values down to 3, and added a real CSS custom-property
token system. No copy, structure, or JS logic changed.

### Phase 5 — Code quality

Backend: extracted a shared `services/ai_clients.py` factory — the
Gemini chat client and Chroma vector store were being constructed
identically in 4+ different files. Removed a dead, unused duplicate
`ask_gemini()`. Fixed a genuinely misspelled filename
(`oppurtunity_agent.py` → `opportunity_agent.py`) and a duplicate
`import os`. Replaced bare `print()` debugging with proper logging
(and stopped silently swallowing exceptions).

Frontend: extracted a shared `apiFetch()` helper, collapsing 7
near-identical fetch/error-handling blocks into one ~30-line function.
Fixed a hardcoded URL that bypassed the `API_BASE` constant, and
replaced the last remaining `alert()` calls with the toast pattern used
everywhere else.

### Phase 6 — Integration testing

No network access in the build environment meant no live server test —
here's what was actually verified instead of just re-read:
- **Ran** the Phase 3 PDF-upload fix against a real generated PDF (not
  just syntax-checked) — confirmed correct text extraction.
- **Audited** every frontend API call against the actual backend routes
  and Pydantic schemas — method, path, and field names, in both
  directions. No mismatches found.
- **Cross-referenced** every `getElementById` call against actual HTML
  IDs across all three pages. Found and fixed one real, previously-
  unnoticed bug: the dashboard's welcome header was permanently stuck
  reading "Loading..." because the JS looked for the wrong element ID.

### Phase 7 — Final integration (this package)

Combined the fixed backend and restyled frontend into this single
package, added `.env.example` and `.gitignore`, and consolidated all six
phase reports into this README.

---

## Known limitations / good next steps

- **Not live-tested end-to-end.** Everything above was verified by
  static analysis, contract auditing, and — where possible — actually
  executing the code (see Phase 6). Run it for real (install deps,
  start MongoDB, hit the endpoints) before shipping to confirm request/
  response behavior, and check the quality of Gemini's actual output.
- **Interview Coach** has no backend agent in `backend/app` — it's a
  local-only demo. Would need a new agent + endpoint.
- **AI Mentor Report** has a real endpoint (`GET /mentor/`), but it
  depends on a `career_progress` document this UI never collects. Worth
  designing that input flow if you want this panel live.
- **Skill Gap / Learning Planner** currently build `resume_info` from
  manually-entered skill chips, not from an actual parsed resume. The
  backend has a real extraction endpoint (`POST /agents/resume/extract`)
  that isn't called from the UI yet — wiring the resume-upload flow into
  these agents would make the whole flow resume-driven.
- **CORS** is set for `127.0.0.1:5500` / `localhost:5500` (VS Code Live
  Server). Update `backend/app/main.py` if you deploy the frontend
  elsewhere.
