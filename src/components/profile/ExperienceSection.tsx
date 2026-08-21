"use client";

import React, { useState } from "react";
import { UserExperience } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface ExperienceSectionProps {
  experiences: UserExperience[];
  onChange: (updated: UserExperience[]) => void;
}

export function ExperienceSection({ experiences, onChange }: ExperienceSectionProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserExperience | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserExperience>({
    id: "",
    company: "",
    role: "",
    employmentType: "Full-time",
    location: "",
    workModel: "Hybrid",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    responsibilities: [],
    achievements: [],
    skills: [],
    companyUrl: "",
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [respInput, setRespInput] = useState("");

  const handleOpenAdd = () => {
    const newItem: UserExperience = {
      id: `exp-${Date.now()}`,
      company: "",
      role: "",
      employmentType: "Full-time",
      location: "",
      workModel: "Hybrid",
      startDate: "",
      endDate: "",
      isCurrent: true,
      description: "",
      responsibilities: [],
      achievements: [],
      skills: [],
      companyUrl: "",
    };
    setEditingItem(null);
    setFormData(newItem);
    setSkillsInput("");
    setRespInput("");
    setModalOpen(true);
  };

  const handleOpenEdit = (exp: UserExperience) => {
    setEditingItem(exp);
    setFormData({ ...exp });
    setSkillsInput(exp.skills?.join(", ") || "");
    setRespInput(exp.responsibilities?.join("\n") || "");
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const next = experiences.filter((e) => e.id !== id);
    onChange(next);
    showToast("Experience record removed", "info");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim() || !formData.startDate.trim()) {
      showToast("Please fill in the Job Title, Company Name, and Start Date.", "error");
      return;
    }

    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const respArray = respInput
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const recordToSave: UserExperience = {
      ...formData,
      company: formData.company.trim(),
      role: formData.role.trim(),
      description: formData.description.trim(),
      endDate: formData.isCurrent ? "Present" : formData.endDate,
      skills: skillsArray,
      responsibilities: respArray,
    };

    if (editingItem) {
      const next = experiences.map((e) => (e.id === editingItem.id ? recordToSave : e));
      onChange(next);
      showToast("Experience updated successfully!", "success");
    } else {
      onChange([recordToSave, ...experiences]);
      showToast("Experience record added!", "success");
    }

    setModalOpen(false);
  };

  return (
    <>
      <ProfileSectionCard
        title="Professional Experience"
        subtitle="Your career history, responsibilities, and measurable achievements."
        icon="work"
        isEmpty={experiences.length === 0}
        emptyMessage="No work experience added yet. Add your positions to highlight your experience."
        actionButton={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Position
          </button>
        }
      >
        <div className="space-y-6">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-4 sm:p-5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">business_center</span>
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-sm sm:text-base text-on-surface">
                      {exp.role}
                    </h3>
                    {exp.workModel && (
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-bold text-[10px] rounded-md">
                        {exp.workModel}
                      </span>
                    )}
                    {exp.employmentType && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-md">
                        {exp.employmentType}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-primary">
                    {exp.company}
                    {exp.location ? ` • 📍 ${exp.location}` : ""}
                  </p>

                  <p className="text-[11px] text-outline font-mono">
                    {exp.startDate} – {exp.isCurrent || exp.endDate === "Present" ? "Present" : exp.endDate || "Present"}
                  </p>

                  {exp.description && (
                    <p className="text-xs text-on-surface-variant leading-relaxed pt-1 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}

                  {/* Responsibilities list if specified */}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-0.5 pt-1">
                      {exp.responsibilities.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  )}

                  {/* Skills tags */}
                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {exp.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-surface-container-high text-on-surface text-[10px] font-semibold rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                <button
                  onClick={() => handleOpenEdit(exp)}
                  className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                  title="Edit Experience"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Delete Experience"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {/* Edit / Add Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Experience Record" : "Add Work Experience"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-body-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full-Stack Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Employment Type
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Work Model
                </label>
                <select
                  value={formData.workModel}
                  onChange={(e) => setFormData({ ...formData, workModel: e.target.value as any })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Start Date *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jan 2023 or 2023-01"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  End Date
                </label>
                <input
                  type="text"
                  disabled={formData.isCurrent}
                  placeholder={formData.isCurrent ? "Present" : "e.g. Dec 2024"}
                  value={formData.isCurrent ? "Present" : formData.endDate || ""}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${
                    formData.isCurrent ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCurrentExp"
                checked={formData.isCurrent || false}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <label htmlFor="isCurrentExp" className="font-bold text-on-surface cursor-pointer text-xs">
                I currently work in this role
              </label>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Summary & Key Impact
              </label>
              <textarea
                rows={3}
                placeholder="Describe your role, core responsibilities, and architecture accomplishments..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Responsibilities / Bullet Points (One per line)
              </label>
              <textarea
                rows={3}
                placeholder="Led frontend architecture migration to Next.js&#10;Mentored 4 junior engineers"
                value={respInput}
                onChange={(e) => setRespInput(e.target.value)}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Technologies / Skills Used (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Next.js, TypeScript, PostgreSQL, Docker"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
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
                Save Experience
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
