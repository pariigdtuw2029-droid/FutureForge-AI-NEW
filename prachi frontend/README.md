# AI HelpDesk Agent — Frontend

Refined frontend build, delivered page-by-page. This package reflects everything
completed so far.

## File structure

```
internship-proj/
├── index.html            Landing page
├── style.css
├── script.js
│
├── auth/                 Authentication
│   ├── login.html
│   ├── signup.html
│   ├── auth.css
│   └── auth.js
│
└── dashboard/             Main application (single-page app)
    ├── dashboard.html      Sidebar + all agent sections
    ├── dashboard.css
    └── dashboard.js
```

## Status by phase

| Phase | Section | Status |
|---|---|---|
| 1 | Landing Page | ✅ Complete |
| 2 | Authentication (Login & Signup) | ✅ Complete |
| 3 | Dashboard (shell + Home overview) | ✅ Complete — sticky/collapsible sidebar, mobile off-canvas nav, Quick Actions, Recent Activity feed, Achievements, 4 charts |
| 4 | Resume Analyzer | ✅ Complete |
| 5 | Skill Gap | ✅ Complete |
| 6 | Learning Planner | ✅ Complete — auto-personalizes from Skill Gap results |
| 7 | Project Architect | ✅ Complete — matches full backend contract (16 output fields) |
| 8 | Internship Recommendation | ✅ Complete — matches full backend contract |
| 9 | Mock Interview | ✅ Complete — live mic/speech-to-text, multi-question sessions, final report |
| 10 | Memory Agent | ⏳ Not started |
| 11 | AI Mentor | ✅ Complete — live career snapshot & radar computed from every other agent, dynamic strengths/improvements, "Ask Your Mentor" Q&A, full report generation, saved report history |
| 12 | LangGraph Workflow | ✅ Complete — pipeline and Agent Status grid now reflect real completion per agent, live progress %, unified report generation combining every agent's actual data, working .txt download |

`dashboard.html` is a single-page app: every agent above already exists as a
`<section class="content-page">` inside that one file, switched by the sidebar.
Phases 10–12 will each polish their own section in place rather than add new files.

## Notable details for the backend team

- **Auth endpoints**: `auth/auth.js` posts to `/api/auth/login` and
  `/api/auth/signup` — placeholder paths, update to match your real API.
- **Session/personalization**: on successful login/signup, `auth.js` stores
  `{ name, email }` in `localStorage` under the key `ai_helpdesk_user`. The
  dashboard reads this to show the real name/initials instead of the "User
  Name" / "U" placeholders. Swap this for your real session mechanism when
  ready.
