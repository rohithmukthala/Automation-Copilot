# Automation Copilot

> **Turn plain English into ready-to-import n8n workflow JSON — instantly.**

---

## Highlights

- **Natural language → automation** — type *"Send a WhatsApp when a Typeform is filled"* and get a complete, valid n8n workflow
- **LLM structured output** — GPT-4o + LangChain function calling guarantees schema-valid JSON every time, no regex hacks
- **Split-screen developer UI** — prompt editor on the left, syntax-highlighted JSON viewer on the right
- **One-click export** — copy to clipboard or download the `.json` file directly into n8n's import dialog
- **Production-grade backend** — FastAPI with Pydantic v2, auto-retry on LLM failure, structured logging, and a pytest suite
- **Preset templates** — five ready-made starters covering CRM, email, Slack, WhatsApp, and scheduled reports

---



## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Running Tests](#running-tests)
9. [Project Structure](#project-structure)
10. [Skills Demonstrated](#skills-demonstrated)

---

## Overview

Automation Copilot bridges the gap between a business idea and a working automation. Most no-code platforms require users to drag, drop, and configure dozens of nodes before anything runs. This project removes that friction entirely.

You describe what you want in plain English. The backend feeds your description to GPT-4o using LangChain's structured-output (function-calling) mode, which forces the model to return a Pydantic-validated `N8nWorkflow` object — not a raw string that could silently break on import. The frontend renders the result instantly in a dark-themed code viewer and lets you export the file directly into n8n with a single click.

---

## Features

- **Plain-English input** — accepts any natural-language automation description
- **LLM structured output** — LangChain `with_structured_output` + Pydantic v2 schemas guarantee a valid n8n node graph
- **Auto-retry** — if the LLM returns an invalid response, the service retries once before surfacing a clean user-facing error
- **Preset templates** — one-click starters: Lead to CRM, Webhook to Email, WhatsApp Alert, Slack Notification, Daily Report
- **Split-screen UI** — left panel for input, right panel for syntax-highlighted JSON output
- **Copy & Download** — copy JSON to clipboard or download as a `.json` file ready for n8n import
- **Toast notifications** — success and error feedback with 4-second auto-dismiss
- **Loading skeleton** — animated placeholder while the LLM generates
- **Keyboard shortcut** — `Ctrl+Enter` to generate from the textarea
- **Health endpoint** — `GET /health` for uptime monitoring and container readiness probes
- **CORS-aware** — configurable allowed origins via environment variable
- **Pytest suite** — covers the happy path, empty prompt, missing body, and LLM failure scenarios

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────┐        ┌────────────────────────┐   │
│  │  Left Panel        │        │  Right Panel           │   │
│  │  • Textarea        │───────▶│  • SyntaxHighlighter   │   │
│  │  • Preset buttons  │        │  • Copy / Download     │   │
│  └────────────────────┘        └────────────────────────┘   │
│              │  POST /api/copilot/generate                   │
└──────────────┼──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  routes.py  ──▶  copilot_service.py                         │
│                        │                                     │
│                        ├─ ChatPromptTemplate (system prompt) │
│                        ├─ ChatOpenAI (gpt-4o, temp=0)        │
│                        └─ .with_structured_output(N8nWorkflow│
│                                │                             │
│                        Pydantic v2 validation                │
│                                │                             │
│                        N8nWorkflow JSON  ◀────────────────┐  │
│                                                           │  │
│                        (retry once on failure) ───────────┘  │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
      n8n  →  Import from file  →  paste / upload JSON
```

**Data flow:**

1. User types a prompt (or clicks a preset) and presses **Generate Workflow**
2. Next.js frontend `POST`s `{ prompt }` to `FastAPI /api/copilot/generate`
3. FastAPI validates the body with Pydantic, calls `generate_workflow()`
4. LangChain builds a prompt chain → calls GPT-4o with function-calling to force structured output → returns a validated `N8nWorkflow` Pydantic object
5. FastAPI serialises the model and returns JSON
6. Frontend renders the JSON with syntax highlighting; user copies or downloads for import

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend language** | Python 3.11+ |
| **API framework** | FastAPI |
| **Data validation** | Pydantic v2 |
| **LLM orchestration** | LangChain Core + LangChain OpenAI |
| **LLM / AI model** | OpenAI GPT-4o (configurable via env) |
| **Structured output** | LangChain `with_structured_output` + function calling |
| **Frontend framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Syntax highlighting** | react-syntax-highlighter (atom-one-dark) |
| **HTTP client** | Native `fetch` API (TypeScript typed) |
| **Testing** | pytest + FastAPI TestClient + `unittest.mock` |
| **Environment config** | python-dotenv |
| **Target platform** | n8n (workflow automation) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key

### 1 — Clone the repo

```bash
git clone https://github.com/<your-username>/automation-copilot.git
cd automation-copilot
```

### 2 — Backend setup

```bash
# Create and activate a virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn langchain langchain-openai pydantic python-dotenv pytest httpx
```

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o          # optional — defaults to gpt-4o
CORS_ORIGINS=http://localhost:3000
```

Start the backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

### 3 — Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** — it auto-redirects to `/copilot`.

---

## Usage Examples

### Via the UI

1. Open **http://localhost:3000**
2. Type a description in the left panel, for example:

   > "When a new row is added to a Google Sheet, send a WhatsApp message via Twilio with the row data."

3. Click **Generate Workflow** (or press `Ctrl + Enter`)
4. Review the syntax-highlighted JSON in the right panel
5. Click **Copy** or **Download JSON**
6. In n8n: **Import from file** → select the downloaded `.json`

### Via cURL

```bash
curl -X POST http://localhost:8000/api/copilot/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "When a GitHub issue is opened, post a Slack message to #alerts"}'
```

**Response:**

```json
{
  "workflow": {
    "name": "GitHub Issue to Slack Alert",
    "nodes": [
      {
        "id": "node_1",
        "name": "GitHub Trigger",
        "type": "n8n-nodes-base.githubTrigger",
        "typeVersion": 1,
        "position": [250, 300],
        "parameters": {
          "owner": "your-org",
          "repository": "your-repo",
          "events": ["issues"]
        }
      },
      {
        "id": "node_2",
        "name": "Post Slack Message",
        "type": "n8n-nodes-base.slack",
        "typeVersion": 1,
        "position": [500, 300],
        "parameters": {
          "channel": "#alerts",
          "text": "New issue: {{$json.title}}"
        }
      }
    ],
    "connections": {
      "GitHub Trigger": {
        "main": [[{ "node": "Post Slack Message", "type": "main", "index": 0 }]]
      }
    },
    "active": false,
    "settings": {}
  }
}
```

---

## API Reference

### `POST /api/copilot/generate`

Generate an n8n workflow from a plain-English prompt.

**Request body:**

```json
{ "prompt": "string" }
```

**Response `200`:**

```json
{
  "workflow": {
    "name": "string",
    "nodes": [ { "id": "...", "name": "...", "type": "...", "typeVersion": 1, "position": [x, y], "parameters": {} } ],
    "connections": { "NodeName": { "main": [[{ "node": "...", "type": "main", "index": 0 }]] } },
    "active": false,
    "settings": {}
  }
}
```

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Prompt is blank or whitespace-only |
| `422` | Request body is missing the `prompt` field |
| `500` | LLM failed to produce a valid workflow after 2 attempts |

---

### `GET /health`

Liveness check. Returns `{"status": "ok"}` with HTTP 200.

---

## Running Tests

```bash
# From the project root (with .venv activated)
pytest backend/tests/ -v
```

| Test | What it verifies |
|---|---|
| `test_generate_success` | Happy path — mocked LLM returns a workflow, API responds 200 with correct body |
| `test_generate_empty_prompt` | Blank/whitespace prompt returns HTTP 400 |
| `test_generate_missing_prompt` | Missing body field returns HTTP 422 |
| `test_generate_llm_failure` | LLM exception propagates as HTTP 500 with a human-readable message |
| `test_health` | Health endpoint returns `{"status": "ok"}` |

---

## Project Structure

```
automation-copilot/
├── .env                          # API keys — never committed
├── README.md
├── backend/
│   ├── main.py                   # FastAPI app entry point, CORS, logging
│   ├── api/
│   │   └── routes.py             # POST /api/copilot/generate
│   ├── models/
│   │   └── schemas.py            # Pydantic v2: N8nNode, N8nWorkflow, Request/Response
│   ├── services/
│   │   └── copilot_service.py    # LangChain chain: prompt → GPT-4o → structured output
│   └── tests/
│       └── test_copilot.py       # pytest suite (5 test cases)
└── frontend/
    ├── app/
    │   ├── page.tsx              # Root redirect → /copilot
    │   ├── layout.tsx            # App layout with metadata
    │   └── copilot/
    │       └── page.tsx          # Split-screen Copilot UI (500 lines, all client-side)
    └── lib/
        └── api.ts                # Typed fetch wrapper mirroring Pydantic schemas
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | Your OpenAI API key |
| `OPENAI_MODEL` | ❌ | `gpt-4o` | OpenAI model to use |
| `CORS_ORIGINS` | ❌ | `http://localhost:3000` | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | ❌ | `http://localhost:8000` | Backend URL consumed by the Next.js app |

---

## Skills Demonstrated

This project was built end-to-end as a portfolio piece showcasing the skills most valued in AI product engineering roles.

| Skill | Where it appears |
|---|---|
| **LLM structured output / function calling** | `copilot_service.py` — GPT-4o forced to return Pydantic-validated JSON via LangChain |
| **FastAPI production patterns** | Router separation, dependency injection, CORS middleware, typed responses, health endpoint |
| **Pydantic v2 schema design** | `schemas.py` — `N8nNode`, `N8nWorkflow`, request/response models with `Field` descriptions |
| **LangChain orchestration** | `ChatPromptTemplate` + `ChatOpenAI` + `with_structured_output` composable chain |
| **Error resilience** | Auto-retry logic with clean HTTP error propagation to the frontend toast system |
| **Next.js App Router** | `app/copilot/page.tsx` with `"use client"`, redirect at root, metadata in layout |
| **React state management** | `useState` + `useCallback` — loading, toast, copy-feedback, workflow states |
| **Tailwind CSS** | Dark-mode split-screen layout, responsive spacing, hover/focus transitions, animated skeleton |
| **TypeScript API layer** | Typed `fetch` wrapper with `N8nNode`, `N8nWorkflow`, `GenerateResponse` interfaces |
| **Testing discipline** | pytest with `AsyncMock`, `TestClient`, positive and negative edge-case coverage |
| **Structured logging** | `logging` throughout the backend with context: prompt snippet, attempt number |
| **Environment config** | `python-dotenv` + env-based config, zero hardcoded secrets |

---

> Built with FastAPI · LangChain · GPT-4o · Next.js · Tailwind CSS · n8n
