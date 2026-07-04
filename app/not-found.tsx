import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: "16px" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.2)",
          }}
        >
          <span style={{ color: "#FFFFFF", fontSize: "2rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>AG</span>
        </div>
        <h1 style={{ fontSize: "5rem", fontWeight: 900, color: "#0F172A", marginBottom: "16px", lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>404</h1>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>Page Not Found</h2>
        <p style={{ color: "#64748B", marginBottom: "32px" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ textDecoration: "none" }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
