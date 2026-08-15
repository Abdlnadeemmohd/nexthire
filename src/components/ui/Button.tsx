"use client";

import React, { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-label-md font-bold rounded-xl transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target";

    const variantClasses = {
      primary:
        "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active shadow-xs border border-transparent",
      secondary:
        "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/40 shadow-xs",
      outline:
        "bg-transparent text-on-surface hover:text-primary hover:border-primary border border-outline-variant/60",
      ghost:
        "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border border-transparent",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-transparent",
      success:
        "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-xs border border-transparent",
    }[variant];

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg min-h-[36px]",
      md: "px-4 py-2 text-xs sm:text-sm gap-2 rounded-xl min-h-[44px]",
      lg: "px-6 py-3 text-sm sm:text-base gap-2.5 rounded-2xl min-h-[48px]",
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"
              aria-hidden="true"
            />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
