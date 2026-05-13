<task>
An AI Automation Copilot that converts natural language into n8n workflow JSON arrays, complete with a dedicated UI.
</task>

<context>
Building on our existing FastAPI/Next.js monorepo, we need a system where a user types "Send a WhatsApp when a Typeform is filled," and the system generates valid n8n node JSON.
</context>

<architecture_requirements>
1. Backend Schema & Logic:
   - Define Pydantic models for the expected internal schema (Trigger -> Steps -> Action).
   - Create `backend/services/copilot_service.py`. Use structured outputs (function calling) to force the LLM to return valid JSON representing an n8n workflow.
   - Expose `POST /api/copilot/generate`. It takes a plain English string and returns a JSON payload compatible with n8n's import format.

2. Frontend Interface:
   - Create a new Next.js page at `frontend/app/copilot/page.tsx`.
   - Build a split-screen UI: 
     - Left side: A prompt input box and a list of preset template buttons (e.g., "Lead to CRM", "Webhook to Email").
     - Right side: A code block component (using something like `react-syntax-highlighter` or a styled `<pre>` tag) displaying the generated n8n JSON.
   - Include a "Copy to Clipboard" button and a "Download JSON" button so the user can easily import it into their n8n instance.
</architecture_requirements>

<execution_steps>
1. Build the backend Pydantic schemas and LangChain structured output prompt.
2. Implement the FastAPI endpoint.
3. Build the Next.js split-screen UI. 
4. Add error handling: If the LLM fails to generate valid JSON, the API must catch it, retry once, and if it fails, send a clean error to the frontend to display a red error toast.
</execution_steps>

<output>
Analyze the current repo state, output your plan, and execute.
</output>


Quick Start (3 terminals)
Terminal 1: Backend

cd "c:\Users\rohit\OneDrive\Desktop\Projects\Automation Copilot"
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
uvicorn backend.main:app --port 8000
Terminal 2: Frontend

cd "c:\Users\rohit\OneDrive\Desktop\Projects\Automation Copilot\frontend"
npm install
npm run dev
Terminal 3: Tests (optional)

cd "c:\Users\rohit\OneDrive\Desktop\Projects\Automation Copilot"
pytest backend/tests/ -v
Access the App
Open your browser → http://localhost:3000/copilot

How to Use
Pick a preset template on the left (e.g., "Lead to CRM", "WhatsApp Alert")
Click "Generate Workflow" button
JSON appears on the right with syntax highlighting
Copy to clipboard or Download JSON file
Import into n8n via their workflow import feature
What's Running
Service	Port	Purpose
Next.js frontend	3000	UI at /copilot
FastAPI backend	8000	API endpoint /api/copilot/generate
LLM (GPT-4o)	—	Generates n8n workflow JSON via function calling
Key Files
Backend: backend/main.py, backend/api/routes.py, backend/services/copilot_service.py
Frontend: frontend/app/copilot/page.tsx, frontend/lib/api.ts
Config: .env (create from .env.example)
Both servers auto-reload on code changes. Stop with Ctrl+C.