"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface ChatMessage {
  id: string;
  sender: "COPILOT" | "USER";
  text: string;
  timestamp: string;
}

export function AICopilotDrawer() {
  const pathname = usePathname();
  const isMessagesPage = pathname?.startsWith("/messages");
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [footerOffset, setFooterOffset] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let rafId: number;

    const updatePositionAndVisibility = () => {
      const currentScrollY = window.scrollY;

      // 1. Calculate dynamic elevation when scrolling into footer or avoided regions
      const footer = document.querySelector("footer") || document.querySelector("[data-avoid-copilot]");
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Check if top of footer has entered the viewport
        if (footerRect.top < viewportHeight) {
          const overlap = Math.max(0, viewportHeight - footerRect.top);
          setFooterOffset(overlap);
        } else {
          setFooterOffset(0);
        }
      } else {
        setFooterOffset(0);
      }

      // 2. Hide on rapid scroll down only when NOT near the footer
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        const footer = document.querySelector("footer");
        const nearFooter = footer && footer.getBoundingClientRect().top < window.innerHeight + 120;
        if (!nearFooter) {
          setIsFabVisible(false);
        } else {
          setIsFabVisible(true);
        }
      } else {
        setIsFabVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePositionAndVisibility);
    };

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePositionAndVisibility);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };

    // Initial position calculation on mount or route change
    updatePositionAndVisibility();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, pathname]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "COPILOT",
      text: "Hello! I am your NextHire Recruitment Copilot. Ask me to source candidate profiles, draft job descriptions, calculate SLA response risks, or analyze resume matches.",
      timestamp: "Just now",
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "USER",
      text: input,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    // Simulate AI Copilot response
    setTimeout(() => {
      let aiResponseText = "I can assist you in evaluating candidate qualifications, drafting job requirements, or reviewing active application pipelines.";
      if (currentInput.toLowerCase().includes("job") || currentInput.toLowerCase().includes("description")) {
        aiResponseText = "Here is a suggested job description outline: 'We are seeking an experienced engineer to build and scale secure cloud services, collaborate with product stakeholders, and maintain code quality.'";
      } else if (currentInput.toLowerCase().includes("sla") || currentInput.toLowerCase().includes("alert")) {
        aiResponseText = "SLA Monitoring: Review candidate applications within the target 7-day review window to maintain a positive employer response rating.";
      } else if (currentInput.toLowerCase().includes("candidate") || currentInput.toLowerCase().includes("talent")) {
        aiResponseText = "No matching live candidate recommendations are currently generated. Please use the Candidate Search page to explore registered talent directly.";
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "COPILOT",
        text: aiResponseText,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <>
      {/* Minimized Floating Action Button (FAB) with Dynamic Safe-Area & Footer Elevation */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open NextHire AI Copilot"
        className={`fixed z-30 p-2.5 sm:p-3.5 bg-gradient-to-r from-primary via-primary-container to-tertiary text-on-primary rounded-full shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group touch-target focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          !isFabVisible || isOpen ? "opacity-0 pointer-events-none scale-75 translate-y-4" : "opacity-100 scale-100 translate-y-0"
        }`}
        style={{
          bottom: isMessagesPage
            ? "calc(6rem + env(safe-area-inset-bottom, 0px))"
            : footerOffset > 0
            ? `calc(1rem + env(safe-area-inset-bottom, 0px) + ${footerOffset}px)`
            : "calc(1rem + env(safe-area-inset-bottom, 0px))",
          right: "calc(1rem + env(safe-area-inset-right, 0px))",
          transition: "bottom 0.15s ease-out, transform 0.2s ease-out, opacity 0.2s ease-out",
        }}
        title="Open NextHire AI Copilot"
      >
        <span className="material-symbols-outlined text-xl sm:text-2xl group-hover:rotate-12 transition-transform" aria-hidden="true">
          auto_awesome
        </span>
        <span className="font-bold text-xs pr-1 hidden sm:inline">AI Copilot</span>
        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full animate-ping" aria-hidden="true"></span>
      </button>

      {/* Right-Side Slide-Over Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="NextHire AI Copilot">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-surface-container-lowest border-l border-outline-variant/30 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary text-on-primary rounded-2xl shadow-xs">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-on-surface">NextHire AI Copilot</h3>
                    <p className="text-[11px] text-on-surface-variant font-mono">Talent Sourcing &amp; ATS Assistant</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close AI Copilot"
                  className="p-2 text-outline hover:text-on-surface rounded-full hover:bg-surface-container transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                </button>
              </div>

              {/* Quick AI Prompt Shortcuts */}
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setInput("Draft Job Description for Staff Engineer");
                  }}
                  className="px-2.5 py-1 bg-surface border border-outline-variant/30 rounded-full font-bold text-on-surface hover:border-primary/50 flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  + Draft Job Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("Analyze candidate SLA risks");
                  }}
                  className="px-2.5 py-1 bg-surface border border-outline-variant/30 rounded-full font-bold text-on-surface hover:border-primary/50 flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  ⚡ Check SLA Alerts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("Find top AI match candidates");
                  }}
                  className="px-2.5 py-1 bg-surface border border-outline-variant/30 rounded-full font-bold text-on-surface hover:border-primary/50 flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  🎯 Top Candidates
                </button>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "USER" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl space-y-1 ${
                        m.sender === "USER"
                          ? "bg-primary text-on-primary rounded-br-none"
                          : "bg-surface-container-low border border-outline-variant/20 text-on-surface rounded-bl-none shadow-xs"
                      }`}
                    >
                      <p className="leading-relaxed font-body-md">{m.text}</p>
                      <span className="text-[10px] opacity-70 block text-right font-mono">{m.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant/20 bg-surface">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Copilot to source candidates or draft emails..."
                    aria-label="Ask AI Copilot"
                    className="w-full pl-4 pr-12 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    aria-label="Send message to AI Copilot"
                    className="absolute right-2 p-2 bg-primary text-on-primary rounded-xl hover:bg-primary-container transition-colors shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
