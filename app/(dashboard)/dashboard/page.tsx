"use client";
import { useState, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, ArrowLeftRight,
  IndianRupee, AlertCircle, UserPlus,
  ArrowUpRight, Plus,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatCurrency, formatDate, formatRelativeTime, cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import { TransactionModal } from "@/components/shared/TransactionModal";

async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  const json = await res.json();
  return json.data;
}

import type { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } as any },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } as any },
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [txnModal, setTxnModal] = useState<{ type: "sale" | "payment" | "adjustment" } | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 60000,
  });

  if (!isMounted || isLoading || !data) return <DashboardSkeleton />;

  const stats = data!;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "2px" }}>
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setTxnModal({ type: "sale" })} className="btn-primary" style={{ padding: "10px 16px", background: "#4F46E5" }}>
            <Plus style={{ width: "16px", height: "16px" }} />
            <span className="hidden sm:inline">Add Sale</span>
          </button>
          <Link href="/customers/new" className="btn-primary" style={{ background: "#0284C7", padding: "10px 16px" }}>
            <UserPlus style={{ width: "16px", height: "16px" }} />
            <span className="hidden sm:inline">Add Customer</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Today's Sales" value={formatCurrency(stats.todaySales)} icon={TrendingUp} accent="#4F46E5" />
        <StatCard title="Today's Collections" value={formatCurrency(stats.todayPayments)} icon={TrendingDown} accent="#059669" />
        <StatCard title="Outstanding" value={formatCurrency(stats.outstandingAmount)} icon={AlertCircle} accent="#9333EA" />
      </motion.div>



      {/* Recent transactions + pending customers */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="premium-card lg:col-span-2" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>Recent Transactions</h2>
            <Link href="/transactions" style={{ fontSize: "0.8125rem", color: "#4F46E5", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
              View all <ArrowUpRight style={{ width: "12px", height: "12px" }} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.recentTransactions.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#94A3B8", textAlign: "center", padding: "32px 0" }}>
                No transactions yet
              </p>
            ) : (
              stats.recentTransactions.slice(0, 8).map((txn) => (
                <div key={txn.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: txn.type === "SALE" ? "#EEF2FF" : txn.type === "PAYMENT" ? "#ECFDF5" : "#FFFBEB",
                      color: txn.type === "SALE" ? "#4F46E5" : txn.type === "PAYMENT" ? "#059669" : "#D97706",
                    }}
                  >
                    {txn.type === "SALE" ? (
                      <TrendingUp style={{ width: "16px", height: "16px" }} />
                    ) : txn.type === "PAYMENT" ? (
                      <IndianRupee style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <ArrowLeftRight style={{ width: "16px", height: "16px" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {txn.description}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(txn as any).customer?.name} · {formatRelativeTime(txn.createdAt)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: txn.type === "SALE" ? "#4F46E5" : "#059669" }}>
                      {txn.type === "PAYMENT" ? "-" : "+"}{formatCurrency(txn.amount)}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>{formatDate(txn.date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending customers */}
        <div className="premium-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>Top Pending</h2>
            <Link href="/customers?filter=pending" style={{ fontSize: "0.8125rem", color: "#4F46E5", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
              View all <ArrowUpRight style={{ width: "12px", height: "12px" }} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.pendingCustomers.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#94A3B8", textAlign: "center", padding: "32px 0" }}>
                No pending balances 🎉
              </p>
            ) : (
              stats.pendingCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}?from=/dashboard`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px",
                    margin: "0 -8px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#4F46E5", fontSize: "0.75rem", fontWeight: 700 }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {customer.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{customer.village || "—"}</p>
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#9333EA", flexShrink: 0 }}>
                    {formatCurrency(customer.currentBalance)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {txnModal && (
        <TransactionModal
          type={txnModal.type}
          onClose={() => setTxnModal(null)}
          onSuccess={() => {
            queryClient.removeQueries({ queryKey: ["dashboard"] });
            queryClient.removeQueries({ queryKey: ["transactions"] });
            queryClient.removeQueries({ queryKey: ["customers"] });
            setTxnModal(null);
          }}
        />
      )}

    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, accent, className,
}: {
  title: string; value: string; icon: React.ElementType; accent: string; className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(15, 23, 42, 0.06)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", borderRadius: "0 4px 4px 0", background: accent }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
            {title}
          </p>
          <p style={{ color: "#0F172A", fontWeight: 800, fontSize: "1.25rem", lineHeight: 1.2 }}>{value}</p>
        </div>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "12px",
            background: `${accent}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          <Icon style={{ width: "16px", height: "16px", color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="skeleton" style={{ height: "32px", width: "160px", marginBottom: "8px" }} />
          <div className="skeleton" style={{ height: "16px", width: "256px" }} />
        </div>
        <div className="skeleton" style={{ height: "40px", width: "128px", borderRadius: "12px" }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "96px", borderRadius: "16px" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton" style={{ height: "256px", borderRadius: "16px" }} />
        <div className="skeleton" style={{ height: "256px", borderRadius: "16px" }} />
      </div>
    </div>
  );
}
