"use client";
// Force Webpack re-evaluation to pick up renamed auth-client.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, rememberMe: data.rememberMe }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Invalid credentials");
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
      {/* Decorative Background Elements */}
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
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
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
            <span
              style={{
                color: "#FFFFFF",
                fontSize: "1.5rem",
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              AG
            </span>
          </motion.div>
          <h1
            className="font-display"
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.02em",
            }}
          >
            Akshat Ghee
          </h1>
          <p
            style={{
              marginTop: "4px",
              fontSize: "0.875rem",
              color: "#64748B",
              fontWeight: 500,
            }}
          >
            Hisaab Management System
          </p>
        </div>

        {/* Login Card */}
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
          <div style={{ marginBottom: "28px" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.01em",
              }}
            >
              Sign in to your account
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#94A3B8",
                marginTop: "6px",
              }}
            >
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...register("email")}
                style={{
                  width: "100%",
                  padding: "11px 14px",
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
                placeholder="you@example.com"
              />
              {errors.email && (
                <p style={{ marginTop: "6px", fontSize: "0.8125rem", color: "#DC2626", fontWeight: 500 }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  style={{
                    fontSize: "0.8125rem",
                    color: "#4F46E5",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#4338CA")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#4F46E5")}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register("password")}
                  style={{
                    width: "100%",
                    padding: "11px 44px 11px 14px",
                    borderRadius: "12px",
                    border: errors.password ? "1.5px solid #DC2626" : "1.5px solid #E2E8F0",
                    background: "#FFFFFF",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = "#4F46E5";
                      e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = "#E2E8F0";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#64748B")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                >
                  {showPassword ? <EyeOff style={{ width: "18px", height: "18px" }} /> : <Eye style={{ width: "18px", height: "18px" }} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ marginTop: "6px", fontSize: "0.8125rem", color: "#DC2626", fontWeight: 500 }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                id="rememberMe"
                type="checkbox"
                disabled={isLoading}
                {...register("rememberMe")}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  accentColor: "#4F46E5",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  fontSize: "0.875rem",
                  color: "#475569",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: isLoading ? "#6366F1" : "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",
                fontSize: "0.9375rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: isLoading ? "none" : "0 4px 12px rgba(79, 70, 229, 0.25)",
                opacity: isLoading ? 0.8 : 1,
                marginTop: "4px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 70, 229, 0.3)";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.25)";
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: "18px", height: "18px", animation: "spin 0.7s linear infinite" }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn style={{ width: "18px", height: "18px" }} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "0.8125rem",
            marginTop: "32px",
          }}
        >
          © {new Date().getFullYear()} Akshat Ghee. All rights reserved.
        </p>
      </div>
    </div>
  );
}
