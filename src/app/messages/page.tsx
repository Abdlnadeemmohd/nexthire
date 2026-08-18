"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { MessageItem } from "@/lib/mockData";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function MessagingCentrePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");

  const portalType =
    user?.role === "RECRUITER"
      ? "recruiter"
      : user?.role === "PLATFORM_ADMIN"
      ? "admin"
      : "seeker";

  const activeContact =
    user?.role === "RECRUITER"
      ? {
          name: "Job Candidate",
          company: "Candidate Pipeline",
          role: "Verified Job Seeker",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
          online: true,
        }
      : user?.role === "PLATFORM_ADMIN"
      ? {
          name: "Platform Operations Desk",
          company: "NextHire Cloud",
          role: "Super Administrator",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
          online: true,
        }
      : {
          name: "Recruitment Team",
          company: "NextHire Simulation Corp",
          role: "Hiring Manager",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
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

    // Automated simulation response
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
                ? "Thank you for reaching out! I look forward to discussing the role."
                : user?.role === "PLATFORM_ADMIN"
                ? "Message logged in Platform Operations Desk."
                : "Thank you for your message! Our recruiting team is reviewing your application.",
            timestamp: "Just now",
            read: true,
            isRecruiter: user?.role !== "RECRUITER",
          },
        ]);
      }, 1000);
    }, 500);
  };

  return (
    <ProtectedRoute requiredPortal={portalType}>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal={portalType} />

        <div className="flex-1 lg:pl-[270px] flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 flex overflow-hidden">
            {/* Contacts Sidebar */}
            <div className={`w-full sm:w-80 border-r border-outline-variant/20 bg-surface-container-lowest flex flex-col ${mobileView === "chat" ? "hidden sm:flex" : "flex"}`}>
              <div className="p-4 border-b border-outline-variant/20">
                <h2 className="font-bold text-base text-on-surface">Conversations</h2>
              </div>

              <div className="p-2">
                <div
                  onClick={() => setMobileView("chat")}
                  className="p-3 rounded-2xl bg-surface-container-low border border-primary/30 flex items-center gap-3 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={activeContact.avatar}
                      alt={activeContact.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xs text-on-surface truncate">{activeContact.name}</h3>
                    <p className="text-[11px] text-on-surface-variant truncate">{activeContact.company}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Conversation Area */}
            <div className={`flex-1 flex flex-col bg-surface ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
              {/* Chat Header */}
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileView("list")}
                    className="sm:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </button>
                  <img
                    src={activeContact.avatar}
                    alt={activeContact.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{activeContact.name}</h3>
                    <p className="text-[11px] text-on-surface-variant">{activeContact.role} • {activeContact.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowVideoCallModal(true)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Start Video Meeting"
                  >
                    <span className="material-symbols-outlined text-lg">videocam</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.senderId === (user?.id || "user-curr");
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? "bg-primary text-on-primary rounded-br-xs"
                              : "bg-surface-container-high text-on-surface rounded-bl-xs"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span
                            className={`text-[9px] mt-1 block ${
                              isMe ? "text-on-primary/70 text-right" : "text-outline text-left"
                            }`}
                          >
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-outline">chat_bubble_outline</span>
                    <h4 className="font-bold text-sm text-on-surface">No messages yet</h4>
                    <p className="text-xs text-on-surface-variant max-w-sm">
                      Send a message to start direct communication with {activeContact.name}.
                    </p>
                  </div>
                )}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-outline italic">
                    <span>{activeContact.name} is typing...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${activeContact.name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs hover:bg-primary-container disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <span>Send</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showVideoCallModal && (
        <Modal
          isOpen={showVideoCallModal}
          onClose={() => setShowVideoCallModal(false)}
          title="Start Live Video Meeting"
        >
          <div className="space-y-4 text-xs">
            <p className="text-on-surface-variant">
              Generate an instant Google Meet room with {activeContact.name}.
            </p>
            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowVideoCallModal(false)}
              className="w-full text-center py-2.5 bg-primary text-on-primary font-bold rounded-xl block hover:bg-primary-container"
            >
              Launch Google Meet Call
            </a>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
