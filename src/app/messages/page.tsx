"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

interface Contact {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread?: boolean;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: { id: string; name: string; avatar?: string; role: string };
  receiver: { id: string; name: string; avatar?: string; role: string };
}

function MessagingCentreContent() {
  const searchParams = useSearchParams();
  const initialContactId = searchParams?.get("contactId") || null;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(initialContactId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const portalType =
    user?.role === "RECRUITER"
      ? "recruiter"
      : user?.role === "PLATFORM_ADMIN"
      ? "admin"
      : "seeker";

  // 1. Load active conversations and contacts
  const loadContactsAndMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const fetchedContacts: Contact[] = data.contacts || [];
          setContacts(fetchedContacts);

          // If initial contact parameter passed and not in contacts list, fetch candidate info
          if (initialContactId && !fetchedContacts.some((c) => c.id === initialContactId)) {
            try {
              const uRes = await fetch(`/api/recruiter/candidates?q=`);
              if (uRes.ok) {
                const uData = await uRes.json();
                const matched = uData.data?.find((cand: any) => cand.id === initialContactId);
                if (matched) {
                  const newContact: Contact = {
                    id: matched.id,
                    name: matched.name,
                    role: "JOB_SEEKER",
                    avatar: matched.avatar,
                    lastMessage: "Started new conversation",
                  };
                  setContacts((prev) => [newContact, ...prev]);
                  setSelectedContactId(newContact.id);
                }
              }
            } catch (err) {
              console.error("Failed to load initial contact info:", err);
            }
          } else if (!selectedContactId && fetchedContacts.length > 0) {
            setSelectedContactId(fetchedContacts[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactsAndMessages();
  }, []);

  // 2. Load conversation messages for selected contact
  useEffect(() => {
    if (!selectedContactId) return;

    async function loadThread() {
      try {
        const res = await fetch(`/api/messages?contactId=${selectedContactId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setMessages(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load thread:", err);
      }
    }

    loadThread();
    const interval = setInterval(loadThread, 5000);
    return () => clearInterval(interval);
  }, [selectedContactId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedContactId) return;

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedContactId,
          content: inputMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.data]);
        setInputMessage("");
        loadContactsAndMessages();
      } else {
        showToast(data.error || "Failed to send message", "error");
      }
    } catch (err) {
      showToast("Network error sending message", "error");
    } finally {
      setSending(false);
    }
  };

  const activeContact = contacts.find((c) => c.id === selectedContactId);

  return (
    <ProtectedRoute requiredPortal={portalType}>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal={portalType} />

        <div className="flex-1 lg:pl-[270px] flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 flex overflow-hidden">
            {/* Contacts Sidebar */}
            <div
              className={`w-full sm:w-80 border-r border-outline-variant/20 bg-surface-container-lowest flex flex-col ${
                mobileView === "chat" ? "hidden sm:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
                <h2 className="font-bold text-base text-on-surface">Messages</h2>
                <span className="text-xs text-primary font-bold">{contacts.length} Contacts</span>
              </div>

              <div className="p-2 overflow-y-auto flex-1 space-y-1">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setSelectedContactId(contact.id);
                        setMobileView("chat");
                      }}
                      className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors ${
                        selectedContactId === contact.id
                          ? "bg-primary-container/20 border border-primary/30"
                          : "hover:bg-surface-container-low"
                      }`}
                    >
                      <img
                        src={contact.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs text-on-surface truncate">{contact.name}</h4>
                          <span className="text-[10px] text-outline font-bold">
                            {contact.role === "RECRUITER" ? "Recruiter" : "Candidate"}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {contact.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-on-surface-variant">
                    No active conversations. Reach out to candidates from the Candidate Search page.
                  </div>
                )}
              </div>
            </div>

            {/* Active Conversation Chat Window */}
            <div
              className={`flex-1 flex flex-col bg-surface ${
                mobileView === "list" ? "hidden sm:flex" : "flex"
              }`}
            >
              {activeContact ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMobileView("list")}
                        className="sm:hidden p-1 text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined">arrow_back</span>
                      </button>
                      <img
                        src={activeContact.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                        alt={activeContact.name}
                        className="w-10 h-10 rounded-full object-cover border border-primary/30"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-on-surface">{activeContact.name}</h3>
                        <p className="text-[11px] text-emerald-700 font-bold">● Active on NextHire Cloud</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Scroll Area with Copilot Safe Area */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 pb-28 sm:pb-32">
                    {messages.length > 0 ? (
                      messages.map((msg) => {
                        const isSelf = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm font-body-sm shadow-xs ${
                                isSelf
                                  ? "bg-primary text-on-primary rounded-br-none mr-2 sm:mr-4"
                                  : "bg-surface-container-high text-on-surface rounded-bl-none border border-outline-variant/20"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className={`text-[10px] text-outline pt-1 px-1 ${isSelf ? "mr-2 sm:mr-4" : ""}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 text-center space-y-2">
                        <div className="material-symbols-outlined text-4xl text-outline">chat_bubble_outline</div>
                        <p className="text-xs text-on-surface-variant">
                          No messages in this conversation yet. Send a greeting to start communicating!
                        </p>
                      </div>
                    )}
                    <div ref={messagesEndRef} className="h-6" />
                  </div>

                  {/* Message Input Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 sm:p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-2 sm:gap-3 relative z-20 flex-shrink-0"
                  >
                    <input
                      type="text"
                      placeholder={`Message ${activeContact.name}...`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 sm:py-3 bg-surface-container-low border border-outline-variant/30 rounded-full text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={sending || !inputMessage.trim()}
                      aria-label="Send message"
                      className="p-2.5 sm:p-3 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors disabled:opacity-40 flex items-center justify-center shadow-xs flex-shrink-0 touch-target focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <EmptyState
                    title="No conversations yet"
                    description="Candidate communications will appear here when messaging begins. Select candidate from Candidate Search to reach out."
                    icon="forum"
                    actionLabel="Search Candidates"
                    actionHref="/recruiter/candidates"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function MessagingCentrePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-surface">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <MessagingCentreContent />
    </Suspense>
  );
}
