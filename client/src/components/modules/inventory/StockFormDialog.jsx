import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { inventoryApi, getErrorMessage } from "@/services/api"; // adjust path

const EMPTY = { warehouseId: "", productId: "", quantity: "", unit: "ton", capacity: "", reorderLevel: "" };

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function StockFormDialog({ open, onOpenChange, warehouses, defaultWarehouseId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const activeWarehouses = warehouses.filter((w) => w.isActive);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, warehouseId: defaultWarehouseId || "" });
    setErrors({});
    inventoryApi.productOptions().then(setProducts).catch(() => setProducts([]));
  }, [open, defaultWarehouseId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickProduct = (id) => {
    const product = products.find((p) => p.id === id);
    setForm((f) => ({ ...f, productId: id, unit: product?.unit || f.unit }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.warehouseId) found.warehouseId = "Select a warehouse";
    if (!form.productId) found.productId = "Select a product";
    if (form.quantity !== "" && !(Number(form.quantity) >= 0)) found.quantity = "Enter 0 or more";
    setErrors(found);
    if (Object.keys(found).length) return;

    const numOrNull = (v) => (v === "" ? null : v);
    setSaving(true);
    try {
      await inventoryApi.create({
        warehouseId: form.warehouseId,
        productId: form.productId,
        quantity: form.quantity === "" ? 0 : form.quantity,
        unit: form.unit.trim() || "ton",
        capacity: numOrNull(form.capacity),
        reorderLevel: numOrNull(form.reorderLevel),
      });
      toast.success("Stock item added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not add the stock item"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Stock Item</DialogTitle>
          <DialogDescription>Start tracking a product in a warehouse. Opening stock is logged as a receipt.</DialogDescription>
        </DialogHeader>

        {activeWarehouses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add an active warehouse first.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Warehouse" error={errors.warehouseId}>
              <Select value={form.warehouseId} onValueChange={(v) => setForm((f) => ({ ...f, warehouseId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                <SelectContent>
                  {activeWarehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Product" error={errors.productId}>
              <Select value={form.productId} onValueChange={pickProduct}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Opening quantity" error={errors.quantity}>
                <Input type="number" min="0" step="any" value={form.quantity} onChange={set("quantity")} placeholder="0" />
              </Field>
              <Field label="Unit" error={errors.unit}>
                <Input value={form.unit} onChange={set("unit")} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Capacity (optional)" error={errors.capacity}>
                <Input type="number" min="0" step="any" value={form.capacity} onChange={set("capacity")} />
              </Field>
              <Field label="Reorder level (optional)" error={errors.reorderLevel}>
                <Input type="number" min="0" step="any" value={form.reorderLevel} onChange={set("reorderLevel")} />
              </Field>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add item"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}