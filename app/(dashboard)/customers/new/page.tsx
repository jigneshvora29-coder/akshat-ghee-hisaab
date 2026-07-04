"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createCustomerSchema, type CreateCustomerInput } from "@/lib/validations";
import { useQueryClient } from "@tanstack/react-query";

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as any,
    defaultValues: { openingBalance: 0 },
  });

  const onSubmit = async (data: CreateCustomerInput) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to create customer");
      return;
    }

    const result = await res.json();
    queryClient.removeQueries({ queryKey: ["customers"] });
    queryClient.removeQueries({ queryKey: ["dashboard"] });
    toast.success("Customer added successfully!");
    router.push(`/customers/${result.data.id}`);
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => router.push("/customers")} style={{ padding: "8px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#334155", transition: "background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <ArrowLeft style={{ width: "20px", height: "20px" }} />
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A" }}>Add Customer</h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Create a new customer account</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-card" style={{ padding: "28px" }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Customer Name *</label>
            <input {...register("name")} className="form-input" placeholder="Full name" autoFocus disabled={isSubmitting} />
            {errors.name && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Phone Number</label>
              <input {...register("phone")} type="tel" className="form-input" placeholder="+91 98765 43210" disabled={isSubmitting} />
              {errors.phone && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.phone.message}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Village / Area</label>
              <input {...register("village")} className="form-input" placeholder="Village or area name" disabled={isSubmitting} />
              {errors.village && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.village.message}</p>}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Address</label>
            <textarea {...register("address")} rows={2} className="form-input" style={{ resize: "none" }} placeholder="Full address" disabled={isSubmitting} />
            {errors.address && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.address.message}</p>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Opening Balance (₹)</label>
            <input {...register("openingBalance")} type="number" step="0.01" min="0" className="form-input" placeholder="0.00" disabled={isSubmitting} />
            <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>Previous balance this customer owes (if any)</p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Notes</label>
            <textarea {...register("notes")} rows={2} className="form-input" style={{ resize: "none" }} placeholder="Any additional notes" disabled={isSubmitting} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "8px" }}>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <UserPlus style={{ width: "16px", height: "16px" }} />}
              {isSubmitting ? "Creating..." : "Create Customer"}
            </button>
            <button type="button" onClick={() => router.push("/customers")} disabled={isSubmitting} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
