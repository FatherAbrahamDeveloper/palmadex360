import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportOrderApi, getErrorMessage } from "@/services/api"; // adjust path
import { STATUS_LABELS } from "./ExportOrderCard";

const CUSTOM = "custom";

const EMPTY = {
  customerName: "", productId: CUSTOM, productName: "", quantity: "", unit: "ton",
  totalValue: "", currency: "USD", status: "PENDING", notes: "",
};

const fromOrder = (o) => ({
  customerName: o.customerName,
  productId: o.productId || CUSTOM,
  productName: o.productId ? "" : o.productName,
  quantity: String(o.quantity),
  unit: o.unit,
  totalValue: String(o.totalValue),
  currency: o.currency,
  status: o.status,
  notes: o.notes || "",
});

function validate(f) {
  const e = {};
  if (f.customerName.trim().length < 2) e.customerName = "Customer name is required";
  if (f.productId === CUSTOM && f.productName.trim().length < 2) e.productName = "Enter a product name";
  if (!(Number(f.quantity) > 0)) e.quantity = "Enter a quantity greater than 0";
  if (f.totalValue === "" || !(Number(f.totalValue) >= 0)) e.totalValue = "Enter the order value";
  return e;
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ExportOrderFormDialog({ open, onOpenChange, order, onSaved, onDeleted }) {
  const isEdit = Boolean(order);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(order ? fromOrder(order) : EMPTY);
    setErrors({});
    exportOrderApi.productOptions().then(setProducts).catch(() => setProducts([]));
  }, [open, order]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickProduct = (value) => {
    const product = products.find((p) => p.id === value);
    setForm((f) => ({
      ...f,
      productId: value,
      unit: product?.unit || f.unit,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const custom = form.productId === CUSTOM;
    const payload = {
      customerName: form.customerName.trim(),
      productId: custom ? null : form.productId,
      productName: custom ? form.productName.trim() : undefined,
      quantity: form.quantity,
      unit: form.unit.trim() || "ton",
      totalValue: form.totalValue,
      currency: form.currency.trim().toUpperCase() || "USD",
      status: form.status,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      if (isEdit) await exportOrderApi.update(order.id, payload);
      else await exportOrderApi.create(payload);
      toast.success(isEdit ? "Order updated" : "Order created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not save the order"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await exportOrderApi.remove(order.id);
      toast.success("Order deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the order"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit ${order.orderNumber}` : "New Export Order"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update the order details or status." : "The order number is generated automatically."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Customer" error={errors.customerName}>
              <Input value={form.customerName} onChange={set("customerName")} placeholder="e.g. Global Foods Inc." />
            </Field>

            <Field label="Product">
              <Select value={form.productId} onValueChange={pickProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUSTOM}>Other (type a name)</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.productId === CUSTOM && (
              <Field label="Product name" error={errors.productName}>
                <Input value={form.productName} onChange={set("productName")} placeholder="e.g. Cocoa Beans" />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity" error={errors.quantity}>
                <Input type="number" min="0" step="any" value={form.quantity} onChange={set("quantity")} />
              </Field>
              <Field label="Unit" error={errors.unit}>
                <Input value={form.unit} onChange={set("unit")} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Order value" error={errors.totalValue}>
                <Input type="number" min="0" step="any" value={form.totalValue} onChange={set("totalValue")} />
              </Field>
              <Field label="Currency" error={errors.currency}>
                <Input value={form.currency} onChange={set("currency")} maxLength={10} />
              </Field>
            </div>

            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Notes (optional)" error={errors.notes}>
              <Textarea rows={3} value={form.notes} onChange={set("notes")} />
            </Field>

            <DialogFooter className="gap-2 sm:justify-between">
              {isEdit ? (
                <Button type="button" variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : isEdit ? "Save changes" : "Create order"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes {order?.orderNumber}. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}