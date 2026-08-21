"use client";

import React, { useState } from "react";
import { CandidatePublication, CandidateLanguage } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PublicationsAndLanguagesSectionProps {
  publications: CandidatePublication[];
  languages: CandidateLanguage[];
  onPublicationsChange: (updated: CandidatePublication[]) => void;
  onLanguagesChange: (updated: CandidateLanguage[]) => void;
}

export function PublicationsAndLanguagesSection({
  publications,
  languages,
  onPublicationsChange,
  onLanguagesChange,
}: PublicationsAndLanguagesSectionProps) {
  const { showToast } = useToast();
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);

  const [pubForm, setPubForm] = useState<CandidatePublication>({
    id: "",
    title: "",
    publisher: "",
    date: "",
    url: "",
    description: "",
  });

  const [langForm, setLangForm] = useState<CandidateLanguage>({
    id: "",
    language: "",
    proficiency: "Professional",
  });

  // Publication Handlers
  const handleSavePublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubForm.title.trim()) {
      showToast("Please enter a publication title.", "error");
      return;
    }

    const newPub: CandidatePublication = {
      ...pubForm,
      id: pubForm.id || `pub-${Date.now()}`,
      title: pubForm.title.trim(),
      publisher: pubForm.publisher?.trim() || undefined,
      url: pubForm.url?.trim() || undefined,
      description: pubForm.description?.trim() || undefined,
    };

    if (pubForm.id) {
      onPublicationsChange(publications.map((p) => (p.id === pubForm.id ? newPub : p)));
      showToast("Publication updated!", "success");
    } else {
      onPublicationsChange([...publications, newPub]);
      showToast("Publication added!", "success");
    }

    setPubModalOpen(false);
  };

  const handleDeletePublication = (id: string) => {
    onPublicationsChange(publications.filter((p) => p.id !== id));
    showToast("Publication removed", "info");
  };

  // Language Handlers
  const handleSaveLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!langForm.language.trim()) {
      showToast("Please enter a language.", "error");
      return;
    }

    const newLang: CandidateLanguage = {
      id: langForm.id || `lang-${Date.now()}`,
      language: langForm.language.trim(),
      proficiency: langForm.proficiency,
    };

    if (langForm.id) {
      onLanguagesChange(languages.map((l) => (l.id === langForm.id ? newLang : l)));
      showToast("Language updated!", "success");
    } else {
      onLanguagesChange([...languages, newLang]);
      showToast("Language added!", "success");
    }

    setLangModalOpen(false);
  };

  const handleDeleteLanguage = (id: string) => {
    onLanguagesChange(languages.filter((l) => l.id !== id));
    showToast("Language removed", "info");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Languages Card */}
      <ProfileSectionCard
        title="Languages"
        subtitle="Languages you speak and your proficiency level."
        icon="translate"
        isEmpty={languages.length === 0}
        emptyMessage="No languages listed yet."
        actionButton={
          <button
            onClick={() => {
              setLangForm({ id: "", language: "", proficiency: "Professional" });
              setLangModalOpen(true);
            }}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Language
          </button>
        }
      >
        <div className="space-y-2.5">
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-xs text-on-surface">{lang.language}</span>
                <span className="text-[11px] text-outline block">{lang.proficiency} Proficiency</span>
              </div>

              <button
                onClick={() => handleDeleteLanguage(lang.id)}
                className="p-1 text-outline hover:text-error rounded-lg"
                title="Remove Language"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {/* Publications Card */}
      <ProfileSectionCard
        title="Publications & Research"
        subtitle="Scientific papers, journal publications, and articles."
        icon="auto_stories"
        isEmpty={publications.length === 0}
        emptyMessage="No publications added yet."
        actionButton={
          <button
            onClick={() => {
              setPubForm({ id: "", title: "", publisher: "", date: "", url: "", description: "" });
              setPubModalOpen(true);
            }}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Publication
          </button>
        }
      >
        <div className="space-y-3">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="p-3.5 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 flex items-start justify-between gap-2"
            >
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-on-surface">{pub.title}</h4>
                {pub.publisher && <p className="text-[11px] text-primary font-semibold">{pub.publisher}</p>}
                {pub.date && <p className="text-[10px] text-outline font-mono">{pub.date}</p>}
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline font-bold inline-flex items-center gap-0.5 pt-0.5"
                  >
                    View Paper
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => handleDeletePublication(pub.id)}
                className="p-1 text-outline hover:text-error rounded-lg flex-shrink-0"
                title="Remove Publication"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {/* Language Modal */}
      {langModalOpen && (
        <Modal isOpen={langModalOpen} onClose={() => setLangModalOpen(false)} title="Add Language">
          <form onSubmit={handleSaveLanguage} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Language *</label>
              <input
                type="text"
                required
                placeholder="e.g. English, Spanish, German, Japanese"
                value={langForm.language}
                onChange={(e) => setLangForm({ ...langForm, language: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Proficiency Level</label>
              <select
                value={langForm.proficiency}
                onChange={(e) => setLangForm({ ...langForm, proficiency: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Native">Native / Bilingual</option>
                <option value="Fluent">Fluent (Full Professional)</option>
                <option value="Professional">Professional Working</option>
                <option value="Conversational">Conversational</option>
                <option value="Elementary">Elementary</option>
              </select>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLangModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
              >
                Save Language
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Publication Modal */}
      {pubModalOpen && (
        <Modal isOpen={pubModalOpen} onClose={() => setPubModalOpen(false)} title="Add Publication">
          <form onSubmit={handleSavePublication} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Scaling Distributed State Machines with Low Latency"
                value={pubForm.title}
                onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Publisher / Journal</label>
                <input
                  type="text"
                  placeholder="e.g. IEEE, ACM, arXiv"
                  value={pubForm.publisher || ""}
                  onChange={(e) => setPubForm({ ...pubForm, publisher: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Date</label>
                <input
                  type="date"
                  value={pubForm.date || ""}
                  onChange={(e) => setPubForm({ ...pubForm, date: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={pubForm.url || ""}
                onChange={(e) => setPubForm({ ...pubForm, url: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPubModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
              >
                Save Publication
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
