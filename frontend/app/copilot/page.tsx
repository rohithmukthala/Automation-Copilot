"use client";

import { useState, useCallback, useEffect } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { generateWorkflow, type N8nWorkflow } from "@/lib/api";

SyntaxHighlighter.registerLanguage("json", json);

const PRESETS = [
  {
    label: "Lead to CRM",
    prompt:
      "When a new Typeform response is submitted, create a contact in HubSpot CRM with the respondent's name and email.",
  },
  {
    label: "Webhook to Email",
    prompt:
      "When an HTTP webhook is received with a JSON payload, send a formatted email via Gmail to the admin address.",
  },
  {
    label: "WhatsApp Alert",
    prompt:
      "When a new row is added to a Google Sheet, send a WhatsApp message via Twilio with the row data.",
  },
  {
    label: "Slack Notification",
    prompt:
      "When a new GitHub issue is opened in the repository, post a Slack message to the #alerts channel with the issue title and URL.",
  },
  {
    label: "Daily Report",
    prompt:
      "Every day at 9am, fetch data from a REST API endpoint and send a summary email with the results.",
  },
];

export default function CopilotPage() {
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<N8nWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setToast({ message: "Please enter a prompt before generating.", type: "error" });
      return;
    }
    setLoading(true);
    setWorkflow(null);
    try {
      const data = await generateWorkflow(prompt);
      setWorkflow(data.workflow);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const handleCopy = useCallback(() => {
    if (!workflow) return;
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [workflow]);

  const handleDownload = useCallback(() => {
    if (!workflow) return;
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflow]);

  const jsonText = workflow ? JSON.stringify(workflow, null, 2) : "";

  return (
    <main className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 shadow-sm flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          n8
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-100">Automation Copilot</h1>
          <p className="text-xs text-gray-500">Natural language → n8n workflow JSON</p>
        </div>
      </header>

      {/* Split-screen body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="w-2/5 flex flex-col border-r border-gray-800 bg-gray-900 p-5 gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Describe your automation
            </label>
            <textarea
              className="w-full h-32 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder='e.g. "Send a WhatsApp when a Typeform is filled"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />
            <p className="text-xs text-gray-600 mt-1">Ctrl+Enter to generate</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner />
                Generating…
              </>
            ) : (
              "Generate Workflow"
            )}
          </button>

          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Preset templates
            </p>
            <div className="flex flex-col gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPrompt(p.prompt)}
                  className="text-left rounded-lg border border-gray-700 bg-gray-800 hover:border-indigo-500 hover:bg-gray-750 px-3 py-2.5 transition group"
                >
                  <span className="block text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition">
                    {p.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{p.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <section className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {workflow ? workflow.name : "n8n Workflow JSON"}
            </span>
            {workflow && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="rounded-md border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-md border border-indigo-700 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 text-xs px-3 py-1.5 transition"
                >
                  Download JSON
                </button>
              </div>
            )}
          </div>

          {/* Code area */}
          <div className="flex-1 overflow-auto p-5">
            {loading ? (
              <LoadingSkeleton />
            ) : workflow ? (
              <SyntaxHighlighter
                language="json"
                style={atomOneDark}
                customStyle={{
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: "1.7",
                }}
                wrapLongLines
              >
                {jsonText}
              </SyntaxHighlighter>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 shadow-xl text-sm font-medium flex items-center gap-2 transition-all ${
            toast.type === "error"
              ? "bg-red-900 border border-red-700 text-red-200"
              : "bg-green-900 border border-green-700 text-green-200"
          }`}
        >
          {toast.type === "error" ? "✕" : "✓"}
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gray-800"
          style={{ width: `${40 + ((i * 37) % 55)}%` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl">
        ⚡
      </div>
      <div>
        <p className="text-gray-400 font-medium">No workflow generated yet</p>
        <p className="text-gray-600 text-sm mt-1">
          Type a description or pick a preset on the left, then click Generate.
        </p>
      </div>
    </div>
  );
}
