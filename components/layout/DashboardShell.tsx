"use client";

import { useState, useEffect } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav, MobileTopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { CommandPalette } from "@/components/shared/CommandPalette";

export function DashboardShell({ children, defaultCollapsed = false }: { children: React.ReactNode, defaultCollapsed?: boolean }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isMutating = useIsMutating();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      document.cookie = `sidebarCollapsed=${next}; path=/; max-age=31536000`;
      return next;
    });
  };

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        if (anchor.target !== "_blank" && anchor.href !== window.location.href && !anchor.href.includes("#")) {
          setIsNavigating(true);
        }
      }
    };
    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
      />

      {/* Desktop TopNav */}
      <TopNav
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => {}}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Mobile TopNav */}
      <MobileTopNav
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Main content */}
      <motion.main
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: "32px",
          paddingLeft: sidebarWidth,
        }}
        className="hidden lg:block"
      >
        <div style={{ padding: "24px 32px", maxWidth: "1600px", margin: "0 auto" }}>
          {children}
        </div>
      </motion.main>

      {/* Mobile main content */}
      <main className="lg:hidden" style={{ minHeight: "100vh", paddingTop: "56px", paddingBottom: "80px" }}>
        <div style={{ padding: "16px" }}>{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Command Palette */}
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Global Loading Overlay */}
      {(isMutating > 0 || isNavigating) && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999999,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", background: "#FFFFFF", padding: "20px 32px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
             <div style={{ width: "32px", height: "32px", border: "3px solid #EEF2FF", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
             <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1E293B" }}>
               {isNavigating ? "Loading..." : "Processing..."}
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
