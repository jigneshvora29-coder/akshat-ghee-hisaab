"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, ArrowLeftRight, Hash, X, ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: "customer" | "transaction" | "page";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  amount?: number;
}

const staticPages: SearchResult[] = [
  { type: "page", id: "dashboard", title: "Dashboard", subtitle: "Overview", href: "/dashboard", },
  { type: "page", id: "customers", title: "Customers", subtitle: "Manage customers", href: "/customers", },
  { type: "page", id: "new-customer", title: "Add New Customer", subtitle: "Create a customer record", href: "/customers/new", },
  { type: "page", id: "transactions", title: "Transactions", subtitle: "All transactions", href: "/transactions", },
  { type: "page", id: "reports", title: "Reports", subtitle: "Business reports", href: "/reports", },
  { type: "page", id: "settings", title: "Settings", subtitle: "Business settings", href: "/settings", },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  const { data: searchData, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const results: SearchResult[] = query.length < 2
    ? staticPages
    : [...(searchData || []), ...staticPages.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))];

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => { if (!open) { setQuery(""); setSelected(0); } }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); if (open) onClose(); }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((p) => Math.min(p + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((p) => Math.max(p - 1, 0)); }
    else if (e.key === "Enter" && results[selected]) { router.push(results[selected].href); onClose(); }
  }, [results, selected, router, onClose]);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "customer": return <Users style={{ width: "16px", height: "16px" }} />;
      case "transaction": return <ArrowLeftRight style={{ width: "16px", height: "16px" }} />;
      default: return <Hash style={{ width: "16px", height: "16px" }} />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 9999 }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", paddingLeft: "16px", paddingRight: "16px", pointerEvents: "none" }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -10 }} transition={{ duration: 0.15 }}
              style={{ width: "100%", maxWidth: "600px", background: "#FFFFFF", borderRadius: "20px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", border: "1px solid #E2E8F0", pointerEvents: "auto" }}>
              {/* Search input */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
                <Search style={{ width: "20px", height: "20px", color: "#4F46E5", flexShrink: 0 }} />
                <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Search customers, transactions, pages..."
                  style={{ flex: 1, background: "transparent", border: "none", fontSize: "1rem", color: "#0F172A", outline: "none" }} />
                {query && (
                  <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}>
                    <X style={{ width: "16px", height: "16px" }} />
                  </button>
                )}
                <kbd style={{ fontSize: "0.6875rem", color: "#94A3B8", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "2px 6px", fontFamily: "monospace" }}>ESC</kbd>
              </div>

              {/* Results */}
              <div style={{ maxHeight: "320px", overflowY: "auto", padding: "8px 0" }}>
                {isLoading && query.length >= 2 && <div style={{ padding: "16px 20px", fontSize: "0.875rem", color: "#94A3B8" }}>Searching...</div>}
                {!isLoading && results.length === 0 && <div style={{ padding: "32px 20px", textAlign: "center", fontSize: "0.875rem", color: "#94A3B8" }}>No results found for &quot;{query}&quot;</div>}
                {results.map((result, i) => (
                  <button key={`${result.type}-${result.id}`} onClick={() => { router.push(result.href); onClose(); }} onMouseEnter={() => setSelected(i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", textAlign: "left", cursor: "pointer", transition: "background 0.15s", border: "none",
                      background: selected === i ? "#EEF2FF" : "transparent"
                    }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      background: result.type === "customer" ? "#E0E7FF" : result.type === "transaction" ? "#E0F2FE" : "#F1F5F9",
                      color: result.type === "customer" ? "#4F46E5" : result.type === "transaction" ? "#0284C7" : "#64748B",
                    }}>
                      {getIcon(result.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: selected === i ? "#4F46E5" : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.title}</p>
                      {result.subtitle && (
                        <p style={{ fontSize: "0.75rem", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {result.subtitle}
                          {result.amount !== undefined && <span style={{ marginLeft: "4px", color: "#DC2626", fontWeight: 600 }}>• {formatCurrency(result.amount)}</span>}
                        </p>
                      )}
                    </div>
                    {selected === i && <ChevronRight style={{ width: "16px", height: "16px", color: "#4F46E5", flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
