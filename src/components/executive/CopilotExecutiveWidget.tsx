"use client";

import React, { useState } from "react";

export const CopilotExecutiveWidget: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);

  const quickPrompts = [
    "Show executive overview",
    "On track to hit our hiring targets?",
    "What hiring risks should leadership know about?",
    "Where are we losing time in the hiring process?",
    "Which sourcing channels are producing hires?",
    "What should leadership focus on this week?",
  ];

  const handleQuery = async (queryText: string) => {
    setPrompt(queryText);
    setLoading(true);

    try {
      const res = await fetch("/api/recruiter/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: queryText }),
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-indigo-900/40">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="text-base font-bold">Executive Intelligence Copilot</h3>
          <p className="text-xs text-indigo-200">Read-Only Executive AI Assistant — Ask strategic hiring & forecasting queries</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleQuery(q)}
            className="text-xs px-3 py-1.5 rounded-full bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/50 text-indigo-100 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) handleQuery(prompt);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask executive hiring intelligence..."
          className="flex-1 text-xs px-4 py-2.5 rounded-lg bg-slate-800/80 border border-indigo-800 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Querying..." : "Ask Copilot"}
        </button>
      </form>

      {response && (
        <div className="mt-4 p-4 rounded-lg bg-slate-800/90 border border-indigo-800 text-xs leading-relaxed space-y-2 max-h-80 overflow-y-auto">
          <div className="font-semibold text-indigo-300">Copilot Executive Answer ({response.intent}):</div>
          <div className="whitespace-pre-wrap text-slate-200">{response.answer}</div>
        </div>
      )}
    </div>
  );
};
