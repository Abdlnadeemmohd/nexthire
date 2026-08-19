"use client";

import React, { useState, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  label?: string;
  shape?: "circle" | "rounded" | "square";
  size?: "sm" | "md" | "lg";
  fallbackInitial?: string;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  currentImageUrl,
  onImageChange,
  label = "Upload Image",
  shape = "circle",
  size = "md",
  fallbackInitial = "N",
  disabled = false,
}: ImageUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const sizeClasses = {
    sm: "w-16 h-16 sm:w-20 sm:h-20",
    md: "w-24 h-24 sm:w-28 sm:h-28",
    lg: "w-32 h-32 sm:w-36 sm:h-36",
  }[size];

  const shapeClasses = {
    circle: "rounded-full",
    rounded: "rounded-3xl",
    square: "rounded-2xl",
  }[shape];

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // 1. Client-Side Size Validation
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast("File size exceeds 5MB limit. Please choose a smaller image.", "error");
      return;
    }

    // 2. MIME Type Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showToast("Unsupported format. Please upload a PNG, JPEG, or WEBP image.", "error");
      return;
    }

    setUploading(true);
    showToast("Processing and uploading image...", "info");

    try {
      // 3. Request Cloudinary Upload Signature from Server
      const signRes = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: file.type }),
      });

      const signData = await signRes.json();

      let uploadedUrl: string;

      if (signRes.ok && signData.success && signData.uploadUrl) {
        // Direct Cloudinary Upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signData.apiKey);
        formData.append("timestamp", signData.timestamp.toString());
        formData.append("signature", signData.signature);
        formData.append("folder", signData.folder);
        if (signData.type) formData.append("type", signData.type);

        const cloudRes = await fetch(signData.uploadUrl, {
          method: "POST",
          body: formData,
        });

        const cloudData = await cloudRes.json();
        if (!cloudRes.ok || !cloudData.secure_url) {
          throw new Error(cloudData.error?.message || "Cloud upload failed");
        }
        uploadedUrl = cloudData.secure_url;
      } else {
        // Safe Data-URL Fallback if Cloudinary is unconfigured
        uploadedUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(file);
        });
      }

      setPreviewUrl(uploadedUrl);
      onImageChange(uploadedUrl);
      showToast("Image uploaded successfully!", "success");
    } catch (err: any) {
      console.error("[ImageUpload Error]:", err);
      showToast(err.message || "Failed to upload image. Please try again.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageChange(null);
    showToast("Image removed", "info");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {label && <label className="block font-bold text-outline uppercase text-[10px] pb-0.5">{label}</label>}

      <div className="flex items-center gap-4 flex-wrap">
        {/* Visual Preview / Avatar Box */}
        <div className={`relative ${sizeClasses} ${shapeClasses} overflow-hidden border-2 border-outline-variant/30 bg-surface-container-low shadow-sm flex-shrink-0 flex items-center justify-center`}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display font-bold text-2xl text-primary/70">
              {fallbackInitial.charAt(0).toUpperCase()}
            </span>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl animate-spin">
                progress_activity
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelected}
            className="hidden"
            disabled={disabled || uploading}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 touch-target"
            >
              <span className="material-symbols-outlined text-sm text-primary">
                {previewUrl ? "change_circle" : "upload"}
              </span>
              {previewUrl ? "Replace Image" : "Upload Image"}
            </button>

            {previewUrl && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemove}
                className="px-3 py-1.5 border border-error/30 hover:bg-error/10 text-error font-bold text-xs rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 touch-target"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Remove
              </button>
            )}
          </div>

          <p className="text-[10px] text-outline font-medium">
            PNG, JPEG, or WEBP • Maximum 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