- **Agent endpoints** (all currently commented-in with a working mock
  fallback — search each agent's JS block for "BACKEND INTEGRATION"):
  - Resume Analyzer → `/api/resume-analyzer`
  - Skill Gap → `/api/skill-gap`
  - Learning Planner → `/api/learning-planner`
  - Project Architect → `/api/project`
  - Internship Recommendation → `/api/internship-recommendation`
  - Mock Interview → `/api/evaluate-answer`
  - AI Mentor → `/api/mentor-report` (POST body is the live snapshot object
    built by `getMentorInputs()` — resume/skill/interview/project/internship
    data already assembled client-side for you)
  - LangGraph Orchestrator → `/api/career-report` (POST body is
    `computeWorkflowStatus()` — per-agent completion + detail for all 7
    agents; response `report` string replaces the client-built one)
- **LangGraph Orchestrator status**: `computeWorkflowStatus()` checks real
  state from every agent (resume analysis, skill gap, learning plan, saved
  projects, interview history, a memory-saved flag, and mentor report/
  history) — the pipeline, Agent Status grid, and progress bar all update
  live, including when you open the tab after using other agents.
- **Career report download**: "Download Report" builds a `.txt` file
  client-side via `Blob` — no backend required for this button; swap for a
  real PDF/export endpoint whenever ready.
- **Cross-agent handoffs that already work**: Skill Gap → Learning Planner
  (missing/partial skills carry over automatically), Home's Recent Activity
  feed logs real actions from Resume Analyzer, Skill Gap, Learning Planner,
  Project Architect, Internship Recommendation, and Mock Interview. AI Mentor
  reads live data from every one of those agents (resume score, skill
  readiness, interview average, saved projects, internship matches) with no
  manual wiring needed — it recomputes automatically whenever the Mentor tab
  is opened.
- **Persisted history** (all `localStorage`-backed, ready to swap for real
  API-backed history): Project Architect, Internship Recommendation, Mock
  Interview, and AI Mentor each save full results and can reload them via
  "View Full Report/Blueprint".
- **Mock Interview microphone**: uses the browser's native Web Speech API
  (`SpeechRecognition`) for live transcription — no backend needed for this
  part. Falls back to a toast telling the user to type if the browser
  doesn't support it (e.g. Firefox, Safari).
- **Charts**: Chart.js (CDN) is used throughout — Home (line, doughnut,
  radar, bar), Internship Recommendation (bar + doughnut), Mock Interview
  (bar), AI Mentor (radar — Resume/Skills/Interview/Projects/Internships
  readiness). All currently on real computed data (not hardcoded
  placeholders) once you interact with each agent.
- **AI Mentor "Ask Your Mentor"**: lightweight keyword-matched Q&A
  (`answerMentorQuestion()`) running entirely client-side against the same
  live snapshot — swap for a real LLM call whenever you're ready; the
  question/answer UI is already wired.
- **Design system**: dark navy background (`#06142E` / `#06142b`), pink→purple
  gradient accent (`#ff4fd8` → `#8A2BE2`), glassmorphism cards, 'Outfit' font
  on the landing/auth pages and 'Poppins' on the dashboard. Kept consistent
  across all phases so far.
- **Accessibility**: keyboard navigation, focus states, `aria-hidden` on
  decorative icons, and `prefers-reduced-motion` support are in place across
  all completed pages.

## Known items for later phases

- Memory Agent (Phase 10) still contains its original placeholder logic
  (static text, no persistence) and hasn't been reviewed/rebuilt yet — it was
  left untouched this round since it was marked done on your end, but it
  doesn't yet match the polish of Phases 4–9, 11, or 12. Only a single
  non-visual line was added to its "Save" button (a `localStorage` flag) so
  the LangGraph Orchestrator can detect that it's been used.

## Bug found & fixed this round (previously broken, now verified working)

**Sidebar navigation was silently broken on every page load.** In
`dashboard.js`, `sidebar` was read (inside `closeMobileSidebar`/
`openMobileSidebar` and an `if` check) before it was declared further down
the same `DOMContentLoaded` callback. That's a temporal-dead-zone error in
JavaScript, and it threw immediately on load — which meant every line after
it in that callback never ran, including the code that attaches click
listeners to the sidebar menu items and exposes `window.activateSection`.
In practice: **clicking any sidebar item did nothing at all.** Fixed by
declaring `sidebar` once, at the top of the callback, before its first use.

Verified after the fix, using a headless browser:
- No console errors on page load.
- Real clicks on all 11 sidebar items (Home, Resume Analyzer, Skill Gap,
  Learning Planner, Project Architect, Mock Interview, Internship
  Recommendation, LangGraph Workflow, Memory, AI Mentor, Settings) correctly
  activate their section.
- Skill Gap, Learning Planner, Project Architect, Memory, and AI Mentor
  primary actions all run without errors.
- AI Mentor and LangGraph Workflow's live cross-agent data, report
  generation, saving, and file download all work end-to-end.

**Broken post-login/signup redirect.** `auth.js` (which lives in `auth/`)
redirected to `"dashboard/dashboard.html"` — a relative path that resolves
to the non-existent `auth/dashboard/dashboard.html` and would 404 on both
login and signup. Fixed to `"../dashboard/dashboard.html"` on both. Verified
by resolving both paths against the real page URL — the old path 404s, the
new one resolves to the actual dashboard file.

**Duplicate alert on "Start Interview".** A leftover placeholder handler
selected the interview section's first `.primary-btn` generically and
attached its own `alert("Mock Interview backend will start here.")` — this
fired *in addition to* Phase 9's real interview flow on the same button,
since it happened to be the same element. Removed; Phase 9's actual handler
(`#startInterview`) is unaffected.

## Landing page ↔ Dashboard, verified end-to-end

- **Login** (`index.html` → "Login" → `auth/login.html`) and **Sign Up**
  (`index.html` → "Get Started"/"Explore Dashboard" CTAs → `auth/signup.html`)
  both navigate correctly.
- **Sign up / Login → Dashboard**: on a successful API response, both forms
  store `{ name, email }` in `localStorage` and redirect to
  `dashboard/dashboard.html`, which reads that record to show the real name
  and initials in the header. (Note: `auth.js` calls a real
  `/api/auth/login` / `/api/auth/signup` endpoint rather than a mock —
  wire up your backend for this part to complete end-to-end; every other
  agent's mock fallback is unaffected.)
- **"Explore Dashboard" preview CTA**: the landing page's Dashboard Preview
  section links straight to `dashboard/dashboard.html` for a no-login demo
  view — unchanged, works as before.
- **Dashboard → Logout**: clears the stored session and returns to
  `../index.html` — verified working.
