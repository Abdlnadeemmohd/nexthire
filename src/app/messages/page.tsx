"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { INITIAL_MESSAGES, MessageItem } from "@/lib/mockData";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { MessagingService } from "@/services/messagingService";
import { Modal } from "@/components/ui/Modal";

export default function MessagingCentrePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const portalType =
    user?.role === "RECRUITER"
      ? "recruiter"
      : user?.role === "PLATFORM_ADMIN"
      ? "admin"
      : "seeker";

  const activeContact =
    user?.role === "RECRUITER"
      ? {
          name: "Alex Rivers",
          company: "Job Candidate",
          role: "Senior UX Specialist",
          avatar:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
          online: true,
        }
      : user?.role === "PLATFORM_ADMIN"
      ? {
          name: "System Support & Moderation Desk",
          company: "NextHire Platform",
          role: "Super Administrator",
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
          online: true,
        }
      : {
          name: "Sarah Jenkins",
          company: "Stellar Systems",
          role: "Lead Tech Recruiter",
          avatar:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC1D7dFdsnx2LAf_HxMUQf5KpCl5o2SHtRoQtxP7qjPB2D7KMODcDu0063TsqSLCewWg9M09otOoMbH-NfUzvBYL92WSEUJQDyw0W-Bmok-FvgZyL21HUitslBJkhfhVC2G8gAQ6LSZ_X8qMYN9F5R1R_kgZFA67hps92BfZKbel7Lmg6aApF7Nih5ph9jjS0S0rUr2W_p3a3L0hwTkNXDRL4DpAgeh-X1qCkE5OBpKsWx0JHS37gayqR4caP6y50K32RpNrJ5CHWlC",
          online: true,
        };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: MessageItem = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || "user-curr",
      senderName: user?.name || "User",
      senderAvatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      receiverId: "contact-1",
      content: inputMessage,
      timestamp: "Just now",
      read: true,
      isRecruiter: user?.role === "RECRUITER",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-reply-${Date.now()}`,
            senderId: "contact-1",
            senderName: activeContact.name,
            senderAvatar: activeContact.avatar,
            receiverId: user?.id || "user-curr",
            content:
              user?.role === "RECRUITER"
                ? "Thanks for reaching out! I'm very interested in learning more about the opportunity."
                : user?.role === "PLATFORM_ADMIN"
                ? "Your ticket has been logged and confirmed by Platform Operations."
                : "Thanks! Got your message. I'll pass this directly to our hiring team.",
            timestamp: "Just now",
            read: true,
            isRecruiter: user?.role !== "RECRUITER",
          },
        ]);
      }, 1500);
    }, 800);
  };

  return (
    <ProtectedRoute>
      <TopAppBar />

      <div className="flex bg-surface h-[calc(100vh-64px)] mt-16 overflow-hidden">
        <SidebarNav portal={portalType} />

        <main className="flex-1 lg:pl-[270px] flex flex-col md:flex-row h-full w-full">
          {/* Conversation List Column */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-outline-variant/20 bg-surface-container-lowest flex flex-col h-full">
            <div className="p-4 border-b border-outline-variant/20 space-y-3">
              <h2 className="font-display text-xl font-bold text-on-surface">
                Messages
              </h2>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10">
              {/* Active Conversation Item */}
              <div className="p-4 bg-secondary-container/20 border-l-4 border-primary flex items-center gap-3 cursor-pointer">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary rounded-full ring-2 ring-white"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                      {activeContact.name}
                    </h4>
                    <span className="text-[10px] text-outline">10:22 AM</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-label-md truncate">
                    {activeContact.company} • {activeContact.role}
                  </p>
                  <p className="text-xs text-outline truncate pt-0.5">
                    {messages[messages.length - 1]?.content}
                  </p>
                </div>
              </div>

              {/* Other Conversations */}
              <div className="p-4 flex items-center gap-3 hover:bg-surface-container/50 cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-container text-on-primary-container flex items-center justify-center font-bold flex-shrink-0">
                  NS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                      NeuralScale Talent Team
                    </h4>
                    <span className="text-[10px] text-outline">Yesterday</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-label-md">
                    Lead AI Architect Position
                  </p>
                  <p className="text-xs text-outline truncate">
                    Your profile has been shortlisted for technical review...
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Slack Chat Window */}
          <section className="flex-1 flex flex-col h-full bg-surface-container-lowest">
            {/* Chat Thread Header */}
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface/80 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary rounded-full ring-2 ring-white"></span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    {activeContact.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-label-md">
                    {activeContact.role} at <span className="font-bold text-primary">{activeContact.company}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-2 rounded-full transition-colors ${
                    isPinned ? "text-primary bg-primary/10" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                  title={isPinned ? "Unpin Conversation" : "Pin Conversation"}
                >
                  <span className="material-symbols-outlined text-lg">push_pin</span>
                </button>
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    showToast(`Notifications ${!isMuted ? "muted" : "unmuted"} for this thread`, "info");
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    isMuted ? "text-error bg-error/10" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                  title={isMuted ? "Unmute Thread" : "Mute Thread"}
                >
                  <span className="material-symbols-outlined text-lg">{isMuted ? "notifications_off" : "notifications"}</span>
                </button>
                <button
                  onClick={() => setShowVideoCallModal(true)}
                  className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs touch-target"
                >
                  <span className="material-symbols-outlined text-base">videocam</span>
                  <span>Join Video Call</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isMe = !msg.isRecruiter;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-2xl ${
                      isMe ? "ml-auto flex-row-reverse" : ""
                    }`}
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-9 h-9 rounded-full object-cover shadow-xs flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-primary text-on-primary rounded-tr-xs shadow-md"
                            : "bg-surface-container-high text-on-surface rounded-tl-xs"
                        }`}
                      >
                        <p>{msg.content}</p>

                        {/* File Attachment Pill */}
                        {msg.attachment && (
                          <div className="mt-3 p-3 bg-white/20 rounded-xl flex items-center justify-between gap-3 border border-white/30">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-xl">
                                description
                              </span>
                              <div>
                                <p className="font-bold text-xs">{msg.attachment.name}</p>
                                <p className="text-[10px] opacity-80">{msg.attachment.size}</p>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-base">download</span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] text-outline ${
                          isMe ? "justify-end" : ""
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <span className="material-symbols-outlined text-tertiary text-xs">
                            done_all
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-outline font-label-md pl-12 animate-pulse">
                  <span>{activeContact.name} is typing...</span>
                </div>
              )}
            </div>

            {/* Bottom Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-outline-variant/20 bg-surface flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => alert("Resume file attached: Alex_Rivers_Resume_2026.pdf")}
                className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                title="Attach Resume / File"
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message to recruiter..."
                className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                type="submit"
                className="p-3 bg-primary text-on-primary rounded-xl font-label-md hover:bg-primary-container transition-all shadow-md active:scale-95 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </form>
          </section>
        </main>
      </div>

      <Modal
        isOpen={showVideoCallModal}
        onClose={() => setShowVideoCallModal(false)}
        title="1-on-1 Enterprise Video Meeting"
      >
        <div className="space-y-4 text-xs font-body-md text-center">
          <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-outline-variant/30 shadow-inner">
            <img
              src={activeContact.avatar}
              alt={activeContact.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/50 animate-pulse"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-xl text-white text-left flex items-center justify-between text-xs font-bold">
              <span>{activeContact.name} ({activeContact.role})</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Live HD
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => showToast("Microphone muted", "info")}
              className="p-3 bg-surface-container-high rounded-full hover:bg-surface-container text-on-surface"
              title="Mute Mic"
            >
              <span className="material-symbols-outlined text-xl">mic</span>
            </button>
            <button
              onClick={() => showToast("Camera toggled", "info")}
              className="p-3 bg-surface-container-high rounded-full hover:bg-surface-container text-on-surface"
              title="Toggle Camera"
            >
              <span className="material-symbols-outlined text-xl">videocam</span>
            </button>
            <button
              onClick={() => {
                setShowVideoCallModal(false);
                showToast("Video call ended", "info");
              }}
              className="p-3 bg-error text-on-error rounded-full hover:bg-error/90 shadow-md"
              title="End Call"
            >
              <span className="material-symbols-outlined text-xl">call_end</span>
            </button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
