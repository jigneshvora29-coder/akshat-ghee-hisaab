"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: "16px" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <AlertTriangle style={{ width: "40px", height: "40px", color: "#DC2626" }} />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", marginBottom: "12px" }}>Something went wrong</h1>
        <p style={{ color: "#64748B", marginBottom: "8px" }}>An unexpected error occurred. Please try again.</p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#94A3B8", fontFamily: "monospace", marginBottom: "24px" }}>Error ID: {error.digest}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
          <button onClick={reset} className="btn-primary">
            <RefreshCw style={{ width: "16px", height: "16px" }} /> Try again
          </button>
          <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
