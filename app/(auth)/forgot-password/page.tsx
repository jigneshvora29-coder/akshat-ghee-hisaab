"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Elements */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, padding: "48px 24px" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.2)",
            }}
          >
            <span style={{ color: "#FFFFFF", fontSize: "1.5rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              AG
            </span>
          </motion.div>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A" }}>
            Akshat Ghee
          </h1>
          <p style={{ marginTop: "4px", fontSize: "0.875rem", color: "#64748B", fontWeight: 500 }}>
            Hisaab Management System
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            maxWidth: "420px",
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: "20px",
            padding: "36px 32px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle style={{ width: "56px", height: "56px", color: "#059669", margin: "0 auto 16px" }} />
              </motion.div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
                Check your email
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#64748B", marginBottom: "24px", lineHeight: 1.6 }}>
                If an account with that email exists, we&apos;ve sent password reset instructions.
              </p>
              <button
                onClick={() => router.push("/login")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#4F46E5",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft style={{ width: "14px", height: "14px" }} /> Back to Login
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A" }}>
                  Forgot Password
                </h2>
                <p style={{ fontSize: "0.875rem", color: "#94A3B8", marginTop: "6px" }}>
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94A3B8" }} />
                    <input
                      {...register("email")}
                      type="email"
                      autoFocus
                      disabled={isSubmitting}
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: "12px",
                        border: errors.email ? "1.5px solid #DC2626" : "1.5px solid #E2E8F0",
                        background: "#FFFFFF",
                        fontSize: "0.875rem",
                        color: "#0F172A",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        if (!errors.email) {
                          e.target.style.borderColor = "#4F46E5";
                          e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)";
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.email) {
                          e.target.style.borderColor = "#E2E8F0";
                          e.target.style.boxShadow = "none";
                        }
                      }}
                      placeholder="admin@akshatghee.com"
                    />
                  </div>
                  {errors.email && (
                    <p style={{ marginTop: "6px", fontSize: "0.8125rem", color: "#DC2626", fontWeight: 500 }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: isSubmitting ? "#6366F1" : "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    fontSize: "0.9375rem",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSubmitting ? "none" : "0 4px 12px rgba(79, 70, 229, 0.25)",
                    opacity: isSubmitting ? 0.8 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ width: "18px", height: "18px", animation: "spin 0.7s linear infinite" }} />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#4F46E5",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft style={{ width: "14px", height: "14px" }} /> Back to Login
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
