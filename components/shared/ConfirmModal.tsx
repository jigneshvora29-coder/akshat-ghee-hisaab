"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  variant?: "danger" | "primary" | string;
}

export function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          background: "#FFFFFF",
          borderRadius: "20px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 24px 0 24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: isDestructive ? "#FEF2F2" : "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <AlertTriangle
              style={{
                width: "24px",
                height: "24px",
                color: isDestructive ? "#DC2626" : "#4F46E5",
              }}
            />
          </div>
          <h3
            style={{
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "1.25rem",
              marginBottom: "8px",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              color: "#64748B",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            {message}
          </p>
        </div>
        <div
          style={{
            background: "#F8FAFC",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#475569",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              background: isDestructive ? "#DC2626" : "#4F46E5",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDestructive
                ? "#B91C1C"
                : "#4338CA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDestructive
                ? "#DC2626"
                : "#4F46E5";
            }}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
