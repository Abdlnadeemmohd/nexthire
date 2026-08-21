"use client";

import React, { useState } from "react";
import { UserEducation } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface EducationSectionProps {
  educations: UserEducation[];
  onChange: (updated: UserEducation[]) => void;
}

export function EducationSection({ educations, onChange }: EducationSectionProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserEducation | null>(null);

  const [formData, setFormData] = useState<UserEducation>({
    id: "",
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    graduationYear: "",
    gradeGpa: "",
    description: "",
    institutionUrl: "",
    activities: "",
    isCurrent: false,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      graduationYear: "",
      gradeGpa: "",
      description: "",
      institutionUrl: "",
      activities: "",
      isCurrent: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (edu: UserEducation) => {
    setEditingItem(edu);
    setFormData({ ...edu });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const next = educations.filter((e) => e.id !== id);
    onChange(next);
    showToast("Education record removed", "info");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institution.trim() || !formData.degree.trim()) {
      showToast("Please enter the Institution Name and Degree.", "error");
      return;
    }

    const recordToSave: UserEducation = {
      ...formData,
      institution: formData.institution.trim(),
      degree: formData.degree.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim(),
      graduationYear: formData.graduationYear || formData.endDate,
    };

    if (editingItem) {
      const next = educations.map((e) => (e.id === editingItem.id ? recordToSave : e));
      onChange(next);
      showToast("Education updated successfully!", "success");
    } else {
      onChange([recordToSave, ...educations]);
      showToast("Education record added!", "success");
    }

    setModalOpen(false);
  };

  return (
    <>
      <ProfileSectionCard
        title="Education & Academic Degrees"
        subtitle="Your degrees, colleges, certifications, and academic background."
        icon="school"
        isEmpty={educations.length === 0}
        emptyMessage="No education records added yet. Add your academic degrees."
        actionButton={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Education
          </button>
        }
      >
        <div className="space-y-4">
          {educations.map((edu) => (
            <div
              key={edu.id}
              className="p-4 sm:p-5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">school</span>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-sm sm:text-base text-on-surface">
                      {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                    </h3>
                    {edu.gradeGpa && (
                      <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-bold text-[10px] rounded-md">
                        GPA: {edu.gradeGpa}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-primary">{edu.institution}</p>

                  <p className="text-[11px] text-outline font-mono">
                    {edu.startDate ? `${edu.startDate} – ` : ""}
                    {edu.isCurrent ? "In Progress" : edu.endDate || edu.graduationYear || "Completed"}
                  </p>

                  {edu.description && (
                    <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                      {edu.description}
                    </p>
                  )}

                  {edu.activities && (
                    <p className="text-[11px] text-on-surface-variant pt-1 italic">
                      Activities: {edu.activities}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                <button
                  onClick={() => handleOpenEdit(edu)}
                  className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                  title="Edit Education"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(edu.id)}
                  className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Delete Education"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
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
          title={editingItem ? "Edit Education Record" : "Add Education Record"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Institution / University *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stanford University or University of California, Berkeley"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Degree *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Science (B.S.)"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Field of Study
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Software Engineering"
                  value={formData.fieldOfStudy}
                  onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Start Year / Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2019"
                  value={formData.startDate || ""}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Graduation Year / End Date
                </label>
                <input
                  type="text"
                  disabled={formData.isCurrent}
                  placeholder={formData.isCurrent ? "In Progress" : "e.g. 2023"}
                  value={formData.isCurrent ? "In Progress" : formData.endDate || formData.graduationYear || ""}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value, graduationYear: e.target.value })}
                  className={`w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${
                    formData.isCurrent ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Grade / GPA (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3.9 / 4.0"
                  value={formData.gradeGpa || ""}
                  onChange={(e) => setFormData({ ...formData, gradeGpa: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCurrentEdu"
                checked={formData.isCurrent || false}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <label htmlFor="isCurrentEdu" className="font-bold text-on-surface cursor-pointer text-xs">
                Education currently in progress
              </label>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Activities & Societies (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ACM Student Chapter President, Hackathon Organizer"
                value={formData.activities || ""}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Description & Coursework (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Key courses, capstone projects, academic honors..."
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
                Save Education
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
