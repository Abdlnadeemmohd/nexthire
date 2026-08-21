"use client";

import React, { useState } from "react";
import { CandidateProject } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface ProjectsSectionProps {
  projects: CandidateProject[];
  onChange: (updated: CandidateProject[]) => void;
}

export function ProjectsSection({ projects, onChange }: ProjectsSectionProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateProject | null>(null);

  const [formData, setFormData] = useState<CandidateProject>({
    id: "",
    title: "",
    role: "",
    description: "",
    techStack: [],
    startDate: "",
    endDate: "",
    isCurrent: false,
    projectUrl: "",
    githubUrl: "",
    demoUrl: "",
    imageUrl: "",
    companyName: "",
  });

  const [techInput, setTechInput] = useState("");

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `proj-${Date.now()}`,
      title: "",
      role: "",
      description: "",
      techStack: [],
      startDate: "",
      endDate: "",
      isCurrent: false,
      projectUrl: "",
      githubUrl: "",
      demoUrl: "",
      imageUrl: "",
      companyName: "",
    });
    setTechInput("");
    setModalOpen(true);
  };

  const handleOpenEdit = (proj: CandidateProject) => {
    setEditingItem(proj);
    setFormData({ ...proj });
    setTechInput(proj.techStack?.join(", ") || "");
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const next = projects.filter((p) => p.id !== id);
    onChange(next);
    showToast("Project removed", "info");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast("Please enter Project Title and Description.", "error");
      return;
    }

    const techArray = techInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const recordToSave: CandidateProject = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      techStack: techArray,
      projectUrl: formData.projectUrl?.trim() || undefined,
      githubUrl: formData.githubUrl?.trim() || undefined,
      demoUrl: formData.demoUrl?.trim() || undefined,
    };

    if (editingItem) {
      const next = projects.map((p) => (p.id === editingItem.id ? recordToSave : p));
      onChange(next);
      showToast("Project updated successfully!", "success");
    } else {
      onChange([recordToSave, ...projects]);
      showToast("Project added to your portfolio!", "success");
    }

    setModalOpen(false);
  };

  return (
    <>
      <ProfileSectionCard
        title="Featured Projects & Code"
        subtitle="Open source repositories, commercial products, applications, and technical architectures."
        icon="code_blocks"
        isEmpty={projects.length === 0}
        emptyMessage="No projects added yet. Showcase apps, open-source work, and architectures you've built."
        actionButton={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Project
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-on-surface">
                      {proj.title}
                    </h3>
                    {proj.role && (
                      <p className="text-xs font-bold text-primary pt-0.5">
                        Role: {proj.role} {proj.companyName ? `@ ${proj.companyName}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                      title="Edit Project"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {proj.startDate && (
                  <p className="text-[11px] text-outline font-mono">
                    {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                  </p>
                )}

                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-surface-container-high text-on-surface text-[10px] font-semibold rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Links Toolbar */}
              <div className="pt-3 border-t border-outline-variant/15 flex items-center gap-3 flex-wrap text-xs">
                {proj.demoUrl && (
                  <a
                    href={proj.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Live Demo
                  </a>
                )}
                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface font-bold hover:text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">code</span>
                    GitHub Repo
                  </a>
                )}
                {proj.projectUrl && !proj.demoUrl && (
                  <a
                    href={proj.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-outline hover:text-on-surface font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    Project Link
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? "Edit Project" : "Add Featured Project"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Task Queue & AI Analytics Engine"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Your Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Architect, Creator"
                  value={formData.role || ""}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Associated Organization / Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal Project or Acme Corp"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Project Description & Impact *
              </label>
              <textarea
                rows={3}
                required
                placeholder="What did you build? What challenges did you overcome, and what measurable impact did it achieve?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Technologies & Tools Used (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Next.js, Go, Redis, Docker, TailwindCSS"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Live Demo / App URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://myapp.vercel.app"
                  value={formData.demoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={formData.githubUrl || ""}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
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
                Save Project
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
