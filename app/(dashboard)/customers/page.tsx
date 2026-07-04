"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Users, Star, Pin, Trash2,
  Phone, MapPin, ChevronLeft, ChevronRight, ChevronDown,
  Eye, Edit, RotateCcw, X,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Customer, CustomerFilter } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { AnimatePresence } from "framer-motion";

type ApiCustomerResponse = {
  data: Customer[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const filterOptions: { value: CustomerFilter; label: string }[] = [
  { value: "all", label: "All Accounts" },
  { value: "pending", label: "Pending Balances" },
  { value: "paid", label: "Settled Accounts" },
  { value: "pinned", label: "Pinned" },
  { value: "favorites", label: "Favorites" },
];

function CustomersContent() {
  const searchParamsObj = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>(
    (searchParamsObj.get("filter") as CustomerFilter) || "all"
  );
  const [page, setPage] = useState(parseInt(searchParamsObj.get("page") || "1"));
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [customerToArchive, setCustomerToArchive] = useState<{ id: string; name: string } | null>(null);
  const [sortBy, setSortBy] = useState(searchParamsObj.get("sortBy") || "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery<ApiCustomerResponse>({
    queryKey: ["customers", debouncedSearch, filter, page, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch, filter, page: String(page), pageSize: "10", sortBy, sortDir,
      });
      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const res = await fetch(`/api/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPinned }) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); queryClient.removeQueries({ queryKey: ["dashboard"] }); },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await fetch(`/api/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFavorite }) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, restore, archive }: { id: string; restore?: boolean; archive?: boolean }) => {
      let url = `/api/customers/${id}`;
      if (restore) url += `?restore=true`;
      else if (archive) url += `?archive=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.removeQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["transactions"] });
      if (vars.restore) toast.success("Customer restored");
      else if (vars.archive) toast.success("Customer permanently deleted");
      else toast.success("Customer deleted", { action: { label: "Undo", onClick: () => deleteMutation.mutate({ id: vars.id, restore: true }) } });
    },
    onError: () => toast.error("Action failed"),
  });

  const customers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Customers</h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "2px" }} suppressHydrationWarning>
            {pagination?.total ?? "..."} total customer accounts
          </p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          <UserPlus style={{ width: "16px", height: "16px" }} />
          <span className="hidden sm:inline">Add Customer</span>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="premium-card" style={{ padding: "20px" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full" style={{ maxWidth: "500px" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94A3B8" }} />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customers by name, contact, village..."
              className="form-input"
              style={{ paddingLeft: "40px", paddingRight: search ? "40px" : "14px", width: "100%" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px", borderRadius: "50%" }}>
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="w-full sm:w-auto">
            <span className="hidden sm:block" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748B", whiteSpace: "nowrap" }}>Sort by:</span>
            <CustomSelect
              value={`${sortBy}:${sortDir}`}
              onChange={(val) => { const [f, d] = val.split(":"); setSortBy(f); setSortDir(d as "asc" | "desc"); setPage(1); }}
              className="w-full sm:w-[180px] font-semibold"
              options={[
                { label: "Newest Added", value: "createdAt:desc" },
                { label: "Oldest Added", value: "createdAt:asc" },
                { label: "Name A-Z", value: "name:asc" },
                { label: "Name Z-A", value: "name:desc" },
                { label: "Highest Balance", value: "currentBalance:desc" },
                { label: "Lowest Balance", value: "currentBalance:asc" }
              ]}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="md:hidden mb-4">
          <CustomSelect
            value={filter}
            onChange={(val) => { setFilter(val as any); setPage(1); }}
            className="w-full bg-indigo-50 border-none text-indigo-600 font-semibold"
            options={[
              { label: "All Accounts", value: "all" },
              { label: "Pending Payment", value: "pending" },
              { label: "Paid/Settled", value: "paid" },
              { label: "Pinned", value: "pinned" },
              { label: "Favorites", value: "favorites" },
              { label: "Trash", value: "deleted" }
            ]}
          />
        </div>
        <div style={{ display: "none", gap: "8px", marginTop: "16px", flexWrap: "wrap" }} className="md:flex">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: filter === f.value ? "1px solid #4F46E5" : "1px solid transparent",
                background: filter === f.value ? "#4F46E5" : "#F1F5F9",
                color: filter === f.value ? "#FFFFFF" : "#64748B",
              }}
              onMouseEnter={(e) => { if (filter !== f.value) { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.color = "#4F46E5"; } }}
              onMouseLeave={(e) => { if (filter !== f.value) { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#64748B"; } }}
            >
              {f.label}
            </button>
          ))}
          <button onClick={() => { setFilter(filter === "deleted" ? "all" : "deleted"); setPage(1); }}
            style={{
              padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, transition: "all 0.2s",
              background: filter === "deleted" ? "#FEE2E2" : "#F1F5F9",
              color: filter === "deleted" ? "#DC2626" : "#64748B",
              border: `1px solid ${filter === "deleted" ? "#FECACA" : "transparent"}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto"
            }}>
            {filter === "deleted" ? (
              <><Users style={{ width: "12px", height: "12px" }} /> Active Customers</>
            ) : (
              <><Trash2 style={{ width: "12px", height: "12px" }} /> Trash Bin</>
            )}
          </button>
        </div>
      </div>

      {!isMounted || isLoading ? (
        <CustomersSkeleton />
      ) : customers.length === 0 ? (
        <EmptyCustomers search={search} filter={filter} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="premium-card overflow-hidden hidden md:block">
            <div style={{ overflowX: "auto" }}>
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Customer Details</th>
                    <th style={{ textAlign: "left" }}>Contact</th>
                    <th style={{ textAlign: "right" }}>Ledger Balance</th>
                    <th style={{ textAlign: "left" }}>Created On</th>
                    <th style={{ textAlign: "center", width: "140px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <CustomerRow
                      key={customer.id} customer={customer} filter={filter}
                      onTogglePin={() => togglePinMutation.mutate({ id: customer.id, isPinned: !customer.isPinned })}
                      onToggleFavorite={() => toggleFavoriteMutation.mutate({ id: customer.id, isFavorite: !customer.isFavorite })}
                      onDelete={() => setCustomerToDelete({ id: customer.id, name: customer.name })}
                      onRestore={() => deleteMutation.mutate({ id: customer.id, restore: true })}
                      onArchive={() => setCustomerToArchive({ id: customer.id, name: customer.name })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id} customer={customer} filter={filter}
                onTogglePin={() => togglePinMutation.mutate({ id: customer.id, isPinned: !customer.isPinned })}
                onToggleFavorite={() => toggleFavoriteMutation.mutate({ id: customer.id, isFavorite: !customer.isFavorite })}
                onDelete={() => setCustomerToDelete({ id: customer.id, name: customer.name })}
                onRestore={() => deleteMutation.mutate({ id: customer.id, restore: true })}
                onArchive={() => setCustomerToArchive({ id: customer.id, name: customer.name })}
              />
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
                  style={{ padding: "8px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#FFFFFF", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, transition: "all 0.15s" }}>
                  <ChevronLeft style={{ width: "16px", height: "16px" }} />
                </button>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>{page} of {pagination.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                  style={{ padding: "8px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#FFFFFF", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.5 : 1, transition: "all 0.15s" }}>
                  <ChevronRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {customerToDelete && (
          <ConfirmModal
            title="Delete Customer"
            message={`Are you sure you want to delete ${customerToDelete.name}? This will hide the customer and their transactions, but they can be restored later.`}
            confirmText="Delete Customer"
            onConfirm={() => {
              const id = customerToDelete.id;
              setCustomerToDelete(null);
              deleteMutation.mutate({ id });
            }}
            onCancel={() => setCustomerToDelete(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {customerToArchive && (
          <ConfirmModal
            title="Permanently Delete Customer"
            message={`Are you sure you want to permanently delete ${customerToArchive.name}? This will also permanently delete all of their transactions. This action cannot be undone.`}
            confirmText="Permanently Delete"
            variant="danger"
            onConfirm={() => {
              deleteMutation.mutate({ id: customerToArchive.id, archive: true });
              setCustomerToArchive(null);
            }}
            onCancel={() => setCustomerToArchive(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerRow({ customer, filter, onTogglePin, onToggleFavorite, onDelete, onRestore, onArchive }: { customer: Customer; filter: CustomerFilter; onTogglePin: () => void; onToggleFavorite: () => void; onDelete: () => void; onRestore: () => void; onArchive: () => void; }) {
  return (
    <tr className="group">
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)", border: "1.5px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#4F46E5", fontWeight: 700, fontSize: "0.875rem" }}>
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link href={`/customers/${customer.id}`} style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4F46E5")} onMouseLeave={(e) => (e.currentTarget.style.color = "#0F172A")}>
              {customer.name}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              {customer.isPinned && <Pin style={{ width: "12px", height: "12px", color: "#D97706", transform: "rotate(45deg)" }} />}
              {customer.isFavorite && <Star style={{ width: "12px", height: "12px", color: "#D97706", fill: "#D97706" }} />}
              {customer.village && (
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", gap: "2px" }}>
                  <MapPin style={{ width: "11px", height: "11px", color: "#4F46E5" }} /> {customer.village}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td>
        {customer.phone ? (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
            <Phone style={{ width: "12px", height: "12px", color: "#4F46E5" }} /> {customer.phone}
          </span>
        ) : <span style={{ color: "#CBD5E1", fontSize: "0.75rem" }}>—</span>}
      </td>
      <td style={{ textAlign: "right" }}>
        <span style={{ fontWeight: 800, fontSize: "0.875rem", color: Number(customer.currentBalance) > 0 ? "#DC2626" : "#059669" }}>
          {formatCurrency(customer.currentBalance)}
        </span>
      </td>
      <td><span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8" }}>{formatDate(customer.createdAt)}</span></td>
      <td>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          {customer.isDeleted ? (
            <>
              <button onClick={onRestore} className="btn-icon-success" title="Restore">
                <RotateCcw style={{ width: "16px", height: "16px" }} />
              </button>
              <button onClick={onArchive} className="btn-icon-danger" title="Permanently Delete">
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </>
          ) : (
            <>
              <Link href={`/customers/${customer.id}?from=/customers`} className="btn-icon-view" title="View Ledger">
                <Eye style={{ width: "16px", height: "16px" }} />
              </Link>
              <Link href={`/customers/${customer.id}/edit`} className="btn-icon-edit" title="Edit">
                <Edit style={{ width: "16px", height: "16px" }} />
              </Link>
              <button onClick={onToggleFavorite} className="btn-icon-favorite" style={{ background: customer.isFavorite ? "#FEF3C7" : undefined }} title="Favorite">
                <Star style={{ width: "16px", height: "16px", fill: customer.isFavorite ? "currentColor" : "none" }} />
              </button>
              <button onClick={onDelete} className="btn-icon-danger" title="Delete">
                <Trash2 style={{ width: "16px", height: "16px" }} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function CustomerCard({ customer, filter, onTogglePin, onToggleFavorite, onDelete, onRestore, onArchive }: { customer: Customer; filter: CustomerFilter; onTogglePin: () => void; onToggleFavorite: () => void; onDelete: () => void; onRestore: () => void; onArchive: () => void; }) {
  return (
    <div className="premium-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)", border: "1.5px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#4F46E5", fontWeight: 700 }}>
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <Link href={`/customers/${customer.id}`} style={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem", textDecoration: "none" }}>{customer.name}</Link>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                {customer.isPinned && <Pin style={{ width: "12px", height: "12px", color: "#D97706", transform: "rotate(45deg)" }} />}
                {customer.isFavorite && <Star style={{ width: "12px", height: "12px", color: "#D97706", fill: "#D97706" }} />}
              </div>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: Number(customer.currentBalance) > 0 ? "#DC2626" : "#059669" }}>
              {formatCurrency(customer.currentBalance)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", borderTop: "1px solid #F1F5F9", paddingTop: "12px" }}>
            {customer.phone && <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}><Phone style={{ width: "12px", height: "12px", color: "#4F46E5" }} /> {customer.phone}</span>}
            {customer.village && <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}><MapPin style={{ width: "12px", height: "12px", color: "#4F46E5" }} /> {customer.village}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
            {customer.isDeleted ? (
              <>
                <button onClick={onRestore} className="btn-success" style={{ flex: 1, padding: "8px", fontSize: "0.75rem" }}>Restore</button>
                <button onClick={onArchive} className="btn-danger" style={{ flex: 1, padding: "8px", fontSize: "0.75rem", fontWeight: 700 }}>Delete Forever</button>
              </>
            ) : (
              <>
                <Link href={`/customers/${customer.id}?from=/customers`} className="btn-primary" style={{ flex: 1, padding: "8px", fontSize: "0.75rem", textAlign: "center", textDecoration: "none" }}>
                  View Ledger
                </Link>
                <Link href={`/customers/${customer.id}/edit`} className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "0.75rem", textAlign: "center", textDecoration: "none" }}>
                  Edit Profile
                </Link>
                <button onClick={onDelete} className="btn-danger" style={{ padding: "8px 12px", fontSize: "0.75rem", fontWeight: 700 }}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCustomers({ search, filter }: { search: string; filter: CustomerFilter }) {
  return (
    <div className="premium-card" style={{ padding: "48px", textAlign: "center" }}>
      <Users style={{ width: "56px", height: "56px", color: "#C7D2FE", margin: "0 auto 16px" }} />
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
        {search ? `No accounts found for "${search}"` : "No customers registered"}
      </h3>
      <p style={{ color: "#94A3B8", fontSize: "0.875rem", marginBottom: "24px", maxWidth: "360px", margin: "0 auto 24px" }}>
        {filter === "all" ? "Start by registering your first customer profile." : `No accounts match the "${filter}" filter.`}
      </p>
      {filter === "all" && (
        <Link href="/customers/new" className="btn-primary">
          <UserPlus style={{ width: "16px", height: "16px" }} /> Add First Customer
        </Link>
      )}
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: "96px", borderRadius: "16px" }} />)}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersSkeleton />}>
      <CustomersContent />
    </Suspense>
  );
}
