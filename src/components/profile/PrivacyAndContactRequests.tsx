"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface ContactRequestItem {
  id: string;
  status: "PENDING" | "ACCEPTED_EMAIL" | "ACCEPTED_PHONE" | "ACCEPTED_ALL" | "DECLINED";
  message: string | null;
  createdAt: string;
  recruiter: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    company: {
      name: string;
      logo: string | null;
      isVerified: boolean;
    } | null;
  };
}

export function PrivacyAndContactRequests() {
  const { showToast } = useToast();
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState<ContactRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      const [privacyRes, reqRes] = await Promise.all([
        fetch("/api/candidate/privacy"),
        fetch("/api/candidate/contact-requests"),
      ]);

      if (privacyRes.ok) {
        const pData = await privacyRes.json();
        if (pData.success && pData.data) {
          setIsDiscoverable(pData.data.isDiscoverable ?? true);
          setPhone(pData.data.phone || "");
        }
      }

      if (reqRes.ok) {
        const rData = await reqRes.json();
        if (rData.success && Array.isArray(rData.data)) {
          setRequests(rData.data);
        }
      }
    } catch (err) {
      console.error("Failed to load candidate privacy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const handleToggleDiscoverable = async (newValue: boolean) => {
    setIsDiscoverable(newValue);
    try {
      setSavingPrivacy(true);
      const res = await fetch("/api/candidate/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDiscoverable: newValue, phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          newValue
            ? "Your profile is now visible to verified employers for talent sourcing."
            : "Your profile is now hidden from recruiter marketplace search (you can still apply to jobs directly).",
          "success"
        );
      } else {
        showToast(data.error || "Failed to update privacy preference", "error");
        setIsDiscoverable(!newValue);
      }
    } catch (err) {
      showToast("Network error updating privacy", "error");
      setIsDiscoverable(!newValue);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSavePhone = async () => {
    try {
      setSavingPrivacy(true);
      const res = await fetch("/api/candidate/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDiscoverable, phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Phone number updated securely.", "success");
      } else {
        showToast(data.error || "Failed to update phone number", "error");
      }
    } catch (err) {
      showToast("Network error saving phone", "error");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, status: "ACCEPTED_EMAIL" | "ACCEPTED_PHONE" | "ACCEPTED_ALL" | "DECLINED") => {
    try {
      setActionLoadingId(requestId);
      const res = await fetch("/api/candidate/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Contact request response recorded (${status.toLowerCase()}).`, "success");
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status } : r))
        );
      } else {
        showToast(data.error || "Failed to respond to request", "error");
      }
    } catch (err) {
      showToast("Network error updating contact request", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sourcing Privacy Controls Card */}
      <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">security</span>
              Recruiter Discovery & Contact Privacy
            </h3>
            <p className="text-xs text-on-surface-variant pt-1">
              Control whether employers can discover your profile through marketplace search, and manage direct contact permissions.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-surface-container-high px-4 py-2 rounded-2xl border border-outline-variant/20">
            <span className="text-xs font-bold text-on-surface">
              {isDiscoverable ? "Discoverable" : "Hidden from Search"}
            </span>
            <button
              onClick={() => handleToggleDiscoverable(!isDiscoverable)}
              disabled={savingPrivacy}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                isDiscoverable ? "bg-primary" : "bg-outline-variant/40"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  isDiscoverable ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Personal Phone Number Protection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
              Private Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-on-surface-variant">
              🔒 Your phone is strictly masked on NextHire and is never shared unless you explicitly approve a recruiter contact request.
            </p>
          </div>

          <button
            onClick={handleSavePhone}
            disabled={savingPrivacy}
            className="px-4 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all touch-target"
          >
            {savingPrivacy ? "Saving..." : "Save Phone"}
          </button>
        </div>
      </div>

      {/* Incoming Recruiter Contact Requests */}
      <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">contact_mail</span>
            Recruiter Contact Requests ({requests.filter((r) => r.status === "PENDING").length} Pending)
          </h3>
          <p className="text-xs text-on-surface-variant">
            Verified employers requesting your personal contact details. You hold full authority over what information to share.
          </p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-on-surface-variant">
            Loading contact requests...
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={req.recruiter.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                    alt={req.recruiter.name}
                    className="w-10 h-10 rounded-xl object-cover border border-outline-variant/30"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-on-surface">{req.recruiter.name}</span>
                      {req.recruiter.company && (
                        <span className="text-xs text-on-surface-variant">
                          at <span className="font-semibold text-primary">{req.recruiter.company.name}</span>
                        </span>
                      )}
                    </div>
                    {req.message && (
                      <p className="text-xs text-on-surface-variant italic">"{req.message}"</p>
                    )}
                    <span className="text-[10px] text-outline">
                      Received {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Response Actions */}
                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                  {req.status === "PENDING" ? (
                    <>
                      <button
                        onClick={() => handleRespondToRequest(req.id, "ACCEPTED_EMAIL")}
                        disabled={actionLoadingId === req.id}
                        className="px-3 py-1.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-bold rounded-xl transition-all"
                      >
                        Share Email Only
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(req.id, "ACCEPTED_ALL")}
                        disabled={actionLoadingId === req.id}
                        className="px-3 py-1.5 bg-primary text-on-primary hover:bg-primary-container text-xs font-bold rounded-xl transition-all"
                      >
                        Share Email & Phone
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(req.id, "DECLINED")}
                        disabled={actionLoadingId === req.id}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 text-xs font-bold rounded-xl transition-all"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        req.status === "DECLINED"
                          ? "bg-rose-500/10 text-rose-700"
                          : "bg-emerald-500/10 text-emerald-700"
                      }`}
                    >
                      {req.status === "ACCEPTED_ALL"
                        ? "Shared Email & Phone"
                        : req.status === "ACCEPTED_EMAIL"
                        ? "Shared Email"
                        : req.status === "ACCEPTED_PHONE"
                        ? "Shared Phone"
                        : "Declined"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-2xl">
            No contact requests received yet.
          </div>
        )}
      </div>
    </div>
  );
}
