"use client";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { CustomerWithTransactions, Transaction, BusinessSettings } from "@/types";
import { Phone, MapPin, Hash, Wallet, Award, ReceiptText } from "lucide-react";

interface LedgerViewProps {
  customer: CustomerWithTransactions;
  transactions: Transaction[];
  business?: BusinessSettings | null;
  dateRange?: { from: Date; to: Date } | null;
}

export function LedgerView({ customer, transactions, business, dateRange }: LedgerViewProps) {
  const openingBalance = Number(customer.openingBalance);
  
  // Ensure transactions are chronologically sorted for correct running balances
  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate totals
  const totalDebit = sortedTxns
    .filter((t) => t.type === "SALE")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalCredit = sortedTxns
    .filter((t) => t.type === "PAYMENT")
    .reduce((s, t) => s + Number(t.amount), 0);
  
  const currentOutstanding = Number(customer.currentBalance);
  const isFullyPaid = currentOutstanding <= 0;

  return (
    <div
      className="bg-white p-8 sm:p-10 border border-slate-200/80 rounded-3xl shadow-xl max-w-4xl mx-auto text-slate-800 animate-fade-in"
      style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
    >
      {/* ─── 1. HEADER SECTION ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 mb-6 border-b-2 border-indigo-600/80">
        <div className="flex items-center gap-4">
          {business?.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoImage}
              alt="Business Logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-xl font-black">AG</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-900 tracking-tight leading-none">
              {business?.businessName || "Akshat Ghee Agency"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 font-semibold tracking-wide uppercase">
              {business?.ownerName || "Pure Cow Ghee Wholesale & Retail"}
            </p>
          </div>
        </div>
        
        <div className="sm:text-right">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Customer Ledger Statement
          </h2>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
            Generated: {new Date().toLocaleDateString("en-IN")} · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* ─── 2. INFORMATION GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Business details card */}
        <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-4.5">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-700" /> Business Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">Phone:</span>
              <span className="flex-1 font-semibold text-slate-700">{business?.phone || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">UPI ID:</span>
              <span className="flex-1 font-semibold text-slate-700">{business?.upiId || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">GSTIN:</span>
              <span className="flex-1 font-semibold text-slate-700">{business?.gstNumber || "—"}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">Address:</span>
              <span className="flex-1 text-slate-600 text-xs font-medium">{business?.address || "—"}</span>
            </div>
          </div>
        </div>

        {/* Customer details card */}
        <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-4.5">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ReceiptText className="w-4 h-4 text-indigo-700" /> Customer Account
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">Name:</span>
              <span className="flex-1 font-extrabold text-slate-900">{customer.name}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">Phone:</span>
              <span className="flex-1 font-semibold text-slate-700 flex items-center gap-1">
                {customer.phone ? (
                  <>
                    <Phone className="w-3.5 h-3.5 text-emerald-800 inline" /> {customer.phone}
                  </>
                ) : "—"}
              </span>
            </div>
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">Location:</span>
              <span className="flex-1 text-slate-700 font-semibold flex items-center gap-1">
                {customer.village || customer.address ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-indigo-800 inline" />
                    {[customer.village, customer.address].filter(Boolean).join(", ")}
                  </>
                ) : "—"}
              </span>
            </div>
            <div className="flex">
              <span className="w-20 font-bold text-muted-foreground text-xs uppercase">Period:</span>
              <span className="flex-1 font-semibold text-slate-700">
                {dateRange ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}` : "All Time Activity"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. KPI SUMMARY CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-indigo-600">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total Sales
          </p>
          <p className="text-xl font-extrabold text-indigo-600 font-mono tracking-tight">
            {formatCurrency(totalDebit)}
          </p>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-1 block">
            Debit Activity
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total Payments
          </p>
          <p className="text-xl font-extrabold text-emerald-700 font-mono tracking-tight">
            {formatCurrency(totalCredit)}
          </p>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-1 block">
            Collections Credit
          </span>
        </div>

        <div
          className={cn(
            "border rounded-2xl p-4 shadow-sm border-l-4 transition-colors",
            isFullyPaid
              ? "bg-emerald-50/50 border-emerald-200 border-l-emerald-600"
              : "bg-amber-50/50 border-amber-200 border-l-amber-500"
          )}
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            {isFullyPaid ? "Credit Balance" : "Outstanding Balance"}
          </p>
          <p
            className={cn(
              "text-xl font-extrabold font-mono tracking-tight",
              isFullyPaid ? "text-emerald-700" : "text-amber-800"
            )}
          >
            {formatCurrency(Math.abs(currentOutstanding))}
          </p>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-1 block">
            {isFullyPaid ? "Fully Settled" : "Pending Collection"}
          </span>
        </div>
      </div>

      {/* ─── 4. PAYMENT STATUS ALERTS ───────────────────────────────────── */}
      <div
        className={cn(
          "rounded-xl p-3.5 mb-6 flex items-center justify-center text-xs font-bold border text-center",
          isFullyPaid
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        )}
      >
        <span>
          {isFullyPaid
            ? "★ ACCOUNT STATUS: FULLY PAID — Customer has settled all ledger outstanding balances."
            : "⚠ ACCOUNT STATUS: PENDING PAYMENT — Ledger outstanding balance requires clearance."}
        </span>
      </div>

      {/* ─── 5. STATEMENT TABLE ─────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-indigo-700 text-white font-bold uppercase tracking-wider border-b border-indigo-800">
                <th className="p-3 w-[15%]">Date</th>
                <th className="p-3 w-[45%]">Description</th>
                <th className="p-3 w-[13%] text-right">Debit (Sale)</th>
                <th className="p-3 w-[13%] text-right">Credit (Paid)</th>
                <th className="p-3 w-[14%] text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Opening Balance Row */}
              <tr className="bg-amber-50/30 font-semibold text-slate-800">
                <td className="p-3 text-muted-foreground">—</td>
                <td className="p-3 text-amber-900 font-bold">Opening Balance</td>
                <td className="p-3 text-right text-muted-foreground">—</td>
                <td className="p-3 text-right text-muted-foreground">—</td>
                <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                  {formatCurrency(openingBalance)}
                </td>
              </tr>

              {/* Transactions rows */}
              {sortedTxns.map((txn, idx) => (
                <tr
                  key={txn.id}
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  )}
                >
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(txn.date)}</td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-900 leading-tight">{txn.description}</p>
                    {txn.referenceNumber && (
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5 mt-1">
                        <Hash className="w-2.5 h-2.5 inline" /> {txn.referenceNumber}
                      </span>
                    )}
                    {txn.notes && (
                      <p className="text-[10px] text-muted-foreground font-medium italic mt-0.5">
                        &quot;{txn.notes}&quot;
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">
                    {txn.type === "SALE" ? formatCurrency(txn.amount) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    {txn.type === "PAYMENT" ? (
                      formatCurrency(txn.amount)
                    ) : txn.type === "ADJUSTMENT" ? (
                      <span className="text-amber-600">{formatCurrency(txn.amount)} (Adj)</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                    {formatCurrency(txn.runningBalance)}
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-indigo-50/60 font-bold border-t border-slate-200">
                <td className="p-3 text-muted-foreground">—</td>
                <td className="p-3 text-indigo-900 uppercase tracking-wide">Total Statement Activity</td>
                <td className="p-3 text-right font-mono text-indigo-600 font-extrabold">{formatCurrency(totalDebit)}</td>
                <td className="p-3 text-right font-mono text-emerald-700 font-extrabold">{formatCurrency(totalCredit)}</td>
                <td className="p-3 text-right font-mono text-indigo-900 font-extrabold">{formatCurrency(currentOutstanding)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 6. UPI AND PAYMENT CARD (IF APPLICABLE) ───────────────────── */}
      {(business?.upiId || business?.bankName) && (
        <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-indigo-900 uppercase tracking-wider mb-2">Remittance Instructions</h4>
            {business?.upiId && (
              <p className="text-slate-700">
                <strong>UPI ID:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{business.upiId}</span>
              </p>
            )}
            {business?.bankName && (
              <p className="text-slate-700 mt-1">
                <strong>Bank Account:</strong> {business.bankName} | <strong>A/c:</strong> <span className="font-mono">{business.bankAccount}</span> | <strong>IFSC:</strong> <span className="font-mono">{business.bankIfsc}</span>
              </p>
            )}
          </div>
          {business?.upiQrImage && (
            <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.upiQrImage}
                alt="Payment QR Code"
                className="w-16 h-16 object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* ─── 7. STATEMENT FOOTER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 border-t border-slate-200 text-[10px] text-muted-foreground font-semibold">
        <p className="italic">
          {business?.footerMessage || "Thank you for choosing Akshat Ghee Agency."}
        </p>
        <p className="uppercase tracking-wider">
          {business?.businessName || "Akshat Ghee Agency"} · Ledger statement
        </p>
      </div>
    </div>
  );
}
