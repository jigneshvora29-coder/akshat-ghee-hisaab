"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Image,
  Clipboard, Printer, Phone, MapPin, Star, Pin,
  TrendingUp, ArrowLeftRight, IndianRupee, X, Loader2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrency, formatDate, cn, generateReferenceNumber,
} from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema, type CreateTransactionInput } from "@/lib/validations";
import type { CustomerWithTransactions, Transaction } from "@/types";
import { LedgerView } from "@/features/ledger/LedgerView";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { TransactionModal } from "@/components/shared/TransactionModal";
import { PrintModal } from "@/components/shared/PrintModal";

async function fetchCustomer(id: string): Promise<CustomerWithTransactions> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) throw new Error("Customer not found");
  const json = await res.json();
  return json.data;
}

async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default function CustomerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get("from");
      if (from) {
        router.push(from);
        return;
      }
    }
    router.push("/customers");
  };
  const queryClient = useQueryClient();
  const [txnModal, setTxnModal] = useState<{ type: "sale" | "payment" | "adjustment", data?: Transaction } | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [txnFilter, setTxnFilter] = useState<"last_10" | "this_month" | "last_3_months" | "last_6_months" | "last_year" | "all">("last_10");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
      router.push("/customers");
    },
    onError: () => toast.error("Failed to delete customer"),
  });



  if (isLoading) return <CustomerProfileSkeleton />;
  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "#64748B" }}>Customer not found</p>
        <Link href="/customers" style={{ color: "#4F46E5", fontSize: "0.875rem", textDecoration: "underline", marginTop: "8px", display: "inline-block" }}>
          ← Back to customers
        </Link>
      </div>
    );
  }

  const activeTxns = customer.transactions.filter((t) => !t.isDeleted);
  const totalSales = activeTxns.filter((t) => t.type === "SALE").reduce((s, t) => s + Number(t.amount), 0);
  const totalPayments = activeTxns.filter((t) => t.type === "PAYMENT").reduce((s, t) => s + Number(t.amount), 0);

  const now = new Date();
  let displayedTxns = [...activeTxns].reverse();
  if (txnFilter === "last_10") {
    displayedTxns = displayedTxns.slice(0, 10);
  } else if (txnFilter === "this_month") {
    displayedTxns = displayedTxns.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
  } else if (txnFilter === "last_3_months") {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    displayedTxns = displayedTxns.filter(t => new Date(t.date) >= threeMonthsAgo);
  } else if (txnFilter === "last_6_months") {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    displayedTxns = displayedTxns.filter(t => new Date(t.date) >= sixMonthsAgo);
  } else if (txnFilter === "last_year") {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    displayedTxns = displayedTxns.filter(t => new Date(t.date) >= oneYearAgo);
  }

  return (
    <>
      <div className="print:hidden" style={{ maxWidth: "1024px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={handleBack} style={{ padding: "8px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#334155", transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = "#F1F5F9" }} onMouseLeave={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = "transparent" }}>
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</h1>
            <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Customer Profile</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href={`/customers/${id}/edit`} className="btn-secondary" style={{ padding: "8px 16px" }}>
              <Edit style={{ width: "16px", height: "16px" }} /> <span className="hidden sm:inline">Edit</span>
            </Link>
            <button onClick={() => setShowConfirmDelete(true)}
              disabled={deleteCustomerMutation.isPending} className="btn-danger" style={{ padding: "8px 16px" }}>
              {deleteCustomerMutation.isPending ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <Trash2 style={{ width: "16px", height: "16px" }} />}
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Info + Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer info card */}
          <div className="premium-card md:col-span-1" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)", border: "2px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#4F46E5", fontSize: "1.5rem", fontWeight: 700 }}>{customer.name.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontWeight: 700, color: "#0F172A", fontSize: "1.125rem", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</h2>
                  {customer.isPinned && <Pin style={{ width: "14px", height: "14px", color: "#D97706", flexShrink: 0, transform: "rotate(45deg)" }} />}
                  {customer.isFavorite && <Star style={{ width: "14px", height: "14px", color: "#D97706", fill: "#D97706", flexShrink: 0 }} />}
                </div>
                {customer.phone && <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "#64748B", marginTop: "8px" }}><Phone style={{ width: "14px", height: "14px" }} /> {customer.phone}</p>}
                {customer.village && <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "#64748B", marginTop: "4px" }}><MapPin style={{ width: "14px", height: "14px" }} /> {customer.village}</p>}
                {customer.address && <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "8px" }}>{customer.address}</p>}
                {customer.notes && <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "12px", fontStyle: "italic" }}>&quot;{customer.notes}&quot;</p>}
              </div>
            </div>
          </div>

          {/* Balance cards */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStatCard label="Opening" value={formatCurrency(customer.openingBalance)} color="#2563EB" />
            <MiniStatCard label="Total Sales" value={formatCurrency(totalSales)} color="#4F46E5" />
            <MiniStatCard label="Total Paid" value={formatCurrency(totalPayments)} color="#059669" />
            <MiniStatCard label={Number(customer.currentBalance) >= 0 ? "Outstanding" : "Credit"} value={formatCurrency(Math.abs(Number(customer.currentBalance)))} color={Number(customer.currentBalance) > 0 ? "#9333EA" : "#059669"} large />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", background: "#F1F5F9", padding: "16px", borderRadius: "16px" }} className="no-print">
          <button onClick={() => setTxnModal({ type: "sale" })} className="btn-primary" style={{ padding: "10px 16px", background: "#4F46E5" }}>
            <TrendingUp style={{ width: "16px", height: "16px" }} /> Add Sale
          </button>
          <button onClick={() => setTxnModal({ type: "payment" })} className="btn-primary" style={{ padding: "10px 16px", background: "#059669" }}>
            <IndianRupee style={{ width: "16px", height: "16px" }} /> Add Payment
          </button>
          <button onClick={() => setTxnModal({ type: "adjustment" })} className="btn-primary" style={{ padding: "10px 16px", background: "#D97706" }}>
            <ArrowLeftRight style={{ width: "16px", height: "16px" }} /> Adjustment
          </button>

          <div style={{ width: "1px", height: "24px", background: "#CBD5E1", margin: "0 4px" }} className="hidden sm:block" />

          <button onClick={() => setShowPrintModal(true)} className="btn-primary" style={{ padding: "10px 16px", background: "#0D9488" }}>
            <Printer style={{ width: "16px", height: "16px" }} /> Print
          </button>
        </div>

        {/* Transaction History */}
        <div className="premium-card overflow-hidden">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ fontWeight: 600, color: "#0F172A", fontSize: "1rem" }}>Transaction History</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CustomSelect
                value={txnFilter}
                onChange={(val) => setTxnFilter(val as any)}
                className="w-[200px]"
                options={[
                  { label: "Last 10 Transactions", value: "last_10" },
                  { label: "This Month", value: "this_month" },
                  { label: "Last 3 Months", value: "last_3_months" },
                  { label: "Last 6 Months", value: "last_6_months" },
                  { label: "Last 1 Year", value: "last_year" },
                  { label: "All Time", value: "all" }
                ]}
              />
              <span style={{ fontSize: "0.875rem", color: "#64748B" }}>{displayedTxns.length} of {activeTxns.length} entries</span>
            </div>
          </div>
          {activeTxns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <ArrowLeftRight style={{ width: "40px", height: "40px", color: "#C7D2FE", margin: "0 auto 12px" }} />
              <p style={{ color: "#64748B", fontSize: "0.875rem", fontWeight: 500 }}>No transactions yet</p>
              <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>Add a sale or payment to get started</p>
            </div>
          ) : (
            <TransactionTable transactions={displayedTxns} customerId={id} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["customer", id] })} onEdit={(t) => setTxnModal({ type: t.type.toLowerCase() as any, data: t })} />
          )}
        </div>

        {txnModal && (
          <TransactionModal
            type={txnModal.type} customerId={id} initialData={txnModal.data} onClose={() => setTxnModal(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["customer", id] }); queryClient.removeQueries({ queryKey: ["customers"] }); queryClient.removeQueries({ queryKey: ["dashboard"] }); queryClient.removeQueries({ queryKey: ["transactions"] }); setTxnModal(null);
            }}
          />
        )}

        <AnimatePresence>
          {showPrintModal && (
            <PrintModal customerId={id} onClose={() => setShowPrintModal(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showConfirmDelete && (
            <ConfirmModal
              title="Delete Customer"
              message={`Are you sure you want to delete ${customer.name}? This will hide the customer and their transactions, but they can be restored later.`}
              confirmText="Delete Customer"
              onConfirm={() => {
                setShowConfirmDelete(false);
                deleteCustomerMutation.mutate();
              }}
              onCancel={() => setShowConfirmDelete(false)}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="hidden print:block w-full">
        <LedgerView customer={customer} business={settings} transactions={activeTxns} />
      </div>
    </>
  );
}

function MiniStatCard({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  return (
    <div className="premium-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>{label}</p>
      <p style={{ fontWeight: 800, fontSize: large ? "1.25rem" : "1rem", color }}>{value}</p>
    </div>
  );
}

function TransactionTable({ transactions, customerId, onUpdate, onEdit }: { transactions: Transaction[]; customerId: string; onUpdate: () => void; onEdit: (t: Transaction) => void; }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async ({ id, restore }: { id: string; restore?: boolean }) => {
      const url = restore ? `/api/transactions/${id}?restore=true` : `/api/transactions/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_, vars) => {
      onUpdate();
      queryClient.removeQueries({ queryKey: ["transactions"] });
      queryClient.removeQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["customers"] });
      if (vars.restore) toast.success("Transaction restored");
      else toast.success("Transaction deleted", { action: { label: "Undo", onClick: () => deleteMutation.mutate({ id: vars.id, restore: true }) } });
    },
    onError: () => toast.error("Action failed"),
  });

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Date</th>
              <th style={{ textAlign: "left" }}>Description</th>
              <th style={{ textAlign: "right" }}>Debit (Sale)</th>
              <th style={{ textAlign: "right" }}>Credit (Payment)</th>
              <th style={{ textAlign: "right" }}>Balance</th>
              <th style={{ textAlign: "center", width: "96px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className={cn(txn.isDeleted && "opacity-50 line-through")}>
                <td style={{ fontSize: "0.875rem", color: "#64748B", whiteSpace: "nowrap" }}>{formatDate(txn.date)}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <p style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 500 }}>
                      {txn.items && txn.items.length > 0 ? "Sale" : txn.description}
                    </p>
                    {txn.items && txn.items.length > 0 && txn.items.map(item => (
                      <p key={item.id} style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        • {item.item?.name || "Item"} — {Number(item.quantity)} {item.unit} @ {formatCurrency(Number(item.rate))} = {formatCurrency(Number(item.total))}
                      </p>
                    ))}
                    {txn.referenceNumber && <p style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "2px" }}>#{txn.referenceNumber}</p>}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  {txn.type === "SALE" ? <span style={{ color: "#4F46E5", fontWeight: 600, fontSize: "0.875rem" }}>{formatCurrency(txn.amount)}</span> : <span style={{ color: "#94A3B8", fontSize: "0.875rem" }}>—</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  {txn.type === "PAYMENT" ? <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.875rem" }}>{formatCurrency(txn.amount)}</span> : txn.type === "ADJUSTMENT" ? <span style={{ color: "#D97706", fontWeight: 600, fontSize: "0.875rem" }}>{formatCurrency(txn.amount)} (Adj)</span> : <span style={{ color: "#94A3B8", fontSize: "0.875rem" }}>—</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: 700, color: Number(txn.runningBalance) >= 0 ? "#9333EA" : "#059669", fontSize: "0.875rem" }}>
                    {formatCurrency(Math.abs(Number(txn.runningBalance)))} {Number(txn.runningBalance) >= 0 ? "Dr" : "Cr"}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  {!txn.isDeleted && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => onEdit(txn)} className="btn-icon-edit" title="Edit transaction">
                        <Edit style={{ width: "16px", height: "16px" }} />
                      </button>
                      <button onClick={() => deleteMutation.mutate({ id: txn.id })} disabled={deleteMutation.isPending} className="btn-icon-danger" title="Delete transaction">
                        {deleteMutation.isPending ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <Trash2 style={{ width: "16px", height: "16px" }} />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden">
        {transactions.map((txn) => (
          <div key={txn.id} style={{ padding: "16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: txn.isDeleted ? 0.5 : 1 }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "4px" }}>{formatDate(txn.date)}</p>
              <p style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 600 }}>
                {txn.items && txn.items.length > 0 ? "Sale" : txn.description}
              </p>
              {txn.items && txn.items.length > 0 && txn.items.map(item => (
                <p key={item.id} style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  • {item.item?.name || "Item"} — {Number(item.quantity)} {item.unit} @ {formatCurrency(Number(item.rate))}
                </p>
              ))}
              {txn.referenceNumber && <p style={{ fontSize: "0.75rem", color: "#94A3B8" }}>#{txn.referenceNumber}</p>}
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: txn.type === "SALE" ? "#4F46E5" : txn.type === "PAYMENT" ? "#059669" : "#D97706" }}>
                {txn.type === "SALE" ? "" : txn.type === "PAYMENT" ? "-" : ""}{formatCurrency(txn.amount)}
              </span>
              <span style={{ fontSize: "0.75rem", color: Number(txn.runningBalance) >= 0 ? "#9333EA" : "#059669", fontWeight: 500 }}>Bal: {formatCurrency(Math.abs(Number(txn.runningBalance)))}</span>
              {!txn.isDeleted && (
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button onClick={() => onEdit(txn)} className="btn-icon-edit" title="Edit transaction">
                    <Edit style={{ width: "14px", height: "14px" }} />
                  </button>
                  <button onClick={() => deleteMutation.mutate({ id: txn.id })} disabled={deleteMutation.isPending} className="btn-icon-danger" title="Delete transaction">
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CustomerProfileSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1024px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "10px" }} />
        <div className="skeleton" style={{ height: "32px", width: "192px" }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="skeleton" style={{ height: "160px", borderRadius: "16px" }} />
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "96px", borderRadius: "16px" }} />)}
        </div>
      </div>
      <div className="skeleton" style={{ height: "192px", borderRadius: "16px" }} />
    </div>
  );
}
