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
import { financeApi, getErrorMessage } from "@/services/api";
import { todayInput, toDateInput, EXPENSE_CATEGORY_LABELS } from "./format";
import CurrencySelect from "./CurrencySelect";

const emptyForm = () => ({
  description: "", category: "OTHER", amount: "", currency: "USD",
  expenseDate: todayInput(), vendor: "", reference: "", notes: "",
});

const fromExpense = (x) => ({
  description: x.description, category: x.category, amount: String(x.amount), currency: x.currency,
  expenseDate: toDateInput(x.expenseDate), vendor: x.vendor || "", reference: x.reference || "", notes: x.notes || "",
});

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ExpenseFormDialog({ open, onOpenChange, expense, onSaved }) {
  const isEdit = Boolean(expense);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(expense ? fromExpense(expense) : emptyForm());
    setErrors({});
  }, [open, expense]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (form.description.trim().length < 2) found.description = "Description is required";
    if (!(Number(form.amount) > 0)) found.amount = "Enter an amount greater than 0";
    if (!form.expenseDate) found.expenseDate = "Required";
    setErrors(found);
    if (Object.keys(found).length) return;

    const text = (v) => v.trim() || null;
    const payload = {
      description: form.description.trim(),
      category: form.category,
      amount: form.amount,
     currency: form.currency,
      expenseDate: form.expenseDate,
      vendor: text(form.vendor),
      reference: text(form.reference),
      notes: text(form.notes),
    };

    setSaving(true);
    try {
      if (isEdit) await financeApi.updateExpense(expense.id, payload);
      else await financeApi.createExpense(payload);
      toast.success(isEdit ? "Expense updated" : "Expense added");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not save the expense"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await financeApi.removeExpense(expense.id);
      toast.success("Expense deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the expense"));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Expense" : "New Expense"}</DialogTitle>
            <DialogDescription>Record money spent by the business.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Description" error={errors.description}>
              <Input value={form.description} onChange={set("description")} placeholder="e.g. Port handling fees" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date" error={errors.expenseDate}>
                <Input type="date" value={form.expenseDate} onChange={set("expenseDate")} />
              </Field>
            </div>

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
              <Field label="Vendor (optional)" error={errors.vendor}>
                <Input value={form.vendor} onChange={set("vendor")} />
              </Field>
              <Field label="Reference (optional)" error={errors.reference}>
                <Input value={form.reference} onChange={set("reference")} />
              </Field>
            </div>

            <Field label="Notes (optional)" error={errors.notes}>
              <Textarea rows={2} value={form.notes} onChange={set("notes")} />
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
                  {saving ? "Saving..." : isEdit ? "Save changes" : "Add expense"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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