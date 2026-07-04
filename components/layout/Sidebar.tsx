"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Items", href: "/items", icon: Package },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [savedPaths, setSavedPaths] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadedPaths: Record<string, string> = {};
    navItems.forEach(item => {
      const saved = sessionStorage.getItem(`last_path_${item.href}`);
      if (saved) loadedPaths[item.href] = saved;
    });
    setSavedPaths(loadedPaths);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const matchingItem = navItems.find(item => 
      item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
    );
    
    if (matchingItem) {
      setSavedPaths(prev => {
        if (prev[matchingItem.href] === pathname) return prev;
        return { ...prev, [matchingItem.href]: pathname };
      });
      sessionStorage.setItem(`last_path_${matchingItem.href}`, pathname);
    }
  }, [pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: collapsed ? "20px 12px" : "20px 16px",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", minWidth: 0 }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
            }}
          >
            <span style={{ color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              AG
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                style={{ minWidth: 0 }}
              >
                <p style={{ color: "#0F172A", fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.2, fontFamily: "'Outfit', sans-serif" }}>
                  Akshat Ghee
                </p>
                <p style={{ color: "#94A3B8", fontSize: "0.75rem", lineHeight: 1.2 }}>Hisaab</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          
          const targetHref = isActive ? item.href : (savedPaths[item.href] || item.href);

          return (
            <Link
              key={item.href}
              href={targetHref}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: collapsed ? "10px 12px" : "10px 14px",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.15s ease",
                position: "relative",
                background: isActive ? "#EEF2FF" : "transparent",
                color: isActive ? "#4F46E5" : "#64748B",
                fontWeight: isActive ? 600 : 500,
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.color = "#334155";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }
              }}
            >
              {/* Removed absolute left bar */}
              <item.icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 40,
          background: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          boxShadow: "1px 0 8px rgba(15, 23, 42, 0.03)",
          width: collapsed ? 72 : 260,
        }}
        className="hidden lg:flex flex-col"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          style={{
            position: "absolute",
            right: "-14px",
            top: "80px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
            color: "#64748B",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#4F46E5";
            e.currentTarget.style.color = "#4F46E5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.color = "#64748B";
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight style={{ width: "14px", height: "14px" }} />
          ) : (
            <ChevronLeft style={{ width: "14px", height: "14px" }} />
          )}
        </button>
      </motion.aside>
    </>
  );
}
