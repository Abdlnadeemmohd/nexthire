"use client";

import React, { useState } from "react";
import { CandidateSkill } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { useToast } from "@/components/ui/Toast";

interface SkillsSectionProps {
  skills: string; // raw comma-separated string for backwards compatibility and fast search
  skillsList?: CandidateSkill[];
  onChange: (rawSkills: string, list: CandidateSkill[]) => void;
}

export function SkillsSection({ skills, skillsList = [], onChange }: SkillsSectionProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<CandidateSkill["category"]>("Technical");
  const [newSkillLevel, setNewSkillLevel] = useState<CandidateSkill["level"]>("Advanced");

  // Derive initial list from props
  const parsedList: CandidateSkill[] = React.useMemo(() => {
    if (skillsList && skillsList.length > 0) return skillsList;
    if (!skills) return [];
    return skills.split(",").map((s, idx) => ({
      id: `skill-${idx}-${s.trim()}`,
      name: s.trim(),
      category: "Technical" as const,
      level: "Advanced" as const,
      isHighlighted: idx < 3,
    })).filter((s) => s.name.length > 0);
  }, [skills, skillsList]);

  const [currentList, setCurrentList] = useState<CandidateSkill[]>(parsedList);

  React.useEffect(() => {
    setCurrentList(parsedList);
  }, [parsedList]);

  const syncChanges = (updatedList: CandidateSkill[]) => {
    setCurrentList(updatedList);
    const rawString = updatedList.map((s) => s.name).join(", ");
    onChange(rawString, updatedList);
  };

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newSkillName.trim();
    if (!cleanName) return;

    if (currentList.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Skill "${cleanName}" already exists in your profile.`, "info");
      return;
    }

    const newSkill: CandidateSkill = {
      id: `skill-${Date.now()}`,
      name: cleanName,
      category: newSkillCategory,
      level: newSkillLevel,
      isHighlighted: currentList.length < 3,
    };

    const next = [...currentList, newSkill];
    syncChanges(next);
    setNewSkillName("");
    showToast(`Added skill "${cleanName}"`, "success");
  };

  const handleRemoveSkill = (id: string) => {
    const next = currentList.filter((s) => s.id !== id);
    syncChanges(next);
  };

  const handleToggleHighlight = (id: string) => {
    const next = currentList.map((s) => (s.id === id ? { ...s, isHighlighted: !s.isHighlighted } : s));
    syncChanges(next);
  };

  const categories: CandidateSkill["category"][] = ["Technical", "Business", "Tools", "Domain"];

  return (
    <ProfileSectionCard
      title="Skills & Technologies"
      subtitle="Organized, searchable skill graph used by NextHire AI candidate ranking."
      icon="bolt"
      isEmpty={currentList.length === 0}
      emptyMessage="No skills added yet. Add your core technical and business competencies."
      actionButton={
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3.5 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
            isEditing
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-primary/10 hover:bg-primary/20 text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{isEditing ? "check" : "edit"}</span>
          {isEditing ? "Done Editing" : "Manage Skills"}
        </button>
      }
    >
      <div className="space-y-5">
        {/* Interactive Add Skill Bar in Edit Mode */}
        {isEditing && (
          <form
            onSubmit={handleAddSkill}
            className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Type skill name (e.g. Next.js, Distributed Systems, Figma, Python)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="flex-1 p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value as any)}
                className="p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Technical">Technical</option>
                <option value="Tools">Tools / Infra</option>
                <option value="Business">Business / Product</option>
                <option value="Domain">Domain Knowledge</option>
              </select>

              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as any)}
                className="p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Expert">Expert</option>
                <option value="Advanced">Advanced</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Beginner">Beginner</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-1 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
            <p className="text-[11px] text-outline">
              ⭐ Tip: Click the star icon next to a skill to highlight it as a primary skill on your profile card.
            </p>
          </form>
        )}

        {/* Categorized Skills Grid */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const catSkills = currentList.filter((s) => (s.category || "Technical") === cat);
            if (catSkills.length === 0 && !isEditing) return null;

            return (
              <div key={cat} className="space-y-2">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                  {cat === "Technical" ? "Core Technical Stack" : cat === "Tools" ? "Tools & Frameworks" : cat === "Business" ? "Leadership & Business" : "Domain Expertise"}
                </span>

                {catSkills.length === 0 ? (
                  <p className="text-xs text-outline italic">No {cat.toLowerCase()} skills added.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          skill.isHighlighted
                            ? "bg-primary-container/15 text-primary border-primary/40 shadow-2xs"
                            : "bg-surface-container-low text-on-surface border-outline-variant/30 hover:border-primary/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleHighlight(skill.id)}
                          className="text-amber-500 hover:scale-110 transition-transform"
                          title={skill.isHighlighted ? "Highlighted Primary Skill" : "Click to highlight skill"}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {skill.isHighlighted ? "star" : "star_outline"}
                          </span>
                        </button>

                        <span>{skill.name}</span>

                        {skill.level && (
                          <span className="text-[10px] text-outline font-normal">
                            ({skill.level})
                          </span>
                        )}

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="ml-1 text-outline hover:text-error transition-colors p-0.5 rounded"
                            title="Remove Skill"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ProfileSectionCard>
  );
}
