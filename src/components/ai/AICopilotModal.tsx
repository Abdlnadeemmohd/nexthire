"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export function AICopilotModal() {
  const { user, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-hide Copilot button on downward scroll, reveal on upward scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [messages, setMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([]);

  useEffect(() => {
    if (user) {
      setMessages([
        {
          sender: "copilot",
          text:
            user.role === "RECRUITER"
              ? `Hello ${user.name || "Recruiter"}! I'm NextHire Copilot. I can assist in formatting job requirements, evaluating candidate qualifications, or structuring interview questions.`
              : user.role === "PLATFORM_ADMIN"
              ? `Welcome ${user.name || "Administrator"}! NextHire Copilot can assist with platform operations and audit summaries.`
              : `Hi ${user.name || "there"}! NextHire Copilot is ready to assist with skill alignment, resume review tips, or application preparation.`,
        },
      ]);
    }
  }, [user]);

  if (!isMounted || !isAuthenticated || !user) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setQuery("");

    setTimeout(() => {
      let reply = "I can help you navigate platform features and provide guidance based on your real active workflows.";
      if (user.role === "JOB_SEEKER") {
        if (userText.toLowerCase().includes("resume") || userText.toLowerCase().includes("ats")) {
          reply = "NextHire AI evaluates your uploaded resume against real database job requirements. To improve alignment, ensure your profile highlights specific technologies, frameworks, and project impact.";
        } else {
          reply = "Explore live positions on the Jobs page to find active roles matching your skillset and location preferences.";
        }
      } else if (user.role === "RECRUITER") {
        if (userText.toLowerCase().includes("job") || userText.toLowerCase().includes("description")) {
          reply = "To draft an effective job description, include specific technology proficiencies, core team deliverables, and explicit salary ranges in the Post Job form.";
        } else {
          reply = "No matching live candidate recommendations are currently generated. Please use the Candidate Search page to explore registered talent directly.";
        }
      } else if (user.role === "PLATFORM_ADMIN") {
        reply = "Platform operational metrics and live database audit trails are accessible directly in the Admin Management Portal.";
      }

      setMessages((prev) => [...prev, { sender: "copilot", text: reply }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Copilot Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-4 sm:right-6 z-40 px-4 py-3 bg-primary text-on-primary font-bold text-xs rounded-full shadow-2xl hover:bg-primary-container transition-all duration-300 flex items-center gap-2.5 border border-white/20 touch-target pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          isVisible || isOpen ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
        }`}
        aria-label="Open NextHire AI Copilot"
        title="Open NextHire AI Copilot"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-sm text-white">auto_awesome</span>
        </div>
        <span className="font-display font-bold whitespace-nowrap">NextHire Copilot</span>
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-scale-in">
          {/* Header */}
          <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <div>
                <h4 className="font-bold text-xs">NextHire AI Copilot</h4>
                <p className="text-[10px] opacity-80">Platform Intelligence Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full touch-target">
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
              placeholder="Ask Copilot for advice, tips, or guidance..."
              className="flex-1 px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
            <button
              type="submit"
              className="p-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary-container transition-colors touch-target flex-shrink-0"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
