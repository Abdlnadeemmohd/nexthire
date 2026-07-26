"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function AICopilotModal() {
  const { user, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [messages, setMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    {
      sender: "copilot",
      text:
        user?.role === "RECRUITER"
          ? "Hello Sarah! I'm NextHire Copilot. I can draft Job Descriptions, summarize candidate resumes, or generate technical interview questions."
          : user?.role === "PLATFORM_ADMIN"
          ? "Welcome System Administrator! NextHire Copilot can analyze monthly MRR growth, evaluate employer verification documents, or summarize open support queues."
          : "Hi Alex! NextHire Copilot is ready to analyze your resume keywords, recommend top matching roles, or provide interview coaching.",
    },
  ]);

  if (!isMounted || !isAuthenticated || !user) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setQuery("");

    setTimeout(() => {
      let reply = "I'm analyzing platform data to provide optimal recommendations.";
      if (user.role === "JOB_SEEKER") {
        if (userText.toLowerCase().includes("resume") || userText.toLowerCase().includes("ats")) {
          reply = "Your resume currently achieves a 98% ATS match score for Senior UX Engineer roles. Consider emphasizing 'Design Tokens' and 'Micro-Frontends' in your experience section.";
        } else {
          reply = "Found 14 matching High-Growth Enterprise roles in San Francisco & Remote matching your salary expectation ($160k+).";
        }
      } else if (user.role === "RECRUITER") {
        if (userText.toLowerCase().includes("job") || userText.toLowerCase().includes("description")) {
          reply = "Generated Draft Job Description for Senior Full-Stack Engineer with Next.js & TypeScript requirements. Click 'Use in Job Poster' to copy.";
        } else {
          reply = "Analyzed top candidates: Alex Rivers (98% match) and David Chen (92% match) are highly recommended for technical interview scheduling.";
        }
      } else if (user.role === "PLATFORM_ADMIN") {
        reply = "Platform Health Audit: MRR is $14,850 (+12.4% MoM). 3 Employer Verification applications pending audit in queue.";
      }

      setMessages((prev) => [...prev, { sender: "copilot", text: reply }]);
    }, 800);
  };

  return (
    <>
      {/* Floating Copilot Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-primary text-on-primary font-bold text-xs rounded-full shadow-2xl hover:bg-primary-container transition-all flex items-center gap-2.5 border border-white/20 touch-target"
        aria-label="Open NextHire AI Copilot"
        title="Open NextHire AI Copilot"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-sm text-white">auto_awesome</span>
        </div>
        <span className="font-display font-bold">NextHire Copilot</span>
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-scale-in">
          {/* Header */}
          <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <div>
                <h4 className="font-bold text-xs">NextHire AI Copilot</h4>
                <p className="text-[10px] opacity-80">Enterprise Intelligence Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-container-low/30">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-on-primary font-medium"
                      : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Copilot for tips, descriptions..."
              className="flex-1 px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="p-2 bg-primary text-on-primary rounded-xl hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
