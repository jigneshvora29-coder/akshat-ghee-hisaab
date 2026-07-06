"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, IndianRupee, PieChart as PieChartIcon, Download, FileText, Loader2, FileDown
} from "lucide-react";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import Link from "next/link";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ReportData } from "@/types";

async function fetchReports(period: string): Promise<ReportData> {
  const res = await fetch(`/api/reports?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  const json = await res.json();
  return json.data;
}
function ChartWidget({ title, renderChart }: { title: string, renderChart: (data: any[]) => React.ReactNode }) {
  const [period, setPeriod] = useState<string>("1m");
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return (await res.json()).data;
    }
  });

  return (
    <div className="premium-card" style={{ padding: "24px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", padding: "4px", borderRadius: "10px", gap: "2px", overflowX: "auto", maxWidth: "100%" }}>
          {[
            { id: "1d", label: "1D" }, { id: "1w", label: "1W" }, { id: "thisMonth", label: "This Month" },
            { id: "1m", label: "1M" }, { id: "3m", label: "3M" }, { id: "6m", label: "6M" },
            { id: "1y", label: "1Y" }, { id: "all", label: "ALL" },
          ].map(p => (
            <button
              key={p.id} onClick={() => setPeriod(p.id)}
              style={{
                padding: "4px 8px", fontSize: "0.75rem", fontWeight: 600, borderRadius: "6px",
                background: period === p.id ? "#FFFFFF" : "transparent",
                color: period === p.id ? "#4F46E5" : "#64748B",
                boxShadow: period === p.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                border: "none", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", color: "#94A3B8" }} />
        </div>
      ) : (
        <div style={{ height: "260px" }}>
          {renderChart(data || [])}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"1d" | "1w" | "thisMonth" | "1m" | "3m" | "6m" | "1y" | "all">("1m");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "customers" | "transactions">("overview");
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", period],
    queryFn: () => fetchReports(period),
  });

  const exportToExcel = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const wb = XLSX.utils.book_new();

      const overviewData = [
        ["Metric", "Value"],
        ["Period", period],
        ["Total Sales", formatCurrency(data.totalSales)],
        ["Total Collections", formatCurrency(data.totalPayments)],
        ["Outstanding Balance", formatCurrency(data.outstanding)],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), "Overview");

      const topCustomersData = data.customerSummary.map((c: any) => ({
        "Customer Name": c.customer.name,
        "Total Purchases": c.totalSales,
        "Total Paid": c.totalPayments,
        "Current Outstanding": c.balance,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topCustomersData), "Top Customers");

      XLSX.writeFile(wb, `akshat_ghee_report_${period}_${Date.now()}.xlsx`);
      toast.success("Report exported successfully!");
    } catch (err) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexWrap: "wrap", justifyContent: "space-between" }} className="sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Business Reports</h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "2px" }}>Analyze your sales, collections, and growth.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", padding: "4px", borderRadius: "10px", gap: "2px", overflowX: "auto", maxWidth: "100%" }}>
            {[
              { id: "1d", label: "1D" },
              { id: "1w", label: "1W" },
              { id: "thisMonth", label: "This Month" },
              { id: "1m", label: "1M" },
              { id: "3m", label: "3M" },
              { id: "6m", label: "6M" },
              { id: "1y", label: "1Y" },
              { id: "all", label: "ALL" },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  background: period === p.id ? "#FFFFFF" : "transparent",
                  color: period === p.id ? "#4F46E5" : "#64748B",
                  boxShadow: period === p.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className="btn-secondary"
            style={{ padding: "10px 16px" }}
          >
            {isExporting ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite", color: "#4F46E5" }} /> : <FileDown style={{ width: "16px", height: "16px", color: "#4F46E5" }} />}
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <ReportsSkeleton />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card stat-card-indigo">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>Period Sales</p>
                  <p style={{ color: "#0F172A", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.2 }}>{formatCurrency(data.totalSales)}</p>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TrendingUp style={{ width: "20px", height: "20px", color: "#4F46E5" }} />
                </div>
              </div>
            </div>
            <div className="stat-card stat-card-emerald">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>Period Collections</p>
                  <p style={{ color: "#0F172A", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.2 }}>{formatCurrency(data.totalPayments)}</p>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IndianRupee style={{ width: "20px", height: "20px", color: "#059669" }} />
                </div>
              </div>
            </div>
            <div className="stat-card stat-card-red">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>Total Outstanding</p>
                  <p style={{ color: "#0F172A", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.2 }}>{formatCurrency(data.outstanding)}</p>
                </div>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PieChartIcon style={{ width: "20px", height: "20px", color: "#9333EA" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: "1px solid #E2E8F0", display: "flex", gap: "24px", marginBottom: "8px" }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "analytics", label: "Analytics" },
              { id: "customers", label: "Top Customers" },
              { id: "transactions", label: "Recent Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "12px 0",
                  fontSize: "0.875rem",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? "#4F46E5" : "#64748B",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #4F46E5" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  marginBottom: "-1px"
                }}
                onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#0F172A"; }}
                onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#64748B"; }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="premium-card">
            {activeTab === "overview" && (
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>Summary Analysis</h3>
                <p style={{ color: "#64748B", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  During this period, your business generated <strong style={{ color: "#0F172A" }}>{formatCurrency(data.totalSales)}</strong> in sales and collected <strong style={{ color: "#0F172A" }}>{formatCurrency(data.totalPayments)}</strong> in payments. The total outstanding balance across all your customers currently stands at <strong style={{ color: "#9333EA" }}>{formatCurrency(data.outstanding)}</strong>.
                </p>
                <div style={{ marginTop: "24px", padding: "16px", borderRadius: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", color: "#64748B" }}>Total Sales Volume</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>{formatCurrency(data.totalSales)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", color: "#64748B" }}>Total Collections Volume</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>{formatCurrency(data.totalPayments)}</span>
                  </div>
                  <div style={{ width: "100%", height: "1px", background: "#E2E8F0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>Net Flow for Period</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: (data.totalSales - data.totalPayments) > 0 ? "#9333EA" : "#059669" }}>
                      {(data.totalSales - data.totalPayments) > 0 ? "+" : ""}{formatCurrency(data.totalSales - data.totalPayments)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px", background: "#F8FAFC" }}>
                <ChartWidget
                  title="Sales Trend"
                  renderChart={(chartData) => (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
                        <Area type="monotone" dataKey="sales" name="Sales" stroke="#4F46E5" strokeWidth={2} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartWidget
                    title="Cash Flow Trend"
                    renderChart={(chartData) => (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
                          <Legend />
                          <Bar dataKey="sales" name="Sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="payments" name="Collections" fill="#059669" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  />

                  <ChartWidget
                    title="Net Outstanding Flow"
                    renderChart={(chartData) => (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9333EA" stopOpacity={0.12} />
                              <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
                          <Area type="step" dataKey="outstandingFlow" name="Outstanding Flow" stroke="#9333EA" strokeWidth={2} fill="url(#outGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  />
                </div>
              </div>
            )}

            {activeTab === "customers" && (
              <div style={{ overflowX: "auto" }}>
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Customer Name</th>
                      <th style={{ textAlign: "right" }}>Total Purchases</th>
                      <th style={{ textAlign: "right" }}>Total Paid</th>
                      <th style={{ textAlign: "right" }}>Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customerSummary.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94A3B8" }}>No customer data for this period</td></tr>
                    ) : (
                      data.customerSummary.slice(0, 10).map((c: any) => (
                        <tr key={c.customer.id}>
                          <td>
                            <Link href={`/customers/${c.customer.id}?from=/reports`} style={{ fontWeight: 600, color: "#0F172A", fontSize: "0.875rem", textDecoration: "none" }}>{c.customer.name}</Link>
                          </td>
                          <td style={{ textAlign: "right", fontSize: "0.875rem", color: "#64748B" }}>{formatCurrency(c.totalSales)}</td>
                          <td style={{ textAlign: "right", fontSize: "0.875rem", color: "#64748B" }}>{formatCurrency(c.totalPayments)}</td>
                          <td style={{ textAlign: "right", fontSize: "0.875rem", fontWeight: 700, color: Number(c.balance) > 0 ? "#9333EA" : "#059669" }}>{formatCurrency(c.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "transactions" && (
              <div style={{ overflowX: "auto" }}>
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Date</th>
                      <th style={{ textAlign: "left" }}>Description</th>
                      <th style={{ textAlign: "left" }}>Customer</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94A3B8" }}>No transactions for this period</td></tr>
                    ) : (
                      data.transactions.slice(0, 10).map((t: any) => (
                        <tr key={t.id}>
                          <td style={{ fontSize: "0.875rem", color: "#64748B" }}>{formatDate(t.date)}</td>
                          <td style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 500 }}>{t.description}</td>
                          <td>
                            <Link href={`/customers/${t.customerId}?from=/reports`} style={{ fontSize: "0.875rem", color: "#4F46E5", textDecoration: "none" }}>
                              {t.customer?.name}
                            </Link>
                          </td>
                          <td style={{ textAlign: "right", fontSize: "0.875rem", fontWeight: 700, color: t.type === "SALE" ? "#4F46E5" : "#059669" }}>
                            {t.type === "SALE" ? "+" : "-"}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "16px" }} />)}
      </div>
      <div className="skeleton" style={{ height: "400px", borderRadius: "16px" }} />
    </div>
  );
}
