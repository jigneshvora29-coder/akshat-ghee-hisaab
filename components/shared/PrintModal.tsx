"use client";

import { useState } from "react";
import { X, Printer } from "lucide-react";
import { motion } from "framer-motion";

interface PrintModalProps {
  customerId: string;
  onClose: () => void;
}

export function PrintModal({ customerId, onClose }: PrintModalProps) {
  const [dateOption, setDateOption] = useState<"all" | "custom">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handlePrint = () => {
    let url = `/api/customers/${customerId}/pdf`;
    if (dateOption === "custom" && fromDate && toDate) {
      url += `?from=${fromDate}&to=${toDate}`;
    }
    window.open(url, "_blank");
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", width: "100%", maxWidth: "400px", background: "#FFFFFF", borderRadius: "20px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        >
          <div style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", padding: "24px 24px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.25rem" }}>Print Ledger</h3>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>Generate PDF statement</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#FFFFFF"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                  Date Range
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="dateOption"
                      value="all"
                      checked={dateOption === "all"}
                      onChange={() => setDateOption("all")}
                      style={{ accentColor: "#4F46E5" }}
                    />
                    All Time
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="dateOption"
                      value="custom"
                      checked={dateOption === "custom"}
                      onChange={() => setDateOption("custom")}
                      style={{ accentColor: "#4F46E5" }}
                    />
                    Custom Date
                  </label>
                </div>
              </div>

              {dateOption === "custom" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>From Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>To Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end", gap: "12px", flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 600, color: "#475569", background: "#FFFFFF", border: "1px solid #E2E8F0", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{ background: "#0D9488", color: "#FFFFFF", padding: "10px 20px", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: dateOption === "custom" && (!fromDate || !toDate) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: dateOption === "custom" && (!fromDate || !toDate) ? 0.5 : 1 }}
              disabled={dateOption === "custom" && (!fromDate || !toDate)}
            >
              <Printer style={{ width: "16px", height: "16px" }} />
              Generate PDF
            </button>
          </div>
        </motion.div>
    </div>
  );
}
