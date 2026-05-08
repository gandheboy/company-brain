# Company Brain 🧠

> The memory layer for AI-powered companies

## What is this?
Company Brain extracts your company's scattered 
knowledge from Slack, Notion, and GitHub — 
and turns it into executable memory that 
your team and AI agents can actually use.

## The Problem
Every company's knowledge is buried in:
- Slack threads nobody can find
- Notion docs nobody remembers
- People's heads who might leave tomorrow

AI agents fail because they don't know 
how YOUR company works.

## The Solution
Company Brain reads everything. 
Organizes it. Makes it queryable.
Exports it as a skills file agents can use.

## Tech Stack
- **Frontend**: Next.js 14 + Tailwind CSS (Vercel)
- **Backend**: FastAPI Python (Railway)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Claude API (Anthropic)

## Development Setup

### Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

### Frontend
cd frontend
npm install
npm run dev

## Status
🚧 Currently in development