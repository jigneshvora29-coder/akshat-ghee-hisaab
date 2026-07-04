"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight, Search, ChevronLeft, ChevronRight, ChevronDown,
  TrendingUp, IndianRupee, X, Hash, Trash2, Calendar, RotateCcw, Edit
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import Link from "next/link";
import type { Transaction } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { TransactionModal } from "@/components/shared/TransactionModal";
import { AnimatePresence } from "framer-motion";

type FilterType = "all" | "SALE" | "PAYMENT" | "ADJUSTMENT";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState<"active" | "deleted">("active");
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToArchive, setTransactionToArchive] = useState<Transaction | null>(null);
  const [txnModal, setTxnModal] = useState<{ type: "sale" | "payment" | "adjustment", customerId: string, data?: Transaction } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", debouncedSearch, typeFilter, page, startDate, endDate, sortBy, sortDir, status],
    queryFn: async () => {
      const params = new URLSearchParams({ search: debouncedSearch, type: typeFilter, status, page: String(page), pageSize: "10", sortBy, sortDir, ...(startDate && { startDate }), ...(endDate && { endDate }) });
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, restore, archive }: { id: string; restore?: boolean; archive?: boolean }) => {
      let url = `/api/transactions/${id}`;
      if (restore) url += `?restore=true`;
      else if (archive) url += `?archive=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["customers"] });
      queryClient.removeQueries({ queryKey: ["customer"] });
      if (vars.restore) toast.success("Transaction restored");
      else if (vars.archive) toast.success("Transaction permanently deleted");
      else toast.success("Transaction deleted", { action: { label: "Undo", onClick: () => deleteMutation.mutate({ id: vars.id, restore: true }) } });
    },
    onError: () => toast.error("Action failed"),
  });

  const transactions: Transaction[] = data?.data || [];
  const pagination = data?.pagination;

  const filterColors: Record<FilterType, { bg: string; color: string; border: string }> = {
    all: { bg: "#4F46E5", color: "#FFFFFF", border: "#4F46E5" },
    SALE: { bg: "#DC2626", color: "#FFFFFF", border: "#DC2626" },
    PAYMENT: { bg: "#059669", color: "#FFFFFF", border: "#059669" },
    ADJUSTMENT: { bg: "#D97706", color: "#FFFFFF", border: "#D97706" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Transactions</h1>
        <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "2px" }}>{pagination?.total ?? "..."} total transaction entries</p>
      </div>

      {/* Filters */}
      <div className="premium-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full" style={{ maxWidth: "500px" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94A3B8" }} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search description, reference, customer..." className="form-input" style={{ paddingLeft: "40px", paddingRight: search ? "40px" : "14px", width: "100%" }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}>
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }} className="w-full sm:w-auto">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="hidden sm:block" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748B", whiteSpace: "nowrap" }}>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="form-input"
                  style={{ width: "135px", cursor: "pointer", fontWeight: 600, color: "#475569" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="hidden sm:block" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748B", whiteSpace: "nowrap" }}>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="form-input"
                  style={{ width: "135px", cursor: "pointer", fontWeight: 600, color: "#475569" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="hidden sm:block" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748B", whiteSpace: "nowrap" }}>Sort by:</span>
              <CustomSelect
                value={`${sortBy}:${sortDir}`}
                onChange={(val) => { const [f, d] = val.split(":"); setSortBy(f); setSortDir(d as "asc" | "desc"); setPage(1); }}
                className="w-full sm:w-[180px] font-semibold"
                options={[
                  { label: "Newest First", value: "date:desc" },
                  { label: "Oldest First", value: "date:asc" },
                  { label: "Highest Amount", value: "amount:desc" },
                  { label: "Lowest Amount", value: "amount:asc" }
                ]}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {(["all", "SALE", "PAYMENT", "ADJUSTMENT"] as FilterType[]).map((f) => {
            const isActive = typeFilter === f;
            const colors = filterColors[f];
            return (
              <button key={f} onClick={() => { setTypeFilter(f); setPage(1); }}
                style={{
                  padding: "6px 14px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  border: `1px solid ${isActive ? colors.border : "transparent"}`,
                  background: isActive ? colors.bg : "#F1F5F9",
                  color: isActive ? colors.color : "#64748B",
                }}>
                {f === "all" ? "All Types" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            );
          })}
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <X style={{ width: "12px", height: "12px" }} /> Clear Dates
            </button>
          )}

          <button onClick={() => { setStatus(status === "active" ? "deleted" : "active"); setPage(1); }}
            style={{
              padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, transition: "all 0.2s",
              background: status === "deleted" ? "#FEE2E2" : "#F1F5F9",
              color: status === "deleted" ? "#DC2626" : "#64748B",
              border: `1px solid ${status === "deleted" ? "#FECACA" : "transparent"}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto"
            }}>
            {status === "deleted" ? (
              <><ArrowLeftRight style={{ width: "12px", height: "12px" }} /> Active Transactions</>
            ) : (
              <><Trash2 style={{ width: "12px", height: "12px" }} /> Trash Bin</>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      {!isMounted || isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: "64px", borderRadius: "16px" }} />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="premium-card" style={{ padding: "48px", textAlign: "center" }}>
          <ArrowLeftRight style={{ width: "56px", height: "56px", color: "#C7D2FE", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>No transactions recorded</h3>
          <p style={{ color: "#94A3B8", fontSize: "0.875rem" }}>Modify your query or filters and try again.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="premium-card overflow-hidden hidden md:block">
            <div style={{ overflowX: "auto" }}>
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", width: "15%" }}>Date</th>
                    <th style={{ textAlign: "left", width: "20%" }}>Customer Name</th>
                    <th style={{ textAlign: "left", width: "30%" }}>Description</th>
                    <th style={{ textAlign: "center", width: "10%" }}>Type</th>
                    <th style={{ textAlign: "right", width: "12%" }}>Debit (Sale)</th>
                    <th style={{ textAlign: "right", width: "12%" }}>Credit (Paid)</th>
                    <th style={{ textAlign: "center", width: "8%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className={cn(txn.isDeleted && "opacity-50 line-through")}>
                      <td style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", whiteSpace: "nowrap" }}>{formatDate(txn.date)}</td>
                      <td>
                        {txn.customer && (
                          <Link href={`/customers/${txn.customerId}?from=/transactions`} style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A", textDecoration: "none", transition: "color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#4F46E5")} onMouseLeave={(e) => (e.currentTarget.style.color = "#0F172A")}>
                            {(txn as any).customer?.name}
                          </Link>
                        )}
                      </td>
                      <td>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>{txn.description}</p>
                        {txn.referenceNumber && (
                          <p style={{ fontSize: "0.625rem", color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px", marginTop: "4px" }}>
                            <Hash style={{ width: "10px", height: "10px" }} /> {txn.referenceNumber}
                          </p>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={cn(
                            "inline-flex px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase border",
                            txn.type === "SALE"
                              ? "badge-sale"
                              : txn.type === "PAYMENT"
                                ? "badge-payment"
                                : "badge-adjustment"
                          )}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: "0.875rem", color: "#DC2626" }}>
                        {txn.type === "SALE" ? formatCurrency(txn.amount) : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: "0.875rem", color: "#059669" }}>
                        {txn.type === "PAYMENT" ? formatCurrency(txn.amount) : txn.type === "ADJUSTMENT" ? <span style={{ color: "#D97706" }}>{formatCurrency(txn.amount)} (Adj)</span> : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          {status === "active" && (
                            <button onClick={() => setTxnModal({ type: txn.type.toLowerCase() as any, customerId: txn.customerId, data: txn })} className="btn-icon-edit" title="Edit transaction">
                              <Edit style={{ width: "16px", height: "16px" }} />
                            </button>
                          )}
                          <button onClick={() => {
                            if (status === "deleted") {
                              deleteMutation.mutate({ id: txn.id, restore: true });
                            } else {
                              setTransactionToDelete(txn);
                            }
                          }} className={status === "deleted" ? "btn-icon-success" : "btn-icon-danger"} title={status === "deleted" ? "Restore" : "Delete"}>
                            {status === "deleted" ? <RotateCcw style={{ width: "16px", height: "16px" }} /> : <Trash2 style={{ width: "16px", height: "16px" }} />}
                          </button>
                          {status === "deleted" && (
                            <button onClick={() => setTransactionToArchive(txn)} className="btn-icon-danger" title="Permanently Delete">
                              <X style={{ width: "16px", height: "16px" }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="flex md:hidden flex-col gap-4">
            {transactions.map((txn) => (
              <div key={txn.id} className="premium-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: txn.type === "SALE" ? "#FEF2F2" : txn.type === "PAYMENT" ? "#ECFDF5" : "#FFFBEB",
                    color: txn.type === "SALE" ? "#DC2626" : txn.type === "PAYMENT" ? "#059669" : "#D97706",
                    border: `1px solid ${txn.type === "SALE" ? "#FECACA" : txn.type === "PAYMENT" ? "#A7F3D0" : "#FDE68A"}`
                  }}>
                    {txn.type === "SALE" ? <TrendingUp style={{ width: "16px", height: "16px" }} /> : <IndianRupee style={{ width: "16px", height: "16px" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.description}</p>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "2px" }}>{(txn as any).customer?.name} · {formatDate(txn.date)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 800, fontFamily: "monospace", color: txn.type === "SALE" ? "#DC2626" : "#059669" }}>
                      {txn.type === "SALE" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </p>
                    <p style={{ fontSize: "0.625rem", color: "#94A3B8", marginTop: "2px", fontWeight: 700 }}>Bal: {formatCurrency(txn.runningBalance)}</p>
                  </div>
                </div>
                {/* Mobile Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
                  {status === "deleted" ? (
                    <>
                      <button onClick={() => deleteMutation.mutate({ id: txn.id, restore: true })} className="btn-primary" style={{ flex: 1, padding: "8px", fontSize: "0.75rem" }}>Restore</button>
                      <button onClick={() => setTransactionToArchive(txn)} style={{ flex: 1, padding: "8px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "10px", background: "#FEF2F2", color: "#DC2626", textAlign: "center", border: "1px solid #FECACA" }}>Delete Forever</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setTxnModal({ type: txn.type.toLowerCase() as any, customerId: txn.customerId, data: txn })} style={{ flex: 1, padding: "8px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "10px", background: "#EFF6FF", color: "#3B82F6", textAlign: "center", border: "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <Edit style={{ width: "12px", height: "12px" }} /> Edit
                      </button>
                      <button onClick={() => setTransactionToDelete(txn)} style={{ flex: 1, padding: "8px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "10px", background: "#F1F5F9", color: "#64748B", textAlign: "center", border: "1px solid transparent" }}>
                        Move to Trash
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="premium-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "8px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#FFFFFF", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}>
                  <ChevronLeft style={{ width: "16px", height: "16px" }} />
                </button>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>{page} of {pagination.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                  style={{ padding: "8px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#FFFFFF", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.5 : 1 }}>
                  <ChevronRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {transactionToDelete && (
          <ConfirmModal
            title="Delete Transaction"
            message={`Are you sure you want to delete this ${transactionToDelete.type.toLowerCase()} transaction? It will be moved to the Trash Bin and customer balances will be recalculated.`}
            confirmText="Delete"
            onConfirm={() => {
              deleteMutation.mutate({ id: transactionToDelete.id });
              setTransactionToDelete(null);
            }}
            onCancel={() => setTransactionToDelete(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {transactionToArchive && (
          <ConfirmModal
            title="Permanently Delete Transaction"
            message={`Are you sure you want to permanently delete this ${transactionToArchive.type.toLowerCase()} transaction? This action cannot be undone.`}
            confirmText="Permanently Delete"
            onConfirm={() => {
              deleteMutation.mutate({ id: transactionToArchive.id, archive: true });
              setTransactionToArchive(null);
            }}
            onCancel={() => setTransactionToArchive(null)}
          />
        )}
      </AnimatePresence>

      {txnModal && (
        <TransactionModal
          type={txnModal.type} customerId={txnModal.customerId} initialData={txnModal.data} onClose={() => setTxnModal(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.removeQueries({ queryKey: ["customers"] }); queryClient.removeQueries({ queryKey: ["customer"] }); queryClient.removeQueries({ queryKey: ["dashboard"] }); setTxnModal(null);
          }}
        />
      )}
    </div>
  );
}
