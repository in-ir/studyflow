# StudyFlow

A modern learning management system built as an alternative to Brightspace for University of Ottawa students. Features course management, AI-powered study assistance, and interactive scheduling.

## Features

- **Course Management** — Integrated with 4,302+ real courses scraped from the uOttawa catalog
- **AI Study Assistant** — Claude-powered assistant supporting PDF, TXT, and DOCX file uploads
- **Smart Scheduling** — Interactive calendar with automatic conflict detection and time slot management
- **Assignment Tracking** — Priority levels, status updates, and deadline management
- **Secure Authentication** — JWT-based auth with bcrypt password hashing and protected API routes

## Tech Stack

**Frontend**

- Next.js 14
- TypeScript
- TailwindCSS

**Backend**

- FastAPI (Python)
- JWT Authentication
- bcrypt

**APIs**

- Claude API (Anthropic)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/YOUR-USERNAME/studyflow.git
   cd studyflow
   ```

2. Install frontend dependencies

   ```bash
   npm install
   ```

3. Set up the backend

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. Create a `.env` file and add your environment variables

   ```
   ANTHROPIC_API_KEY=your_api_key_here
   JWT_SECRET=your_secret_here
   ```

5. Run the development servers

   **Frontend** (from root directory):

   ```bash
   npm run dev
   ```

   **Backend** (from backend directory):

   ```bash
   source venv/bin/activate
   python3 -m uvicorn main:app --reload --port 8000
   ```

## License

MIT License - see [LICENSE](LICENSE) for details
