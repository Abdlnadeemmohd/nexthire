"use client";

import React, { useState } from "react";
import { CandidateLink } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PortfolioLinksSectionProps {
  links: CandidateLink[];
  onChange: (updated: CandidateLink[]) => void;
}

export function PortfolioLinksSection({ links, onChange }: PortfolioLinksSectionProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateLink | null>(null);

  const [formData, setFormData] = useState<CandidateLink>({
    id: "",
    platform: "LinkedIn",
    label: "",
    url: "",
    note: "",
    isPublic: true,
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "GitHub": return "code";
      case "LinkedIn": return "link";
      case "Website": return "language";
      case "Portfolio": return "web_asset";
      case "Kaggle": return "analytics";
      case "Stack Overflow": return "terminal";
      case "Medium": return "article";
      case "YouTube": return "play_circle";
      case "Twitter": return "chat";
      case "Scholar": return "school";
      case "Behance":
      case "Dribbble": return "palette";
      default: return "open_in_new";
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `link-${Date.now()}`,
      platform: "LinkedIn",
      label: "",
      url: "",
      note: "",
      isPublic: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (link: CandidateLink) => {
    setEditingItem(link);
    setFormData({ ...link });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const next = links.filter((l) => l.id !== id);
    onChange(next);
    showToast("Link removed", "info");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) {
      showToast("Please enter a valid URL.", "error");
      return;
    }

    let cleanUrl = formData.url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const recordToSave: CandidateLink = {
      ...formData,
      url: cleanUrl,
      label: formData.label.trim() || formData.platform,
      note: formData.note?.trim() || undefined,
    };

    if (editingItem) {
      const next = links.map((l) => (l.id === editingItem.id ? recordToSave : l));
      onChange(next);
      showToast("Link updated!", "success");
    } else {
      onChange([...links, recordToSave]);
      showToast("Link added to your profile!", "success");
    }

    setModalOpen(false);
  };

  return (
    <>
      <ProfileSectionCard
        title="Portfolio & Professional Links"
        subtitle="Public profiles, repositories, and custom professional destinations."
        icon="link"
        isEmpty={links.length === 0}
        emptyMessage="No professional links added yet. Add your LinkedIn, GitHub, or portfolio website."
        actionButton={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Link
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="p-3.5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all flex items-center justify-between gap-3 group"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-base">
                    {getPlatformIcon(link.platform)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                    {link.label || link.platform}
                  </h4>
                  <p className="text-[11px] text-outline font-mono truncate">
                    {link.url.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleOpenEdit(link)}
                  className="p-1 text-outline hover:text-primary rounded-lg transition-colors"
                  title="Edit Link"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-1 text-outline hover:text-error rounded-lg transition-colors"
                  title="Delete Link"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Professional Link" : "Add Professional Link"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Platform / Destination *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="GitHub">GitHub</option>
                <option value="Website">Personal Website</option>
                <option value="Portfolio">Portfolio</option>
                <option value="Behance">Behance</option>
                <option value="Dribbble">Dribbble</option>
                <option value="Kaggle">Kaggle</option>
                <option value="Stack Overflow">Stack Overflow</option>
                <option value="Medium">Medium</option>
                <option value="YouTube">YouTube</option>
                <option value="Twitter">X / Twitter</option>
                <option value="Scholar">Google Scholar / Research</option>
                <option value="Other">Other / Custom Link</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Display Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. My Open Source Portfolio"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                URL *
              </label>
              <input
                type="text"
                required
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Short Note / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Contains interactive WebGL demos"
                value={formData.note || ""}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                Save Link
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
