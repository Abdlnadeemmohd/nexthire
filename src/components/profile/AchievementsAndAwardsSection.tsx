"use client";

import React, { useState } from "react";
import { CandidateAchievement } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface AchievementsAndAwardsSectionProps {
  achievements: CandidateAchievement[];
  onChange: (updated: CandidateAchievement[]) => void;
}

export function AchievementsAndAwardsSection({ achievements, onChange }: AchievementsAndAwardsSectionProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateAchievement | null>(null);

  const [formData, setFormData] = useState<CandidateAchievement>({
    id: "",
    title: "",
    issuer: "",
    date: "",
    category: "Award",
    description: "",
    url: "",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `ach-${Date.now()}`,
      title: "",
      issuer: "",
      date: new Date().toISOString().split("T")[0],
      category: "Award",
      description: "",
      url: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ach: CandidateAchievement) => {
    setEditingItem(ach);
    setFormData({ ...ach });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const next = achievements.filter((a) => a.id !== id);
    onChange(next);
    showToast("Achievement entry removed", "info");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Please enter an achievement title.", "error");
      return;
    }

    const recordToSave: CandidateAchievement = {
      ...formData,
      title: formData.title.trim(),
      issuer: formData.issuer?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      url: formData.url?.trim() || undefined,
    };

    if (editingItem) {
      const next = achievements.map((a) => (a.id === editingItem.id ? recordToSave : a));
      onChange(next);
      showToast("Achievement updated!", "success");
    } else {
      onChange([...achievements, recordToSave]);
      showToast("Achievement added to your profile!", "success");
    }

    setModalOpen(false);
  };

  return (
    <>
      <ProfileSectionCard
        title="Honors & Achievements"
        subtitle="Competitions, hackathons, company awards, and technical milestones."
        icon="emoji_events"
        isEmpty={achievements.length === 0}
        emptyMessage="No achievements listed yet. Add hackathon prizes, company awards, or milestones."
        actionButton={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Achievement
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-4 sm:p-5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-lg">
                      {ach.category === "Hackathon" ? "terminal" : "military_tech"}
                    </span>
                    <h4 className="font-display font-bold text-sm text-on-surface">
                      {ach.title}
                    </h4>
                  </div>
                  {ach.category && (
                    <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-bold text-[10px] rounded-md">
                      {ach.category}
                    </span>
                  )}
                </div>

                {ach.issuer && (
                  <p className="text-xs font-bold text-primary">{ach.issuer}</p>
                )}

                {ach.date && (
                  <p className="text-[11px] text-outline font-mono">{ach.date}</p>
                )}

                {ach.description && (
                  <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                    {ach.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between">
                {ach.url ? (
                  <a
                    href={ach.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    View Details
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                ) : <span />}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(ach)}
                    className="p-1 text-outline hover:text-primary rounded-lg transition-colors"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(ach.id)}
                    className="p-1 text-outline hover:text-error rounded-lg transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Achievement" : "Add Honor or Achievement"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Title / Honor *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1st Place Winner - Global AI Hackathon"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Issuing Organization / Host
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Cloud, Major League Hacking"
                  value={formData.issuer || ""}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Award">Award</option>
                  <option value="Honor">Honor</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Competition">Competition</option>
                  <option value="Milestone">Professional Milestone</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  URL / Reference Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.url || ""}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary of the competition, problem solved, or honor details..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-sm"
              >
                Save Achievement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
