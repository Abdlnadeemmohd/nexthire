"use client";

import React, { useState } from "react";
import { CandidateVolunteer, CandidateCourse } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface VolunteerAndCoursesSectionProps {
  volunteer: CandidateVolunteer[];
  courses: CandidateCourse[];
  onVolunteerChange: (updated: CandidateVolunteer[]) => void;
  onCoursesChange: (updated: CandidateCourse[]) => void;
}

export function VolunteerAndCoursesSection({
  volunteer,
  courses,
  onVolunteerChange,
  onCoursesChange,
}: VolunteerAndCoursesSectionProps) {
  const { showToast } = useToast();
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  const [volForm, setVolForm] = useState<CandidateVolunteer>({
    id: "",
    organization: "",
    role: "",
    cause: "Technology & Education",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const [courseForm, setCourseForm] = useState<CandidateCourse>({
    id: "",
    title: "",
    name: "",
    institution: "",
    completionDate: "",
    url: "",
    description: "",
  });

  // Volunteer Handlers
  const handleSaveVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volForm.organization.trim() || !volForm.role.trim()) {
      showToast("Please enter an Organization and Role.", "error");
      return;
    }

    const newVol: CandidateVolunteer = {
      ...volForm,
      id: volForm.id || `vol-${Date.now()}`,
      organization: volForm.organization.trim(),
      role: volForm.role.trim(),
      cause: volForm.cause?.trim() || undefined,
      description: volForm.description?.trim() || undefined,
    };

    if (volForm.id) {
      onVolunteerChange(volunteer.map((v) => (v.id === volForm.id ? newVol : v)));
      showToast("Volunteer experience updated!", "success");
    } else {
      onVolunteerChange([...volunteer, newVol]);
      showToast("Volunteer experience added!", "success");
    }

    setVolModalOpen(false);
  };

  const handleDeleteVolunteer = (id: string) => {
    onVolunteerChange(volunteer.filter((v) => v.id !== id));
    showToast("Volunteer entry removed", "info");
  };

  // Course Handlers
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const courseTitle = (courseForm.name || courseForm.title || "").trim();
    if (!courseTitle) {
      showToast("Please enter Course Name.", "error");
      return;
    }

    const newCourse: CandidateCourse = {
      ...courseForm,
      id: courseForm.id || `course-${Date.now()}`,
      title: courseTitle,
      name: courseTitle,
      institution: courseForm.institution?.trim() || undefined,
      url: courseForm.url?.trim() || undefined,
      description: courseForm.description?.trim() || undefined,
    };

    if (courseForm.id) {
      onCoursesChange(courses.map((c) => (c.id === courseForm.id ? newCourse : c)));
      showToast("Course updated!", "success");
    } else {
      onCoursesChange([...courses, newCourse]);
      showToast("Course added to profile!", "success");
    }

    setCourseModalOpen(false);
  };

  const handleDeleteCourse = (id: string) => {
    onCoursesChange(courses.filter((c) => c.id !== id));
    showToast("Course removed", "info");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Volunteer Experience Card */}
      <ProfileSectionCard
        title="Volunteer & Community"
        subtitle="Causes, non-profit contributions, and mentorship."
        icon="volunteer_activism"
        isEmpty={volunteer.length === 0}
        emptyMessage="No volunteer activities added yet."
        actionButton={
          <button
            onClick={() => {
              setVolForm({
                id: "",
                organization: "",
                role: "",
                cause: "Technology & Education",
                startDate: "",
                endDate: "",
                isCurrent: false,
                description: "",
              });
              setVolModalOpen(true);
            }}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Volunteer
          </button>
        }
      >
        <div className="space-y-3">
          {volunteer.map((vol) => (
            <div
              key={vol.id}
              className="p-3.5 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-on-surface">{vol.role}</h4>
                <p className="text-[11px] text-primary font-semibold">
                  {vol.organization} {vol.cause ? `• ${vol.cause}` : ""}
                </p>
                {vol.startDate && (
                  <p className="text-[10px] text-outline font-mono">
                    {vol.startDate} – {vol.isCurrent ? "Present" : vol.endDate || "Present"}
                  </p>
                )}
                {vol.description && (
                  <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                    {vol.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDeleteVolunteer(vol.id)}
                className="p-1 text-outline hover:text-error rounded-lg flex-shrink-0"
                title="Remove Volunteer"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {/* Courses & Training Card */}
      <ProfileSectionCard
        title="Courses & Specialized Training"
        subtitle="Completed bootcamps, executive programs, and online courses."
        icon="menu_book"
        isEmpty={courses.length === 0}
        emptyMessage="No courses or training added yet."
        actionButton={
          <button
            onClick={() => {
              setCourseForm({
                id: "",
                title: "",
                name: "",
                institution: "",
                completionDate: "",
                url: "",
                description: "",
              });
              setCourseModalOpen(true);
            }}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Course
          </button>
        }
      >
        <div className="space-y-3">
          {courses.map((c) => (
            <div
              key={c.id}
              className="p-3.5 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-on-surface">{c.name}</h4>
                {c.institution && <p className="text-[11px] text-primary font-semibold">{c.institution}</p>}
                {c.completionDate && <p className="text-[10px] text-outline font-mono">{c.completionDate}</p>}
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline font-bold inline-flex items-center gap-0.5 pt-0.5"
                  >
                    Course Credential
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => handleDeleteCourse(c.id)}
                className="p-1 text-outline hover:text-error rounded-lg flex-shrink-0"
                title="Remove Course"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      </ProfileSectionCard>

      {/* Volunteer Modal */}
      {volModalOpen && (
        <Modal isOpen={volModalOpen} onClose={() => setVolModalOpen(false)} title="Add Volunteer Experience">
          <form onSubmit={handleSaveVolunteer} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Role / Position *</label>
              <input
                type="text"
                required
                placeholder="e.g. Volunteer Coding Instructor / Mentor"
                value={volForm.role}
                onChange={(e) => setVolForm({ ...volForm, role: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code.org, Local Food Bank"
                  value={volForm.organization}
                  onChange={(e) => setVolForm({ ...volForm, organization: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Cause / Focus Area</label>
                <input
                  type="text"
                  placeholder="e.g. STEM Education, Economic Empowerment"
                  value={volForm.cause || ""}
                  onChange={(e) => setVolForm({ ...volForm, cause: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Start Date</label>
                <input
                  type="text"
                  placeholder="e.g. 2022"
                  value={volForm.startDate || ""}
                  onChange={(e) => setVolForm({ ...volForm, startDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">End Date</label>
                <input
                  type="text"
                  placeholder="e.g. Present"
                  value={volForm.endDate || ""}
                  onChange={(e) => setVolForm({ ...volForm, endDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Details about your volunteer contributions..."
                value={volForm.description || ""}
                onChange={(e) => setVolForm({ ...volForm, description: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVolModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
              >
                Save Volunteer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Course Modal */}
      {courseModalOpen && (
        <Modal isOpen={courseModalOpen} onClose={() => setCourseModalOpen(false)} title="Add Course or Program">
          <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Course Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Systems Architecture & Consensus"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Institution / Platform</label>
                <input
                  type="text"
                  placeholder="e.g. MIT OpenCourseWare, Coursera, Stanford Online"
                  value={courseForm.institution || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, institution: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Completion Date</label>
                <input
                  type="date"
                  value={courseForm.completionDate || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, completionDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">Course / Certificate URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={courseForm.url || ""}
                onChange={(e) => setCourseForm({ ...courseForm, url: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCourseModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
              >
                Save Course
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
