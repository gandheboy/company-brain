# 🧠 Company Brain

> **The memory layer for AI-powered companies**

Company Brain reads your Slack messages and Notion pages, extracts all the procedures and policies buried inside them, and turns that scattered knowledge into a searchable memory — one your whole team and your AI agents can actually use.

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Who Is This For?](#who-is-this-for)
3. [What Can It Do?](#what-can-it-do)
4. [How It Works](#how-it-works)
5. [Before You Start](#before-you-start)
6. [Step-by-Step Setup](#step-by-step-setup)
   - [Step 1 — Get the Code](#step-1--get-the-code)
   - [Step 2 — Set Up the Database](#step-2--set-up-the-database)
   - [Step 3 — Set Up the AI Model](#step-3--set-up-the-ai-model)
   - [Step 4 — Set Up the Backend](#step-4--set-up-the-backend)
   - [Step 5 — Set Up the Frontend](#step-5--set-up-the-frontend)
   - [Step 6 — Connect Slack](#step-6--connect-slack)
   - [Step 7 — Connect Notion](#step-7--connect-notion)
7. [Running the App Every Day](#running-the-app-every-day)
8. [Checking Everything Works](#checking-everything-works)
9. [Using the Product](#using-the-product)
10. [Project Structure](#project-structure)
11. [Troubleshooting](#troubleshooting)
12. [Environment Variables Reference](#environment-variables-reference)
13. [Tech Stack](#tech-stack)
14. [Contributing](#contributing)

---

## What Is This?

Every company stores its knowledge in the wrong places.

Your refund policy is in a Slack thread from eight months ago. Your deployment process is in a Notion page nobody updates. Your onboarding checklist lives inside one person's head. When that person leaves, the knowledge is gone.

**Company Brain fixes this.**

It connects to your Slack and Notion, reads everything, and pulls out the real knowledge — the procedures, policies, and decisions that make your company run. It stores all of it in one searchable place. Then, when someone asks *"how do we handle a refund?"* or *"who approves exceptions?"*, they get an instant, accurate answer with a source citation.

And for companies using AI agents: those agents can now read a **skills file** — a clean JSON document that tells them exactly how your company works, step by step, with every exception and escalation path included. No more agents guessing or making wrong decisions because they had no context.

---

## Who Is This For?

| You are... | Company Brain helps you... |
|---|---|
| A founder or CTO | Stop answering the same questions repeatedly |
| A growing team (15–200 people) | Onboard new hires in days, not months |
| A company deploying AI agents | Give agents the company context they need to work correctly |
| Anyone using Slack + Notion | Turn scattered conversations into structured knowledge |

---

## What Can It Do?

| Feature | What It Does |
|---|---|
| 🔌 **Slack Integration** | Reads your channels and threads, finds high-value messages |
| 📋 **Notion Integration** | Reads your pages and wikis, extracts documented procedures |
| 🧠 **Knowledge Extraction** | AI reads raw content and outputs structured knowledge nodes |
| 💬 **Ask Anything** | Type a question in plain English, get an answer with sources |
| ⚡ **Skills File Generator** | Exports all procedures as a JSON file for AI agents |
| ⚠️ **Conflict Detection** | Finds two pieces of knowledge that contradict each other |
| 🔍 **Knowledge Explorer** | Browse, search, verify, and delete individual knowledge nodes |
| 👍 **Feedback System** | Rate answers to make the brain smarter over time |
| 📊 **Confidence Scoring** | Every answer shows a confidence percentage and source |

---

## How It Works

```
Your Slack + Notion
        ↓
Company Brain reads everything
        ↓
AI extracts procedures, policies, decisions
        ↓
Stored as searchable knowledge nodes
        ↓
Your team asks questions → instant answers
Your AI agents read the skills file → correct actions
```

The entire process runs on your machine using a free local AI model (Ollama). Your company data never leaves your computer or your own database.

---

## Before You Start

You need to install four tools before anything else. If you already have them, skip ahead.

### Required Tools

| Tool | What It Is | Download Link | How to Check |
|---|---|---|---|
| **Node.js** | Runs the frontend | [nodejs.org](https://nodejs.org) — download the LTS version | Open terminal, type `node --version` |
| **Python 3.11+** | Runs the backend | [python.org/downloads](https://python.org/downloads) | Open terminal, type `python --version` |
| **Git** | Downloads the code | [git-scm.com](https://git-scm.com) | Open terminal, type `git --version` |
| **Ollama** | Runs the AI locally | [ollama.com](https://ollama.com) — click Download | Open terminal, type `ollama --version` |

> **Not sure how to open a terminal?**
> - On **Windows**: Press the Windows key, type `cmd`, press Enter
> - On **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter

Once all four tools are installed and their version commands work, continue below.

---

## Step-by-Step Setup

> ⏱️ **Total setup time: approximately 30–45 minutes**
> Work through each step in order. Do not skip steps.

---

### Step 1 — Get the Code

Open your terminal and run these commands one at a time:

```bash
git clone https://github.com/gandheboy/company-brain.git
cd company-brain
```

This downloads the project to your computer and moves you inside it.

---

### Step 2 — Set Up the Database

Company Brain uses **Supabase** as its database — it is free for the amount of data you will use.

**Create your Supabase project:**

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click **New Project**
3. Fill in:
   - **Name:** `company-brain`
   - **Database Password:** make up a strong password and save it somewhere — you will need it later
   - **Region:** pick the one closest to your location
4. Click **Create new project** and wait 1–2 minutes for it to finish

**Copy your API credentials:**

1. In your Supabase project, click **Project Settings** (the gear icon in the left sidebar)
2. Click the **API** tab
3. You will see two values — copy both and save them somewhere:
   - **Project URL** — looks like `https://xxxxxxxxxxx.supabase.co`
   - **anon / public key** — a long string starting with `eyJ`

**Enable the vector extension:**

1. Click **Database** in the left sidebar
2. Click **Extensions**
3. Search for `vector`
4. Click the toggle to turn it **ON**

**Create the database tables:**

1. Click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `database/schema.sql` from the project folder you downloaded
4. Copy everything inside that file and paste it into the SQL Editor
5. Click **Run** (or press `Ctrl + Enter`)
6. You should see **Success. No rows returned.**

Your database is ready.

---

### Step 3 — Set Up the AI Model

Company Brain uses **Ollama** to run AI entirely on your computer — no API costs, no internet required for AI calls.

**Download the AI model:**

Open your terminal and run:

```bash
ollama pull llama3.2
```

This downloads a 2 GB AI model. It only happens once. Wait for it to finish completely — you will see a progress bar.

**Verify it works:**

```bash
ollama run llama3.2 "Say hello"
```

You should get a response like `Hello! How can I help you?`

Press `Ctrl + C` to exit.

**On Windows**, Ollama starts automatically in the background. You can verify it is running by opening your browser and going to:
```
http://localhost:11434
```
You should see: `Ollama is running`

---

### Step 4 — Set Up the Backend

The backend is the Python server that handles all the AI processing and database operations.

**Open a terminal and navigate to the backend folder:**

```bash
cd company-brain/backend
```

> **Windows users:** if you cloned to your desktop, the path might look like:
> ```
> cd C:\Users\YourName\Desktop\company-brain\backend
> ```

**Create a Python virtual environment:**

This keeps the project's Python packages separate from everything else on your computer.

```bash
# Windows
python -m venv venv

# Mac / Linux
python3 -m venv venv
```

**Activate the virtual environment:**

```bash
# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

You should now see `(venv)` at the start of your terminal line. This means it worked.

**Install the required packages:**

```bash
# Windows — use this exact command
D:\path\to\company-brain\backend\venv\Scripts\python.exe -m pip install -r requirements.txt

# Mac / Linux
pip install -r requirements.txt
```

> **Windows note:** replace `D:\path\to\company-brain` with the actual path where you cloned the repo. If you are not sure, type `cd` in your terminal and press Enter — it shows your current path.

**Create the backend environment file:**

In the `backend` folder, create a new file called `.env` (the dot at the front is important).

> On Windows: right-click inside the backend folder → New → Text Document → rename it to `.env` (make sure it does not say `.env.txt`)

Open the `.env` file and paste this — then replace the placeholder values with your real ones:

```
SUPABASE_URL=paste_your_supabase_project_url_here
SUPABASE_KEY=paste_your_supabase_anon_key_here
ANTHROPIC_API_KEY=placeholder
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
APP_ENV=development
FRONTEND_URL=http://localhost:3000
SLACK_CLIENT_ID=fill_in_later
SLACK_CLIENT_SECRET=fill_in_later
SLACK_REDIRECT_URI=http://localhost:8000/api/integrations/slack/callback
NOTION_API_KEY=fill_in_later
```

Replace `paste_your_supabase_project_url_here` and `paste_your_supabase_anon_key_here` with the two values you copied in Step 2. Leave everything else as-is for now.

**Start the backend server:**

```bash
# Windows
D:\path\to\company-brain\backend\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Mac / Linux
python -m uvicorn app.main:app --reload --port 8000
```

Open your browser and go to `http://localhost:8000/health`

You should see:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

If it says `"database": "connected"` — the backend is working. Leave this terminal open and running.

---

### Step 5 — Set Up the Frontend

The frontend is the website you see and click through.

**Open a NEW terminal** (keep the backend terminal running) and navigate to the frontend folder:

```bash
cd company-brain/frontend
```

**Install the required packages:**

```bash
npm install
```

This may take 1–2 minutes.

**Create the frontend environment file:**

In the `frontend` folder, create a new file called `.env.local`

Open it and paste this — replacing the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=paste_your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_supabase_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Use the same Supabase URL and anon key from Step 2.

**Start the frontend:**

```bash
npm run dev
```

Open your browser and go to `http://localhost:3000`

You should see the Company Brain landing page. Leave this terminal open and running.

---

### Step 6 — Connect Slack

This step lets Company Brain read your Slack workspace. If you do not use Slack, skip to Step 7.

**Create a Slack app:**

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App**
3. Choose **From scratch**
4. Fill in:
   - **App Name:** `Company Brain`
   - **Pick a workspace:** select your Slack workspace
5. Click **Create App**

**Set the redirect URL:**

1. In the left sidebar, click **OAuth & Permissions**
2. Scroll down to **Redirect URLs**
3. Click **Add New Redirect URL**
4. Type exactly: `http://localhost:8000/api/integrations/slack/callback`
5. Click **Save URLs**

**Add permissions:**

Still on the **OAuth & Permissions** page, scroll down to **Scopes** → **Bot Token Scopes**

Click **Add an OAuth Scope** and add each of these one at a time:
- `channels:history`
- `channels:read`
- `users:read`
- `team:read`
- `channels:join`

**Copy your credentials:**

1. Click **Basic Information** in the left sidebar
2. Scroll to **App Credentials**
3. Copy **Client ID** and **Client Secret**

**Add to your backend `.env` file:**

Open `backend/.env` and replace:
```
SLACK_CLIENT_ID=paste_your_slack_client_id_here
SLACK_CLIENT_SECRET=paste_your_slack_client_secret_here
```

**Restart your backend server** (press `Ctrl + C` in the backend terminal, then run the start command again)

---

### Step 7 — Connect Notion

This step lets Company Brain read your Notion pages. If you do not use Notion, skip this step.

**Create a Notion integration:**

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Click **New integration**
3. Fill in:
   - **Name:** `Company Brain`
   - **Associated workspace:** your workspace
   - **Type:** Internal
4. Click **Submit**
5. Copy the **Internal Integration Secret** — it starts with `secret_`

**Add to your backend `.env` file:**

Open `backend/.env` and replace:
```
NOTION_API_KEY=paste_your_notion_secret_here
```

**Give the integration access to your pages:**

In Notion, open any page you want Company Brain to read:
1. Click the **···** menu at the top right of the page
2. Click **Connect to**
3. Find **Company Brain** and click it

Repeat for any other pages you want to include.

**Restart your backend server.**

---

## Running the App Every Day

Every time you want to use Company Brain, you need to start two servers. Open **two separate terminals**.

**Terminal 1 — Start the backend:**

```bash
# Navigate to backend folder
cd path/to/company-brain/backend

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (Mac/Linux)
source venv/bin/activate

# Start the server (Windows)
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Start the server (Mac/Linux)
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Start the frontend:**

```bash
# Navigate to frontend folder
cd path/to/company-brain/frontend

# Start the app
npm run dev
```

**Make sure Ollama is running:**

On Windows, Ollama runs automatically in the background. Verify at `http://localhost:11434`

On Mac/Linux, if it is not running:
```bash
ollama serve
```

**Then open your browser and go to:** `http://localhost:3000`

---

## Checking Everything Works

After starting both servers, open these URLs in your browser and verify each one:

| URL | What You Should See |
|---|---|
| `http://localhost:3000` | Company Brain landing page |
| `http://localhost:8000` | `{"message": "Company Brain API is running"}` |
| `http://localhost:8000/health` | `{"status": "healthy", "database": "connected"}` |
| `http://localhost:8000/docs` | A list of all API routes (Swagger UI) |
| `http://localhost:11434` | `Ollama is running` |

If all five show the expected result — everything is working perfectly.

---

## Using the Product

Once the app is running, here is how to use every feature:

### Sign Up

1. Go to `http://localhost:3000`
2. Click **Get Started Free**
3. Enter your company name, email, and password
4. Click **Create Account**
5. You will be taken through a 4-step onboarding wizard

### The Onboarding Wizard

**Step 1 — Company name:** confirm or change your company name

**Step 2 — Connect tools:** click **Connect** next to Slack or Notion — you will be redirected to approve access, then brought back automatically

**Step 3 — Extract knowledge:** click **Extract Knowledge** — the brain reads your connected tools and finds all the procedures and policies inside them (takes 30–90 seconds)

**Step 4 — Ask a question:** try asking something like *"How do we handle refunds?"* to see your brain answer from real company data

Click **Go to Dashboard** when done.

### Ask Your Brain

Click **💬 Ask Brain** in the sidebar.

Type any question about how your company works:
- *"How do we handle a customer complaint?"*
- *"Who approves pricing exceptions?"*
- *"What is our deployment process?"*
- *"How many PR approvals do we need?"*

The brain searches your knowledge base and returns an answer with:
- The answer itself in plain English
- A confidence percentage (higher = more certain)
- The source nodes it used to answer

After reading the answer, click 👍 if it was helpful or 👎 if it was not. This feedback improves the brain over time.

### Knowledge Explorer

Click **🧠 Knowledge** in the sidebar.

This shows every knowledge node the brain has extracted. You can:
- **Search** by typing keywords in the search box
- **Filter** by type: policy, procedure, decision, or context
- **Click any node** to see its full content
- **Click ✓ Verify** to mark a node as human-approved
- **Click 🗑 Delete** to remove a node that is wrong or irrelevant

### Skills File Generator

Click **⚡ Skills File** in the sidebar.

Click **Generate Skills File**. The brain will take all your knowledge nodes and compress them into a structured JSON file — one that an AI agent can read to understand exactly how to perform tasks at your company.

After generation, you can:
- **Click any skill** to expand and see the steps, conditions, and exceptions
- **Click ↓ Download JSON** to save the file and use it in your AI agent setup

### Conflict Detection

Click **⚠️ Conflicts** in the sidebar.

The brain automatically compares knowledge nodes that cover similar topics and flags any that contradict each other.

For each conflict shown:
- Read both versions side by side
- Click **✓ Keep This Version** on the one that is correct
- The other version is automatically marked as outdated and removed from answers

### Syncing New Content

When you add new messages to Slack or new pages to Notion, the brain does not update automatically — you trigger it manually.

From the dashboard, click:
- **🔄 Sync Slack** — reads any new Slack messages and extracts knowledge
- **📋 Sync Notion** — reads any updated Notion pages and extracts knowledge

---

## Project Structure

```
company-brain/
│
├── README.md                     This file
├── database/
│   └── schema.sql                All database tables and functions
│
├── backend/                      Python FastAPI server
│   ├── .env                      Your secret keys (never share this)
│   ├── .env.example              Template showing what .env needs
│   ├── requirements.txt          Python package list
│   └── app/
│       ├── main.py               Server entry point
│       ├── core/
│       │   ├── auth.py           Login token verification
│       │   └── database.py       Database connection
│       ├── api/routes/
│       │   ├── ai.py             AI extraction endpoints
│       │   ├── integrations.py   Slack and Notion connectors
│       │   ├── knowledge.py      Knowledge CRUD and search
│       │   ├── organizations.py  Company management
│       │   └── skills.py         Skills file generation
│       └── services/
│           ├── ai_service.py         Ollama AI calls
│           ├── embedding_service.py  Vector embedding
│           ├── knowledge_service.py  Knowledge storage logic
│           ├── slack_service.py      Slack reading pipeline
│           ├── notion_service.py     Notion reading pipeline
│           └── skills_service.py     Skills file builder
│
└── frontend/                     Next.js website
    ├── .env.local                Your public keys (never share this)
    ├── .env.local.example        Template showing what .env.local needs
    ├── app/
    │   ├── page.tsx              Landing page
    │   ├── auth/page.tsx         Login and signup
    │   ├── onboarding/page.tsx   Setup wizard
    │   └── dashboard/
    │       ├── page.tsx          Dashboard home
    │       ├── query/page.tsx    Ask questions
    │       ├── knowledge/page.tsx  Knowledge explorer
    │       ├── skills/page.tsx   Skills file generator
    │       └── conflicts/page.tsx  Conflict resolution
    ├── lib/
    │   ├── supabase.ts           Database client
    │   ├── api.ts                Backend request helper
    │   └── health.ts             Backend status checker
    └── components/
        └── ErrorBanner.tsx       Error and loading components
```

---

## Troubleshooting

### "ollama is not recognized" in the terminal

**Cause:** VS Code or your terminal does not know where Ollama is installed yet.

**Fix:**
1. Close VS Code completely (not just the terminal — the whole window)
2. Reopen VS Code
3. Open a new terminal and try again

---

### "ModuleNotFoundError: No module named ..." in Python

**Cause:** Packages were installed in the wrong Python environment.

**Fix (Windows):**
```bash
D:\path\to\company-brain\backend\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Always use the full path to the venv Python on Windows to make sure you are installing in the right place.

---

### "Not authenticated" when calling an API endpoint

**Cause:** Most endpoints require a login token. In development, use the `-test` versions of endpoints.

**Development test endpoints (no login required):**
```
POST /api/knowledge/query-test
POST /api/knowledge/extract-save-test
GET  /api/knowledge/conflicts-test
POST /api/integrations/slack/sync-test
POST /api/integrations/notion/sync-test
POST /api/skills/generate-test
```

---

### "database: error" on the health endpoint

**Cause:** Supabase credentials are wrong or missing.

**Fix:**
1. Open `backend/.env`
2. Check that `SUPABASE_URL` and `SUPABASE_KEY` have real values (not the placeholder text)
3. Make sure there are no spaces around the `=` sign
4. Restart the backend server

---

### Slack sync returns 0 messages

**Cause:** The Slack bot has not been invited into your channels yet.

**Fix:**
1. Open your Slack workspace
2. Go to the channel you want to read
3. Type `/invite @Company Brain` and press Enter
4. Try the sync again

Alternatively, in the Slack app settings, add the `channels:join` scope and reinstall the app to the workspace.

---

### Notion sync returns 0 pages

**Cause:** You have not shared your Notion pages with the integration.

**Fix:**
1. Open each Notion page you want to include
2. Click `···` at the top right
3. Click **Connect to** → **Company Brain**

---

### Port already in use

**Cause:** A previous server is still running in the background.

**Fix (Windows):**
```bash
# Find what is using port 8000
netstat -ano | findstr :8000

# Note the PID number at the end, then kill it
taskkill /PID 12345 /F
```

**Fix (Mac/Linux):**
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

### The frontend shows a white screen

**Cause:** Usually a JavaScript error or missing environment variable.

**Fix:**
1. Open your browser developer tools (`F12`)
2. Click the **Console** tab
3. Look for red error messages
4. Check that `frontend/.env.local` exists and has your Supabase values

---

## Environment Variables Reference

### `backend/.env`

| Variable | Where to Get It | Example |
|---|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API | `https://abc123.supabase.co` |
| `SUPABASE_KEY` | Supabase → Project Settings → API → anon key | `eyJhbGc...` |
| `ANTHROPIC_API_KEY` | Not needed — leave as `placeholder` | `placeholder` |
| `OLLAMA_URL` | Always this value | `http://localhost:11434` |
| `OLLAMA_MODEL` | Always this value | `llama3.2` |
| `APP_ENV` | Always this value in development | `development` |
| `FRONTEND_URL` | Always this value in development | `http://localhost:3000` |
| `SLACK_CLIENT_ID` | api.slack.com/apps → Basic Information | `12345.67890` |
| `SLACK_CLIENT_SECRET` | api.slack.com/apps → Basic Information | `abc123def456` |
| `SLACK_REDIRECT_URI` | Always this value in development | `http://localhost:8000/api/integrations/slack/callback` |
| `NOTION_API_KEY` | notion.so/my-integrations → your integration | `secret_abc123` |

### `frontend/.env.local`

| Variable | Where to Get It |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `SUPABASE_KEY` above |
| `NEXT_PUBLIC_API_URL` | Always `http://localhost:8000` in development |

> ⚠️ **Never commit `.env` or `.env.local` to GitHub.** These files contain secret keys. They are already listed in `.gitignore` so they will not be uploaded by accident.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 (React) | Fast, modern web framework |
| **Backend** | FastAPI (Python) | Fast API development, great for ML/AI |
| **Database** | Supabase (PostgreSQL) | Free tier, built-in auth, vector search |
| **Vector Search** | pgvector | Semantic similarity search inside Postgres |
| **AI Model** | Ollama + llama3.2 | Free, runs locally, no API costs |
| **Embeddings** | sentence-transformers | Converts text to vectors for search |
| **Auth** | Supabase Auth | Built-in, handles email verification |
| **Hosting (frontend)** | Vercel | Free tier, instant deploys |
| **Hosting (backend)** | Railway | Free tier, simple Python deploys |

**Total running cost: $0/month** until your first paying customer.

---

## Contributing

We welcome contributions. Here is how to get started:

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/company-brain.git
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test them locally
5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add: description of what you changed"
   ```
6. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub and describe what you changed and why

### Good First Contributions

- Adding a new integration (GitHub, Linear, Zendesk)
- Improving extraction quality for specific content types
- Adding tests for existing services
- Improving mobile responsiveness
- Writing documentation

---

## License

MIT License — you are free to use, modify, and distribute this project.

---

*Built by [@gandheboy](https://github.com/gandheboy)*

**🧠 Company Brain — The memory layer for AI-powered companies**