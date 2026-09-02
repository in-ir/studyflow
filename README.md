# StudyFlow

A modern learning management system built as an alternative to Brightspace for University of Ottawa students. Features course management, AI-powered study assistance, and interactive scheduling.

**Live demo:** _not yet deployed — see [Deployment](#deployment)_

## Features

- **Course Management** — Integrated with 4,302 real courses across 25 subjects, scraped from the uOttawa catalog
- **AI Study Assistant** — Claude-powered assistant supporting PDF, TXT, and DOCX file uploads
- **Smart Scheduling** — Interactive calendar with automatic conflict detection and time slot management
- **Assignment Tracking** — Priority levels, status updates, and deadline management
- **Secure Authentication** — JWT-based auth with bcrypt password hashing and protected API routes
- **Guest Mode** — one click to explore the full app with a pre-enrolled sandbox account, no signup required

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
