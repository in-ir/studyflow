# StudyFlow

**A study planner for University of Ottawa students — built as a friendlier alternative to Brightspace.**

### ▶ [Try the live demo](https://studyflow-beta-nine.vercel.app)

No signup needed. Click **Continue as guest** and you land in a working account
that is already enrolled in a few courses, so you can look around straight away.

> The API is hosted on a free tier that sleeps when idle. If the first page sits
> loading for up to a minute, it is waking up — it is quick after that.

## What it is

Course registration tells you what you are taking. It does not help you actually
get through the term. StudyFlow is the layer on top: the place where your courses,
your deadlines, your timetable and your questions live together.

Sign in and you can:

- **Find your courses.** Search the real uOttawa catalog — 4,302 courses across
  25 subjects, scraped from the course listings — and enrol in the ones you are taking.
- **See your week.** Add lecture, lab and tutorial times to a calendar that
  flags conflicts before you commit to a schedule that cannot work.
- **Stay on top of the work.** Track assignments with due dates, priorities and
  status, so what is urgent is obvious at a glance.
- **Ask for help.** A built-in assistant, powered by Claude, answers questions
  about your courses and reads course outlines you upload as PDF, DOCX or TXT.

It is a personal project, not affiliated with the University of Ottawa.

## Tech Stack

**Frontend** (`frontend/`)

- Next.js 15.5 (App Router, Turbopack)
- React 19
- TypeScript 5
- Tailwind CSS 4

**Backend** (`backend/`)

- FastAPI (Python 3.10+)
- Uvicorn
- PyJWT + bcrypt for authentication
- pypdf / python-docx for document parsing
- requests + BeautifulSoup for the course scraper

**APIs**

- Claude API (Anthropic)

## Project Structure

```
studyflow/
├── frontend/          # Next.js app — package.json lives here, not at the root
│   ├── src/app/
│   └── .env.example
└── backend/           # FastAPI app
    ├── main.py
    ├── fast_scraper.py
    ├── requirements.txt
    └── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18.18+ (Next.js 15 requirement)
- Python 3.10+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/in-ir/studyflow.git
cd studyflow
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then fill in the values
```

Run it:

```bash
python3 -m uvicorn main:app --reload --port 8000
```

The API is now at http://localhost:8000 (interactive docs at http://localhost:8000/docs).

### 3. Frontend

In a second terminal — note that `package.json` is in `frontend/`, not the repository root:

```bash
cd frontend
npm install
cp .env.example .env.local        # optional; defaults to http://localhost:8000
npm run dev
```

The app is now at http://localhost:3000.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | No | — | Claude API key for the AI assistant. Without it the backend still runs, but the assistant returns canned fallback replies. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). |
| `JWT_SECRET_KEY` | **Yes in production** | insecure placeholder | Signing key for JWT access tokens. Generate with `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`. If left unset the server logs a warning in development and **refuses to start** when `ENVIRONMENT=production`. |
| `FRONTEND_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of browser origins allowed by CORS, e.g. `https://studyflow.vercel.app,https://www.studyflow.app`. Include the scheme, omit trailing slashes. |
| `ENVIRONMENT` | No | `development` | Set to `production` on deployed instances to turn the weak-secret warning into a hard startup failure. |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000` | Base URL of the FastAPI backend, no trailing slash. The `NEXT_PUBLIC_` prefix means it is inlined into the browser bundle **at build time**, so it must be set in your host's build environment — not just at runtime. |

## Deployment

The frontend and backend deploy separately.

### Frontend → Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend` — this is essential, since `package.json` is not at the repository root.
3. Framework preset: Next.js (build command `npm run build` and output are detected automatically).
4. Add an environment variable `NEXT_PUBLIC_API_URL` pointing at your deployed backend, e.g. `https://studyflow-api.onrender.com`.
5. Deploy. Because `NEXT_PUBLIC_*` values are baked in at build time, changing this variable later requires a redeploy.

### Backend → Render

The repository includes [`render.yaml`](render.yaml), so the quickest path is
**New → Blueprint → select this repo**: Render reads the build command, start
command, health check and Python version from it, and generates a strong
`JWT_SECRET_KEY` for you. You still set `FRONTEND_ORIGINS` and
`ANTHROPIC_API_KEY` in the dashboard, since those are not stored in the repo.

To configure it by hand instead:

1. Create a new **Web Service** from the repository.
2. **Root Directory:** `backend`
3. **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command:** — Render supplies the port via `$PORT`:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. **Environment variables:**
   - `ANTHROPIC_API_KEY` — your Claude API key
   - `JWT_SECRET_KEY` — a freshly generated random string (never reuse the development one)
   - `FRONTEND_ORIGINS` — your Vercel URL, e.g. `https://studyflow.vercel.app`
   - `ENVIRONMENT` — `production`
6. Deploy, then set `NEXT_PUBLIC_API_URL` on Vercel to the resulting Render URL and redeploy the frontend.

### Guest mode

Because accounts do not survive a restart (see below), the login screen offers
**Continue as guest**. Each click calls `POST /auth/guest`, which mints a
throwaway account pre-enrolled in a few courses and returns a normal JWT, so a
visitor sees a populated app immediately without signing up.

Guests exist in memory only and are never written to disk: every visitor gets an
isolated sandbox, and they cost nothing to clean up. The account has no password
hash, so it cannot be reached through `/auth/login`.

## License

MIT License — see [LICENSE](LICENSE) for details.
