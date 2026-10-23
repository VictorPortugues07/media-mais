"use client";

import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

// Contador global para rastrear modais abertos simultaneamente e manter scroll lock estável
let activeModalsCount = 0;

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;

    activeModalsCount++;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      // Só restaura a rolagem se não houver mais nenhum modal aberto
      if (activeModalsCount === 0 && typeof document !== "undefined") {
        document.body.style.overflow = "unset";
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A1240]/45 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl ring-1 ring-[#0E1F66]/[0.06] overflow-hidden z-10 animate-fade-in max-h-[90vh] overflow-y-auto",
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#EEF0F3]">
          <div>
            {title && (
              <h3 id={titleId} className="text-base font-semibold text-[#0E1F66] font-heading">
                {title}
              </h3>
            )}
            {description && (
              <p id={descId} className="text-xs text-[#9AA3AF] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1 rounded-lg text-[#9AA3AF] hover:text-[#0E1F66] hover:bg-[#F7F8FA] transition cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
