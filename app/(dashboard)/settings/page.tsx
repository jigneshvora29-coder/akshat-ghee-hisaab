"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Building2, CreditCard, QrCode, Upload, X, Save, Lock,
  Eye, EyeOff, Loader2,
} from "lucide-react";
import { businessSettingsSchema, type BusinessSettingsInput } from "@/lib/validations";
import { fileToBase64 } from "@/lib/utils";

async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed");
  const json = await res.json();
  return json.data;
}

const cn = (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(" ");

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"business" | "payment" | "security">("business");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<{
    businessName: string; ownerName?: string; address?: string; phone?: string;
    gstNumber?: string; upiId?: string; bankName?: string; bankAccount?: string;
    bankIfsc?: string; footerMessage?: string; logoImage?: string; upiQrImage?: string;
  }>({ queryKey: ["settings"], queryFn: fetchSettings });

  useEffect(() => {
    if (settings) {
      if (settings.logoImage) setLogoPreview(settings.logoImage);
      if (settings.upiQrImage) setQrPreview(settings.upiQrImage);
      reset({
        businessName: settings.businessName || "Akshat Ghee",
        ownerName: settings.ownerName || "", address: settings.address || "",
        phone: settings.phone || "", gstNumber: settings.gstNumber || "",
        upiId: settings.upiId || "", bankName: settings.bankName || "",
        bankAccount: settings.bankAccount || "", bankIfsc: settings.bankIfsc || "",
        footerMessage: settings.footerMessage || "Thank you for your business!",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.businessName]);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<BusinessSettingsInput>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: { businessName: "Akshat Ghee", footerMessage: "Thank you for your business!" },
  });

  const onSubmit = async (data: BusinessSettingsInput) => {
    setIsSaving(true);
    try {
      const body = { ...data, ...(logoPreview !== settings?.logoImage && { logoImage: logoPreview }), ...(qrPreview !== settings?.upiQrImage && { upiQrImage: qrPreview }) };
      const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Failed to save settings"); return; }
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully!");
    } catch { toast.error("Failed to save settings"); } finally { setIsSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const base64 = await fileToBase64(file); setLogoPreview(base64);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const base64 = await fileToBase64(file); setQrPreview(base64);
  };

  const tabs = [
    { key: "business", label: "Business Info", icon: Building2 },
    { key: "payment", label: "Payment Details", icon: CreditCard },
    { key: "security", label: "Security", icon: Lock },
  ] as const;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A" }}>Business Settings</h1>
        <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "2px" }}>Configure your business details for ledgers and invoices</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#F1F5F9", padding: "4px", borderRadius: "14px", width: "fit-content" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", fontSize: "0.875rem",
              fontWeight: activeTab === key ? 700 : 500, cursor: "pointer", border: "none", transition: "all 0.15s",
              background: activeTab === key ? "#FFFFFF" : "transparent",
              color: activeTab === key ? "#4F46E5" : "#64748B",
              boxShadow: activeTab === key ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
            }}>
            <Icon style={{ width: "16px", height: "16px" }} /> {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "64px", borderRadius: "16px" }} />)}
        </div>
      ) : activeTab === "security" ? (
        <ChangePasswordSection />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Business Info */}
          {activeTab === "business" && (
            <div className="premium-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Logo Upload */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "12px" }}>Business Logo</label>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div onClick={() => logoInputRef.current?.click()}
                    style={{ width: "80px", height: "80px", borderRadius: "16px", border: "2px dashed #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4F46E5")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}>
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center" }}><Upload style={{ width: "24px", height: "24px", color: "#94A3B8", margin: "0 auto" }} /><p style={{ fontSize: "0.6875rem", color: "#94A3B8", marginTop: "4px" }}>Upload</p></div>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                  <div>
                    <button type="button" onClick={() => logoInputRef.current?.click()} style={{ fontSize: "0.875rem", color: "#4F46E5", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Upload logo</button>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>PNG, JPG up to 5MB</p>
                    {logoPreview && (
                      <button type="button" onClick={() => setLogoPreview(null)} style={{ fontSize: "0.75rem", color: "#DC2626", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        <X style={{ width: "12px", height: "12px" }} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Business Name *" error={errors.businessName?.message}><input {...register("businessName")} className="form-input" placeholder="Akshat Ghee" disabled={isSaving} /></FormField>
                <FormField label="Owner Name" error={errors.ownerName?.message}><input {...register("ownerName")} className="form-input" placeholder="Your Name" disabled={isSaving} /></FormField>
                <FormField label="Phone" error={errors.phone?.message}><input {...register("phone")} className="form-input" placeholder="+91 98765 43210" disabled={isSaving} /></FormField>
                <FormField label="GST Number" error={errors.gstNumber?.message}><input {...register("gstNumber")} className="form-input" placeholder="22AAAAA0000A1Z5" disabled={isSaving} /></FormField>
              </div>
              <FormField label="Address" error={errors.address?.message}><textarea {...register("address")} rows={3} className="form-input" style={{ resize: "none" }} placeholder="Full business address" disabled={isSaving} /></FormField>
              <FormField label="Footer Message" error={errors.footerMessage?.message}><textarea {...register("footerMessage")} rows={2} className="form-input" style={{ resize: "none" }} placeholder="Thank you for your business!" disabled={isSaving} /></FormField>
            </div>
          )}

          {/* Payment Details */}
          {activeTab === "payment" && (
            <div className="premium-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="UPI ID" error={errors.upiId?.message}><input {...register("upiId")} className="form-input" placeholder="yourname@paytm" disabled={isSaving} /></FormField>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>UPI QR Code</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div onClick={() => qrInputRef.current?.click()}
                      style={{ width: "64px", height: "64px", borderRadius: "12px", border: "2px dashed #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4F46E5")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}>
                      {qrPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrPreview} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : <QrCode style={{ width: "24px", height: "24px", color: "#94A3B8" }} />}
                    </div>
                    <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrUpload} style={{ display: "none" }} />
                    <button type="button" onClick={() => qrInputRef.current?.click()} style={{ fontSize: "0.875rem", color: "#4F46E5", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Upload QR</button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>Bank Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Bank Name" error={errors.bankName?.message}><input {...register("bankName")} className="form-input" placeholder="State Bank of India" disabled={isSaving} /></FormField>
                  <FormField label="Account Number" error={errors.bankAccount?.message}><input {...register("bankAccount")} className="form-input" placeholder="XXXXXXXXXXXXX" disabled={isSaving} /></FormField>
                  <FormField label="IFSC Code" error={errors.bankIfsc?.message}><input {...register("bankIfsc")} className="form-input" placeholder="SBIN0001234" disabled={isSaving} /></FormField>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "security" && (
            <button type="submit" disabled={isSaving} className="btn-primary" style={{ width: "fit-content" }}>
              {isSaving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <Save style={{ width: "16px", height: "16px" }} />}
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>{label}</label>
      {children}
      {error && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

function ChangePasswordSection() {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.oldPassword, newPassword: form.newPassword }) });
      const result = await response.json();
      if (!response.ok) { toast.error(result.error || "Failed to change password"); return; }
      toast.success("Password changed successfully!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch { toast.error("Failed to change password"); } finally { setIsLoading(false); }
  };

  return (
    <div className="premium-card" style={{ padding: "28px" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", marginBottom: "20px" }}>Change Password</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "360px" }}>
        {[
          { label: "Current Password", key: "oldPassword", show: showOld, toggle: () => setShowOld(!showOld) },
          { label: "New Password", key: "newPassword", show: showNew, toggle: () => setShowNew(!showNew) },
          { label: "Confirm New Password", key: "confirmPassword", show: showNew, toggle: () => setShowNew(!showNew) },
        ].map(({ label, key, show, toggle }) => (
          <div key={key}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>{label}</label>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"} value={(form as any)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="form-input" style={{ paddingRight: "40px" }} placeholder="••••••••" disabled={isLoading} />
              <button type="button" onClick={toggle} disabled={isLoading}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}>
                {show ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: "fit-content" }}>
          {isLoading ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : <Lock style={{ width: "16px", height: "16px" }} />}
          {isLoading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
