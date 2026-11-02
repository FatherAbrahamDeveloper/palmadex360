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
import { financeApi, exportOrderApi, getErrorMessage } from "@/services/api";
import { todayInput, inDaysInput, toDateInput, CURRENCIES } from "./format";
import CurrencySelect from "./CurrencySelect";

const NONE = "none";

const emptyForm = () => ({
  exportOrderId: NONE, customerName: "", amount: "", currency: "USD",
  issueDate: todayInput(), dueDate: inDaysInput(30), notes: "",
});

const fromInvoice = (i) => ({
  exportOrderId: i.exportOrderId || NONE,
  customerName: i.customerName,
  amount: String(i.amount),
  currency: i.currency,
  issueDate: toDateInput(i.issueDate),
  dueDate: toDateInput(i.dueDate),
  notes: i.notes || "",
});

function validate(f) {
  const e = {};
  if (f.customerName.trim().length < 2) e.customerName = "Customer name is required";
  if (!(Number(f.amount) > 0)) e.amount = "Enter an amount greater than 0";
  if (!f.issueDate) e.issueDate = "Required";
  if (!f.dueDate) e.dueDate = "Required";
  if (f.issueDate && f.dueDate && f.dueDate < f.issueDate) e.dueDate = "Due date cannot be before the issue date";
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

export default function InvoiceFormDialog({ open, onOpenChange, invoice, onSaved }) {
  const isEdit = Boolean(invoice);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(invoice ? fromInvoice(invoice) : emptyForm());
    setErrors({});
    exportOrderApi
      .list({ limit: 100 })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [open, invoice]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Picking an order pre-fills the customer, amount and currency (still editable).
  const pickOrder = (id) => {
    const order = orders.find((o) => o.id === id);
    setForm((f) =>
      order
        ? {
    ...f,
    exportOrderId: id,
    customerName: order.customerName,
    amount: String(order.totalValue),
    currency: CURRENCIES.includes(order.currency) ? order.currency : f.currency,
  }
        : { ...f, exportOrderId: NONE }
    );
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      customerName: form.customerName.trim(),
      exportOrderId: form.exportOrderId === NONE ? null : form.exportOrderId,
      amount: form.amount,
      currency: form.currency,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      if (isEdit) await financeApi.updateInvoice(invoice.id, payload);
      else await financeApi.createInvoice(payload);
      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not save the invoice"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${invoice.invoiceNumber}` : "New Invoice"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Invoices can be edited until a payment is recorded." : "The invoice number is generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Export order (optional)">
            <Select value={form.exportOrderId} onValueChange={pickOrder}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not linked to an order</SelectItem>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.orderNumber} · {o.customerName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Customer" error={errors.customerName}>
            <Input value={form.customerName} onChange={set("customerName")} placeholder="e.g. Global Foods Inc." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount" error={errors.amount}>
              <Input type="number" min="0" step="any" value={form.amount} onChange={set("amount")} />
            </Field>
            <Field label="Currency" error={errors.currency}>
  <CurrencySelect
    value={form.currency}
    onChange={(v) => setForm((f) => ({ ...f, currency: v }))}
  />
</Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Issue date" error={errors.issueDate}>
              <Input type="date" value={form.issueDate} onChange={set("issueDate")} />
            </Field>
            <Field label="Due date" error={errors.dueDate}>
              <Input type="date" value={form.dueDate} onChange={set("dueDate")} />
            </Field>
          </div>

          <Field label="Notes (optional)" error={errors.notes}>
            <Textarea rows={3} value={form.notes} onChange={set("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}