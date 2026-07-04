"use client";
// Force Webpack re-evaluation to pick up renamed auth-client.tsx

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu,
  Search,
  LogOut,
  User,
  ChevronDown,
  Command,
  Loader2,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface TopNavProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
  onSearchOpen: () => void;
}

export function TopNav({
  onMenuClick,
  sidebarCollapsed,
  onSearchOpen,
}: TopNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  }, [router]);

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <>
    {isPending && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white"
      }}>
        <Loader2 style={{ width: "48px", height: "48px", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Logging out...</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>Please wait a moment</p>
      </div>
    )}
    <motion.header
      animate={{ left: sidebarWidth }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 30,
        height: "64px",
        background: "#FFFFFF",
        alignItems: "center",
        padding: "0 20px",
        gap: "16px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        left: sidebarWidth,
      }}
      className="hidden lg:flex"
    >
      {/* Search */}
      <button
        onClick={onSearchOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          borderRadius: "12px",
          background: "#F8FAFC",
          border: "1.5px solid #F1F5F9",
          color: "#94A3B8",
          fontSize: "0.875rem",
          cursor: "pointer",
          flex: 1,
          maxWidth: "400px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#E2E8F0";
          e.currentTarget.style.background = "#F1F5F9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#F1F5F9";
          e.currentTarget.style.background = "#F8FAFC";
        }}
        aria-label="Open search"
      >
        <Search style={{ width: "16px", height: "16px", flexShrink: 0 }} />
        <span className="hidden sm:block">Search customers, transactions...</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
          <kbd
            style={{
              fontSize: "0.6875rem",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "4px",
              padding: "1px 6px",
              fontFamily: "monospace",
              color: "#94A3B8",
            }}
          >
            <Command style={{ width: "12px", height: "12px", display: "inline" }} />
          </kbd>
          <kbd
            style={{
              fontSize: "0.6875rem",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "4px",
              padding: "1px 6px",
              fontFamily: "monospace",
              color: "#94A3B8",
            }}
          >
            K
          </kbd>
        </div>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
        {/* User menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #C7D2FE",
              }}
            >
              <span style={{ color: "#4F46E5", fontSize: "0.75rem", fontWeight: 700 }}>
                {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
            <span
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}
              className="hidden sm:block"
            >
              {session?.user?.name || "Admin"}
            </span>
            <ChevronDown style={{ width: "14px", height: "14px", color: "#94A3B8" }} />
          </button>

          {userMenuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "4px",
                  width: "200px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
                  zIndex: 20,
                  padding: "4px",
                  animation: "scaleIn 0.15s ease",
                }}
              >
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>
                    {session?.user?.name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session?.user?.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    fontSize: "0.875rem",
                    color: "#334155",
                    textDecoration: "none",
                    borderRadius: "10px",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <User style={{ width: "16px", height: "16px" }} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    startTransition(() => handleLogout());
                  }}
                  disabled={isPending}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    fontSize: "0.875rem",
                    color: "#DC2626",
                    background: "none",
                    border: "none",
                    borderRadius: "10px",
                    cursor: isPending ? "not-allowed" : "pointer",
                    transition: "background 0.15s ease",
                    opacity: isPending ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = "#FEF2F2"; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {isPending ? (
                    <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} />
                  ) : (
                    <LogOut style={{ width: "16px", height: "16px" }} />
                  )}
                  {isPending ? "Logging out..." : "Logout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.header>
    </>
  );
}

// Mobile TopNav
export function MobileTopNav({
  onSearchOpen,
}: {
  onSearchOpen: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  }, [router]);

  return (
    <>
    {isPending && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white"
      }}>
        <Loader2 style={{ width: "48px", height: "48px", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Logging out...</h2>
      </div>
    )}
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: "56px",
        background: "#FFFFFF",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
      className="flex lg:hidden"
    >
      {/* User Avatar */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #C7D2FE",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "#4F46E5", fontSize: "0.875rem", fontWeight: 700 }}>
            {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
          </span>
        </button>

        {userMenuOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 10 }}
              onClick={() => setUserMenuOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "100%",
                marginTop: "8px",
                width: "200px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                zIndex: 20,
                padding: "4px",
              }}
            >
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>
                  {session?.user?.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session?.user?.email}
                </p>
              </div>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  fontSize: "0.875rem",
                  color: "#334155",
                  textDecoration: "none",
                  borderRadius: "10px",
                }}
              >
                <User style={{ width: "16px", height: "16px" }} />
                Settings
              </Link>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  startTransition(() => handleLogout());
                }}
                disabled={isPending}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  fontSize: "0.875rem",
                  color: "#DC2626",
                  background: "none",
                  border: "none",
                  borderRadius: "10px",
                  cursor: isPending ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                {isPending ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <LogOut style={{ width: "16px", height: "16px" }} />}
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #4F46E5, #6366F1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#FFFFFF", fontSize: "0.6875rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>AG</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A", fontFamily: "'Outfit', sans-serif" }}>
          Akshat Ghee
        </span>
      </div>

      <button
        onClick={onSearchOpen}
        style={{
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94A3B8",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        aria-label="Search"
      >
        <Search style={{ width: "20px", height: "20px" }} />
      </button>
    </header>
    </>
  );
}
