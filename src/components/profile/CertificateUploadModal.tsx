"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface CertificateRecord {
  id: string;
  name: string;
  category: string;
  issuingAuthority: string;
  credentialId?: string;
  credentialUrl?: string;
  issueDate: string;
  expiryDate?: string;
  noExpiryDate: boolean;
  fileName: string;
  fileType: string;
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "REJECTED";
  verifiedDate?: string;
  verifiedBy?: string;
}

interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCertificateUploaded: (cert: CertificateRecord) => void;
}

export function CertificateUploadModal({
  isOpen,
  onClose,
  onCertificateUploaded,
}: CertificateUploadModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cloud Architecture");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [issueDate, setIssueDate] = useState("2025-06-15");
  const [expiryDate, setExpiryDate] = useState("2028-06-15");
  const [noExpiryDate, setNoExpiryDate] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsUploading(true);
      setUploadProgress(20);
      setTimeout(() => setUploadProgress(60), 200);
      setTimeout(() => {
        setUploadProgress(100);
        setIsUploading(false);
        showToast(`Document file '${file.name}' attached successfully!`, "info");
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !issuingAuthority.trim()) {
      showToast("Please enter the certificate name and issuing authority.", "error");
      return;
    }

    const cert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      name,
      category,
      issuingAuthority,
      credentialId: credentialId.trim() || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
      issueDate,
      expiryDate: noExpiryDate ? undefined : expiryDate,
      noExpiryDate,
      fileName: fileName || `${name.toLowerCase().replace(/\s+/g, "_")}_cert.pdf`,
      fileType: fileName.endsWith(".png") || fileName.endsWith(".jpg") ? "IMAGE" : "PDF",
      status: "PENDING",
    };

    onCertificateUploaded(cert);
    showToast(`Certificate '${name}' submitted for verification! Platform owners notified.`, "success");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Professional Certification">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body-md">
        <p className="text-on-surface-variant text-[11px] leading-relaxed">
          Add verified credentials, degrees, or industry licenses to your profile. Verified certificates earn the <strong>Verified Credential</strong> badge.
        </p>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Certificate Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AWS Certified Solutions Architect - Associate"
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Cloud Architecture">Cloud Architecture & Infrastructure</option>
              <option value="Software Engineering">Software Engineering & Frontend</option>
              <option value="AI & Data Science">AI, Machine Learning & Data</option>
              <option value="Cybersecurity">Cybersecurity & Compliance</option>
              <option value="Agile & Product">Agile, Scrum & Product Management</option>
              <option value="Other Industry License">Other Professional License</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Issuing Authority *
            </label>
            <input
              type="text"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="e.g. Amazon Web Services, Google, PMI"
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Credential ID (Optional)
            </label>
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="e.g. AWS-98471924"
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Verification Badge URL (Optional)
            </label>
            <input
              type="url"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="https://credly.com/badges/..."
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Issue Date *
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              disabled={noExpiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={`w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                noExpiryDate ? "opacity-40 cursor-not-allowed" : ""
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="noExpiry"
            checked={noExpiryDate}
            onChange={(e) => setNoExpiryDate(e.target.checked)}
            className="w-4 h-4 text-primary rounded cursor-pointer"
          />
          <label htmlFor="noExpiry" className="font-bold text-on-surface cursor-pointer text-xs">
            This certificate does not expire
          </label>
        </div>

        {/* File Upload Box */}
        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Attach Document File (PDF, JPG, PNG, WEBP) *
          </label>
          <div className="border-2 border-dashed border-outline-variant/40 hover:border-primary/50 bg-surface-container-low p-4 rounded-2xl text-center space-y-2 cursor-pointer transition-colors relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
            <p className="font-bold text-on-surface text-xs">
              {fileName ? `File selected: ${fileName}` : "Click or drag certificate PDF/Image here"}
            </p>
            <span className="text-[10px] text-outline block">Max file size: 10MB</span>
          </div>

          {isUploading && (
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
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
            <span className="material-symbols-outlined text-base">verified</span>
            Submit Certificate for Verification
          </button>
        </div>
      </form>
    </Modal>
  );
}
