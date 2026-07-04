"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema, type CreateTransactionInput } from "@/lib/validations";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatCurrency, generateReferenceNumber } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/types";
import { CustomSelect } from "@/components/shared/CustomSelect";

interface TransactionModalProps {
  type: "sale" | "payment" | "adjustment";
  customerId?: string;
  initialData?: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionModal({ type, customerId, initialData, onClose, onSuccess }: TransactionModalProps) {
  const isEditing = !!initialData;
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: initialData ? {
      customerId: initialData.customerId,
      type: initialData.type as "SALE" | "PAYMENT" | "ADJUSTMENT",
      amount: Number(initialData.amount),
      description: initialData.description,
      notes: initialData.notes || "",
      referenceNumber: initialData.referenceNumber || "",
      date: new Date(initialData.date).toISOString().split("T")[0],
    } : {
      customerId: customerId || "",
      type: type.toUpperCase() as "SALE" | "PAYMENT" | "ADJUSTMENT",
      date: new Date().toISOString().split("T")[0],
      referenceNumber: generateReferenceNumber()
    },
  });

  const { data: customersResponse } = useQuery({
    queryKey: ["customers_list_for_modal"],
    queryFn: async () => {
      const res = await fetch("/api/customers?pageSize=1000");
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !customerId && !isEditing
  });
  const availableCustomers = (customersResponse?.data || []).filter((c: any) => !c.isArchived);

  const { data: itemsResponse } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    }
  });
  const availableItems = (itemsResponse?.data || []).filter((i: any) => !i.isDeleted && !i.isArchived);

  // Initialize lineItems if editing a SALE with items
  const [lineItems, setLineItems] = useState<any[]>(() => {
    if (initialData && initialData.items && initialData.items.length > 0) {
      return initialData.items.map((i: any) => ({
        itemId: i.itemId,
        name: i.item?.name || "Unknown Item",
        quantity: Number(i.quantity),
        unit: i.unit,
        rate: Number(i.rate),
        total: Number(i.total)
      }));
    }
    return [];
  });

  // Keep description and amount in sync with lineItems
  useEffect(() => {
    if (type === "sale" && lineItems.length > 0) {
      const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.total), 0);
      setValue("amount", totalAmount);
      const desc = lineItems.map(i => `${i.name} (${i.quantity}${i.unit})`).join(", ");
      setValue("description", desc);
    }
  }, [lineItems, type, setValue]);

  const addLineItem = (itemId: string) => {
    if (!itemId || itemId === "add_item_placeholder") return;
    const item = availableItems.find((i: any) => i.id === itemId);
    if (!item) return;
    setLineItems([...lineItems, {
      itemId: item.id,
      name: item.name,
      quantity: item.defaultQuantity,
      unit: item.defaultUnit,
      rate: item.defaultPrice,
      total: item.defaultQuantity * item.defaultPrice
    }]);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      updated[index].total = Number(updated[index].quantity || 0) * Number(updated[index].rate || 0);
    }
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateTransactionInput) => {
    if (type === "sale" && lineItems.length > 0) {
      data.items = lineItems.map(item => ({
        itemId: item.itemId,
        quantity: Number(item.quantity),
        unit: item.unit,
        rate: Number(item.rate),
        total: Number(item.total)
      }));
    }

    const url = isEditing ? `/api/transactions/${initialData.id}` : "/api/transactions";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || (isEditing ? "Failed to update transaction" : "Failed to add transaction"));
      return;
    }
    
    toast.success(isEditing ? "Transaction updated!" : type === "sale" ? "Sale added!" : type === "payment" ? "Payment recorded!" : "Adjustment added!");
    onSuccess();
  };

  const typeConfig = {
    sale: { label: "Sale", bg: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)", desc: "Ghee sold to customer", btn: "#4F46E5", hover: "#4338CA" },
    payment: { label: "Payment", bg: "linear-gradient(135deg, #059669 0%, #065F46 100%)", desc: "Payment received from customer", btn: "#059669", hover: "#047857" },
    adjustment: { label: "Adjustment", bg: "linear-gradient(135deg, #D97706 0%, #92400E 100%)", desc: "Balance adjustment entry", btn: "#D97706", hover: "#B45309" },
  };
  const cfg = typeConfig[type];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        style={{ position: "relative", width: "100%", maxWidth: type === "sale" ? "640px" : "440px", background: "#FFFFFF", borderRadius: "20px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: cfg.bg, padding: "24px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.25rem" }}>{isEditing ? "Edit" : "Add"} {cfg.label}</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>{cfg.desc}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", transition: "color 0.15s" }}
              onMouseEnter={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.color = "#FFFFFF" }} onMouseLeave={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.color = "rgba(255,255,255,0.8)" }}>
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        </div>
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          <form id="txForm" onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="hidden" {...register("type")} />

            <div className="grid grid-cols-2 gap-4">
              {(!customerId && !isEditing) ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Customer *</label>
                  <CustomSelect
                    value={watch("customerId")}
                    onChange={(val) => setValue("customerId", val)}
                    className="w-full"
                    options={[
                      { label: "Select a customer...", value: "" },
                      ...availableCustomers.map((c: any) => ({
                        label: c.name,
                        value: c.id
                      }))
                    ]}
                  />
                  {errors.customerId && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.customerId.message}</p>}
                </div>
              ) : (
                <input type="hidden" {...register("customerId")} />
              )}
              <div className={(!customerId && !isEditing) ? "" : "col-span-2"}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Date *</label>
                <input type="date" {...register("date")} className="form-input w-full" disabled={isSubmitting} />
                {errors.date && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.date.message}</p>}
              </div>
            </div>

            {type === "sale" && (
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>Sale Items</h4>
                  <CustomSelect
                    value="add_item_placeholder"
                    onChange={addLineItem}
                    className="w-[180px]"
                    options={[
                      { label: "+ Add Item", value: "add_item_placeholder" },
                      ...availableItems.map((item: any) => ({
                        label: item.name,
                        value: item.id
                      }))
                    ]}
                  />
                </div>

                {lineItems.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {lineItems.map((item, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "120px" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>{item.name}</p>
                        </div>
                        <div style={{ width: "80px" }}>
                          <input type="number" step="any" min="0" value={item.quantity} onChange={(e) => updateLineItem(index, "quantity", e.target.value)} className="form-input w-full" style={{ padding: "6px" }} />
                        </div>
                        <div style={{ width: "40px" }}>
                          <span style={{ fontSize: "0.875rem", color: "#64748B" }}>{item.unit}</span>
                        </div>
                        <div style={{ width: "80px" }}>
                          <input type="number" step="any" min="0" value={item.rate} onChange={(e) => updateLineItem(index, "rate", e.target.value)} className="form-input w-full" style={{ padding: "6px" }} />
                        </div>
                        <div style={{ width: "80px", textAlign: "right" }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#059669" }}>{formatCurrency(item.total)}</span>
                        </div>
                        <button type="button" onClick={() => removeLineItem(index)} style={{ padding: "4px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}>
                          <X style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.8125rem", color: "#64748B", textAlign: "center", padding: "12px 0" }}>Select an item from the dropdown to add it to the bill.</p>
                )}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Total Amount (₹) *</label>
              <input type="number" step="0.01" min="0.01" {...register("amount")} className="form-input w-full" placeholder="0.00" readOnly={type === "sale" && lineItems.length > 0} disabled={isSubmitting} />
              {errors.amount && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.amount.message}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Description *</label>
              <input type="text" {...register("description")} className="form-input w-full" placeholder={type === "sale" ? "e.g. Pure Cow Ghee - 2kg" : type === "payment" ? "e.g. Cash Payment" : "e.g. Balance Adjustment"} readOnly={type === "sale" && lineItems.length > 0} disabled={isSubmitting} />
              {errors.description && <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#DC2626" }}>{errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Reference #</label>
                <input type="text" {...register("referenceNumber")} className="form-input w-full" disabled={isSubmitting} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Notes</label>
                <input type="text" {...register("notes")} className="form-input w-full" placeholder="Optional" disabled={isSubmitting} />
              </div>
            </div>
          </form>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" form="txForm" disabled={isSubmitting} className="btn-primary" style={{ background: cfg.btn }}
            onMouseEnter={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = cfg.hover }} onMouseLeave={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = cfg.btn }}>
            {isSubmitting ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 0.7s linear infinite" }} /> : (isEditing ? "Save Changes" : `Save ${cfg.label}`)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
