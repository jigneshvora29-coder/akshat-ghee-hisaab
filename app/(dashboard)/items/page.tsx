"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Package, Edit, Trash2, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { CustomSelect } from "@/components/shared/CustomSelect";

type Item = {
  id: string;
  name: string;
  defaultQuantity: number;
  defaultUnit: string;
  defaultPrice: number;
  isDeleted: boolean;
};

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [itemToArchive, setItemToArchive] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [defaultQuantity, setDefaultQuantity] = useState("1");
  const [defaultUnit, setDefaultUnit] = useState("kg");
  const [defaultPrice, setDefaultPrice] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["items", search],
    queryFn: async () => {
      const res = await fetch(`/api/items?search=${search}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  const items: Item[] = data?.data || [];
  const activeItems = items.filter(i => !i.isDeleted);
  const deletedItems = items.filter(i => i.isDeleted);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save item");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success(data.message);
      closeModal();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, restore, archive }: { id: string; restore?: boolean; archive?: boolean }) => {
      let url = `/api/items/${id}`;
      if (restore) url += `?restore=true`;
      else if (archive) url += `?archive=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to modify item");
      return res.json();
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      if (vars.restore) toast.success("Item restored");
      else if (vars.archive) toast.success("Item permanently deleted");
      else toast.success("Item deleted", { action: { label: "Undo", onClick: () => deleteMutation.mutate({ id: vars.id, restore: true }) } });
    },
    onError: () => toast.error("Action failed"),
  });

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setDefaultQuantity(item.defaultQuantity.toString());
      setDefaultUnit(item.defaultUnit);
      setDefaultPrice(item.defaultPrice.toString());
    } else {
      setEditingItem(null);
      setName("");
      setDefaultQuantity("1");
      setDefaultUnit("kg");
      setDefaultPrice("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !defaultQuantity || !defaultUnit || !defaultPrice) {
      toast.error("Please fill all fields");
      return;
    }
    saveMutation.mutate({
      name,
      defaultQuantity: parseFloat(defaultQuantity),
      defaultUnit,
      defaultPrice: parseFloat(defaultPrice),
    });
  };

  if (!isMounted) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between" }}>
        <div style={{ flex: 1 }}>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Inventory Items</h1>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "2px" }}>Manage your products and default prices.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary" style={{ background: "#0D9488", padding: "10px 16px" }}>
          <Plus style={{ width: "16px", height: "16px" }} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Search */}
      <div className="premium-card" style={{ padding: "20px" }}>
        <div className="relative w-full max-w-md">
          <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94A3B8" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="form-input" style={{ paddingLeft: "40px", width: "100%" }} />
        </div>
      </div>

      {/* Active Items Table */}
      <div className="premium-card">
        <div style={{ padding: "20px", borderBottom: "1px solid #F1F5F9" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>Active Items</h2>
        </div>
        <div style={{ padding: "20px" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "64px", borderRadius: "16px" }} />)}
            </div>
          ) : activeItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Package style={{ width: "48px", height: "48px", color: "#CBD5E1", margin: "0 auto 12px" }} />
              <p style={{ color: "#64748B", fontWeight: 600 }}>No items found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Item Name</th>
                    <th style={{ textAlign: "left" }}>Default Qty</th>
                    <th style={{ textAlign: "right" }}>Default Price</th>
                    <th style={{ textAlign: "center", width: "120px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item) => (
                    <tr key={item.id} className="group">
                      <td style={{ fontWeight: 600, color: "#0F172A" }}>{item.name}</td>
                      <td style={{ color: "#64748B" }}>{item.defaultQuantity} {item.defaultUnit}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>{formatCurrency(item.defaultPrice)}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <button onClick={() => openModal(item)} className="btn-icon-edit" title="Edit">
                            <Edit style={{ width: "16px", height: "16px" }} />
                          </button>
                          <button onClick={() => setItemToDelete({ id: item.id, name: item.name })} className="btn-icon-danger" title="Delete">
                            <Trash2 style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Trash Bin */}
      {deletedItems.length > 0 && (
        <div className="premium-card">
          <div style={{ padding: "20px", borderBottom: "1px solid #F1F5F9" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#DC2626" }}>Trash Bin</h2>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full data-table opacity-70">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Item Name</th>
                    <th style={{ textAlign: "center", width: "120px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: "#0F172A", textDecoration: "line-through" }}>{item.name}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <button onClick={() => deleteMutation.mutate({ id: item.id, restore: true })} className="btn-icon-success" title="Restore">
                            <RotateCcw style={{ width: "16px", height: "16px" }} />
                          </button>
                          <button onClick={() => setItemToArchive({ id: item.id, name: item.name })} className="btn-icon-danger" title="Permanently Delete">
                            <X style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyItems: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={closeModal} />
          <div className="premium-card" style={{ position: "relative", width: "100%", maxWidth: "500px", padding: "24px", margin: "0 auto", animation: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A" }}>{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: "4px" }}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Item Name <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Pure Cow Ghee" className="form-input w-full" />
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Default Qty <span style={{ color: "#DC2626" }}>*</span></label>
                  <input type="number" step="any" min="0" value={defaultQuantity} onChange={(e) => setDefaultQuantity(e.target.value)} required className="form-input w-full" />
                </div>
                <div style={{ width: "120px" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Unit <span style={{ color: "#DC2626" }}>*</span></label>
                  <CustomSelect
                    value={defaultUnit}
                    onChange={setDefaultUnit}
                    className="w-full"
                    options={[
                      { label: "kg", value: "kg" },
                      { label: "gm", value: "gm" },
                      { label: "l", value: "l" },
                      { label: "ml", value: "ml" },
                      { label: "pc", value: "pc" }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Default Price (₹) <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="number" step="any" min="0" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} required placeholder="e.g. 720" className="form-input w-full" />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#64748B", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: "10px" }} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <AnimatePresence>
        {itemToDelete && (
          <ConfirmModal title="Delete Item" message={`Are you sure you want to delete ${itemToDelete.name}?`} confirmText="Move to Trash" onConfirm={() => { deleteMutation.mutate({ id: itemToDelete.id }); setItemToDelete(null); }} onCancel={() => setItemToDelete(null)} />
        )}
        {itemToArchive && (
          <ConfirmModal title="Permanently Delete Item" message={`Are you sure you want to permanently delete ${itemToArchive.name}? This action cannot be undone.`} confirmText="Permanently Delete" variant="danger" onConfirm={() => { deleteMutation.mutate({ id: itemToArchive.id, archive: true }); setItemToArchive(null); }} onCancel={() => setItemToArchive(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
