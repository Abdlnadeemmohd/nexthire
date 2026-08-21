"use client";

import React, { useState } from "react";
import { UserCertification } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface CertificationsSectionProps {
  certifications: UserCertification[];
  onChange: (updated: UserCertification[]) => void;
}

export function CertificationsSection({ certifications, onChange }: CertificationsSectionProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserCertification | null>(null);

  const [formData, setFormData] = useState<UserCertification>({
    id: "",
    name: "",
    issuer: "",
    category: "Cloud & DevOps",
    issueDate: "",
    expiryDate: "",
    noExpiryDate: false,
    credentialId: "",
    verificationLink: "",
    certificateFileUrl: "",
    status: "PENDING",
    description: "",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `cert-${Date.now()}`,
      name: "",
      issuer: "",
      category: "Cloud & DevOps",
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      noExpiryDate: true,
      credentialId: "",
      verificationLink: "",
      certificateFileUrl: "",
      status: "PENDING",
      description: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cert: UserCertification) => {
    setEditingItem(cert);
    setFormData({ ...cert });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const next = certifications.filter((c) => c.id !== id);
    onChange(next);
    showToast("Certification removed", "info");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.issuer.trim() || !formData.issueDate.trim()) {
      showToast("Please enter Certificate Name, Issuing Organization, and Issue Date.", "error");
      return;
    }

    const recordToSave: UserCertification = {
      ...formData,
      name: formData.name.trim(),
      issuer: formData.issuer.trim(),
      credentialId: formData.credentialId?.trim() || undefined,
      verificationLink: formData.verificationLink?.trim() || undefined,
      expiryDate: formData.noExpiryDate ? undefined : formData.expiryDate,
    };

    if (editingItem) {
      const next = certifications.map((c) => (c.id === editingItem.id ? recordToSave : c));
      onChange(next);
      showToast("Certification updated successfully!", "success");
    } else {
      onChange([recordToSave, ...certifications]);
      showToast("Certification added to your profile!", "success");
    }

    setModalOpen(false);
  };

  return (
    <>
      <ProfileSectionCard
        title="Certifications & Licenses"
        subtitle="Verified professional certifications, vendor licenses, and credentials."
        icon="verified_user"
        isEmpty={certifications.length === 0}
        emptyMessage="No certifications added yet. Showcase your verified industry credentials."
        actionButton={
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Certification
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-4 sm:p-5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-on-surface">
                    {cert.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 font-bold text-[10px] rounded-md flex-shrink-0 ${
                      cert.status === "VERIFIED"
                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                        : cert.status === "PENDING"
                        ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                        : "bg-surface-container-high text-outline border border-outline-variant/30"
                    }`}
                  >
                    {cert.status === "VERIFIED" ? "✓ VERIFIED" : "PENDING REVIEW"}
                  </span>
                </div>

                <p className="text-xs font-bold text-primary">{cert.issuer}</p>

                <p className="text-[11px] text-outline font-mono">
                  Issued: {cert.issueDate} {cert.noExpiryDate ? "• No Expiration" : cert.expiryDate ? `• Expires: ${cert.expiryDate}` : ""}
                </p>

                {cert.credentialId && (
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    Credential ID: <span className="font-bold">{cert.credentialId}</span>
                  </p>
                )}

                {cert.description && (
                  <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                    {cert.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between">
                {cert.verificationLink ? (
                  <a
                    href={cert.verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    Verify Credential
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-outline">Self-Reported</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cert)}
                    className="p-1.5 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                    title="Edit Certification"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Delete Certification"
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
          title={editingItem ? "Edit Certification" : "Add Professional Certification"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Certification Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AWS Certified Solutions Architect - Associate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services, Google, Microsoft, Scrum.org"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Category
                </label>
                <select
                  value={formData.category || "Cloud & DevOps"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Cloud & DevOps">Cloud & Infrastructure</option>
                  <option value="Software Engineering">Software Engineering & Frontend</option>
                  <option value="AI & Data Science">AI & Machine Learning</option>
                  <option value="Cybersecurity">Cybersecurity & Security</option>
                  <option value="Project Management">Agile, Scrum & Leadership</option>
                  <option value="Other">Other Professional License</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Issue Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  disabled={formData.noExpiryDate}
                  value={formData.expiryDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className={`w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${
                    formData.noExpiryDate ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="noExpiryCert"
                checked={formData.noExpiryDate || false}
                onChange={(e) => setFormData({ ...formData, noExpiryDate: e.target.checked })}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <label htmlFor="noExpiryCert" className="font-bold text-on-surface cursor-pointer text-xs">
                This credential does not expire
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Credential ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS-PSA-104928"
                  value={formData.credentialId || ""}
                  onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Credential Verification URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://credly.com/badges/..."
                  value={formData.verificationLink || ""}
                  onChange={(e) => setFormData({ ...formData, verificationLink: e.target.value })}
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
                Save Certification
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
