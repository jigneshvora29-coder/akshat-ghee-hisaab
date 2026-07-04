"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { updateCustomerSchema, type UpdateCustomerInput } from "@/lib/validations";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      return json.data;
    },
  });

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema) as any,
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name, phone: data.phone || "", village: data.village || "",
        address: data.address || "", notes: data.notes || "",
        openingBalance: Number(data.openingBalance), isPinned: data.isPinned, isFavorite: data.isFavorite,
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: UpdateCustomerInput) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
    });
    if (!res.ok) { const err = await res.json(); toast.error(err.error || "Failed to update"); return; }
    queryClient.invalidateQueries({ queryKey: ["customer", id] });
    queryClient.removeQueries({ queryKey: ["customers"] });
    toast.success("Customer updated successfully!");
    router.push(`/customers/${id}`);
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="skeleton" style={{ height: "48px", width: "256px", borderRadius: "12px" }} />
        <div className="skeleton" style={{ height: "384px", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => router.push(`/customers/${id}`)} style={{ padding: "8px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#334155", transition: "background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <ArrowLeft style={{ width: "20px", height: "20px" }} />
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A" }}>Edit Customer</h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem" }}>{data?.name}</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="premium-card" style={{ padding: "28px" }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Customer Name *</label>
            <input {...register("name")} className="form-input" disabled={isSubmitting} />
            {errors.name && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Phone</label>
              <input {...register("phone")} type="tel" className="form-input" disabled={isSubmitting} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Village / Area</label>
              <input {...register("village")} className="form-input" disabled={isSubmitting} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Address</label>
            <textarea {...register("address")} rows={2} className="form-input" style={{ resize: "none" }} disabled={isSubmitting} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Notes</label>
            <textarea {...register("notes")} rows={2} className="form-input" style={{ resize: "none" }} disabled={isSubmitting} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input {...register("isPinned")} type="checkbox" style={{ width: "16px", height: "16px", accentColor: "#4F46E5", borderRadius: "4px" }} disabled={isSubmitting} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Pin Customer</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input {...register("isFavorite")} type="checkbox" style={{ width: "16px", height: "16px", accentColor: "#D97706", borderRadius: "4px" }} disabled={isSubmitting} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Mark as Favorite</span>
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "8px" }}>
            <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">
              {isSubmitting ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <Save style={{ width: "16px", height: "16px" }} />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.push(`/customers/${id}`)} disabled={isSubmitting} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
