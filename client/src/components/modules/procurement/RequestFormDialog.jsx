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
import { procurementApi, getErrorMessage } from "@/services/api";

const CUSTOM = "custom";

const EMPTY = {
  itemName: "", quantity: "", unit: "", estimatedCost: "", currency: "NGN",
  supplierId: CUSTOM, supplierName: "", requiredByDate: "", notes: "",
};

const fromRequest = (r) => ({
  itemName: r.itemName,
  quantity: r.quantity === null ? "" : String(r.quantity),
  unit: r.unit || "",
  estimatedCost: r.estimatedCost === null ? "" : String(r.estimatedCost),
  currency: r.currency,
  supplierId: r.supplierId || CUSTOM,
  supplierName: r.supplierId ? "" : r.supplierName,
  requiredByDate: r.requiredByDate ? String(r.requiredByDate).slice(0, 10) : "",
  notes: r.notes || "",
});

function validate(f) {
  const e = {};
  if (f.itemName.trim().length < 2) e.itemName = "Item is required";
  if (f.supplierId === CUSTOM && f.supplierName.trim().length < 2) e.supplierName = "Enter a supplier name";
  if (f.quantity !== "" && !(Number(f.quantity) > 0)) e.quantity = "Must be greater than 0";
  if (f.estimatedCost !== "" && !(Number(f.estimatedCost) >= 0)) e.estimatedCost = "Enter 0 or more";
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

export default function RequestFormDialog({ open, onOpenChange, request, onSaved }) {
  const isEdit = Boolean(request);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(request ? fromRequest(request) : EMPTY);
    setErrors({});
    procurementApi.supplierOptions().then(setSuppliers).catch(() => setSuppliers([]));
  }, [open, request]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const custom = form.supplierId === CUSTOM;
    const text = (v) => v.trim() || null;
    const numOrNull = (v) => (v === "" ? null : v);
    const payload = {
      itemName: form.itemName.trim(),
      quantity: numOrNull(form.quantity),
      unit: text(form.unit),
      estimatedCost: numOrNull(form.estimatedCost),
      currency: form.currency.trim().toUpperCase() || "NGN",
      supplierId: custom ? null : form.supplierId,
      supplierName: custom ? form.supplierName.trim() : undefined,
      requiredByDate: form.requiredByDate || null,
      notes: text(form.notes),
    };

    setSaving(true);
    try {
      if (isEdit) await procurementApi.update(request.id, payload);
      else await procurementApi.create(payload);
      toast.success(isEdit ? "Request updated" : "Request submitted");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not save the request"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${request.requestNumber}` : "New Purchase Request"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Pending requests can be edited until they are approved." : "The request number is generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Item" error={errors.itemName}>
            <Input value={form.itemName} onChange={set("itemName")} placeholder="e.g. Cocoa Beans, Packaging Materials" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity (optional)" error={errors.quantity}>
              <Input type="number" min="0" step="any" value={form.quantity} onChange={set("quantity")} />
            </Field>
            <Field label="Unit (optional)" error={errors.unit}>
              <Input value={form.unit} onChange={set("unit")} placeholder="tons, bags, pcs" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated cost (optional)" error={errors.estimatedCost}>
              <Input type="number" min="0" step="any" value={form.estimatedCost} onChange={set("estimatedCost")} />
            </Field>
            <Field label="Currency" error={errors.currency}>
              <Input value={form.currency} onChange={set("currency")} maxLength={10} />
            </Field>
          </div>

          <Field label="Supplier">
            <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={CUSTOM}>Other (type a name)</SelectItem>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {form.supplierId === CUSTOM && (
            <Field label="Supplier name" error={errors.supplierName}>
              <Input value={form.supplierName} onChange={set("supplierName")} placeholder="e.g. Lagos Cold Chain" />
            </Field>
          )}

          <Field label="Needed by (optional)" error={errors.requiredByDate}>
            <Input type="date" value={form.requiredByDate} onChange={set("requiredByDate")} />
          </Field>

          <Field label="Notes (optional)" error={errors.notes}>
            <Textarea rows={3} value={form.notes} onChange={set("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}