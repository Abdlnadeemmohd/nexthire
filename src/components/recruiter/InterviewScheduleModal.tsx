"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface ScheduledInterviewEvent {
  id: string;
  candidateName: string;
  jobTitle: string;
  interviewType: "PHONE_SCREEN" | "TECHNICAL" | "HR_ROUND" | "FINAL_INTERVIEW";
  interviewerName: string;
  interviewerEmail: string;
  date: string;
  time: string;
  timezone: string;
  platform: "GOOGLE_MEET" | "MICROSOFT_TEAMS" | "ZOOM" | "WEBEX";
  meetingUrl: string;
  agendaNotes: string;
  createdAt: string;
}

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  onScheduleComplete: (event: ScheduledInterviewEvent) => void;
}

export function InterviewScheduleModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  onScheduleComplete,
}: InterviewScheduleModalProps) {
  const { showToast } = useToast();
  const [interviewType, setInterviewType] = useState<ScheduledInterviewEvent["interviewType"]>("TECHNICAL");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [timezone, setTimezone] = useState("UTC");
  const [platform, setPlatform] = useState<ScheduledInterviewEvent["platform"]>("GOOGLE_MEET");
  const [agendaNotes, setAgendaNotes] = useState("");

  const generateMeetingUrl = (plat: ScheduledInterviewEvent["platform"]) => {
    const slug = candidateName.toLowerCase().replace(/\s+/g, "-");
    switch (plat) {
      case "GOOGLE_MEET":
        return `https://meet.google.com/nexthire-${slug}`;
      case "MICROSOFT_TEAMS":
        return `https://teams.microsoft.com/l/meetup-join/nexthire-${slug}`;
      case "ZOOM":
        return `https://zoom.us/j/98471203948?pwd=${slug}`;
      case "WEBEX":
        return `https://webex.com/nexthire/j/${slug}`;
      default:
        return `https://meet.google.com/nexthire-${slug}`;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !interviewerName.trim()) {
      showToast("Please complete all required date, time, and interviewer fields.", "error");
      return;
    }

    const meetingUrl = generateMeetingUrl(platform);
    const event: ScheduledInterviewEvent = {
      id: `int-${Date.now()}`,
      candidateName,
      jobTitle,
      interviewType,
      interviewerName,
      interviewerEmail,
      date,
      time,
      timezone,
      platform,
      meetingUrl,
      agendaNotes,
      createdAt: new Date().toISOString(),
    };

    onScheduleComplete(event);
    showToast(`Interview scheduled via ${platform.replace("_", " ")}! Calendar invite sent to candidate.`, "success");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule Interview: ${candidateName}`}>
      <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-body-md">
        <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="font-bold text-on-surface text-sm">{candidateName}</span>
            <p className="text-on-surface-variant text-[11px]">{jobTitle}</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full uppercase text-[10px]">
            {interviewType.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Interview Round *
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as any)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PHONE_SCREEN">Phone Screening (30 mins)</option>
              <option value="TECHNICAL">Technical Architecture (45 mins)</option>
              <option value="HR_ROUND">HR Culture & Alignment (30 mins)</option>
              <option value="FINAL_INTERVIEW">Final Executive Interview (60 mins)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Meeting Platform *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="GOOGLE_MEET">Google Meet</option>
              <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
              <option value="ZOOM">Zoom Video Communications</option>
              <option value="WEBEX">Cisco Webex Meetings</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">Time *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="EST (UTC-5)">EST (New York)</option>
              <option value="PST (UTC-8)">PST (San Francisco)</option>
              <option value="GMT (UTC+0)">GMT (London)</option>
              <option value="IST (UTC+5:30)">IST (India)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Interviewer Name *
            </label>
            <input
              type="text"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Interviewer Email
            </label>
            <input
              type="email"
              value={interviewerEmail}
              onChange={(e) => setInterviewerEmail(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Agenda & Preparatory Notes for Candidate
          </label>
          <textarea
            rows={3}
            value={agendaNotes}
            onChange={(e) => setAgendaNotes(e.target.value)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Specify interview expectations, code sharing links, or topics..."
          />
        </div>

        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 touch-target"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            Confirm & Send Calendar Invite
          </button>
        </div>
      </form>
    </Modal>
  );
}
