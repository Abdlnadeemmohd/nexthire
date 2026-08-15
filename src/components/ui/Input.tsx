"use client";

import React, { forwardRef } from "react";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-label-md font-bold text-on-surface-variant uppercase tracking-wider"
        >
          {label} {required && <span className="text-error font-bold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-error font-medium flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-sm flex-shrink-0" aria-hidden="true">
            error
          </span>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-outline mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 text-outline flex items-center pointer-events-none" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={hasError}
          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-surface-container-lowest border rounded-xl text-on-surface placeholder:text-outline transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-surface-container-low disabled:cursor-not-allowed ${
            leftIcon ? "pl-10" : ""
          } ${rightIcon ? "pr-10" : ""} ${
            hasError
              ? "border-error focus:ring-error text-error"
              : "border-outline-variant/60 hover:border-outline focus:border-primary focus:ring-primary"
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-outline flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", id, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <textarea
        ref={ref}
        id={id}
        aria-invalid={hasError}
        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-surface-container-lowest border rounded-xl text-on-surface placeholder:text-outline transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-surface-container-low disabled:cursor-not-allowed ${
          hasError
            ? "border-error focus:ring-error text-error"
            : "border-outline-variant/60 hover:border-outline focus:border-primary focus:ring-primary"
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
