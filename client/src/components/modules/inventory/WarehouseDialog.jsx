import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { warehouseApi, getErrorMessage } from "@/services/api"; // adjust path

const EMPTY = { name: "", code: "", city: "", state: "", address: "", isActive: true };

const fromWarehouse = (w) => ({
  name: w.name, code: w.code || "", city: w.city || "", state: w.state || "",
  address: w.address || "", isActive: w.isActive,
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

export default function WarehouseDialog({ open, onOpenChange, warehouse, onSaved, onDeleted }) {
  const isEdit = Boolean(warehouse);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(warehouse ? fromWarehouse(warehouse) : EMPTY);
    setErrors({});
  }, [open, warehouse]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setErrors({ name: "Warehouse name is required" });
      return;
    }
    const text = (v) => v.trim() || null;
    const payload = {
      name: form.name.trim(),
      code: text(form.code),
      city: text(form.city),
      state: text(form.state),
      address: text(form.address),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await warehouseApi.update(warehouse.id, payload);
      else await warehouseApi.create(payload);
      toast.success(isEdit ? "Warehouse updated" : "Warehouse created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not save the warehouse"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await warehouseApi.remove(warehouse.id);
      toast.success("Warehouse deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the warehouse"));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Warehouse" : "New Warehouse"}</DialogTitle>
            <DialogDescription>Where your stock is physically kept.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="Name" error={errors.name}>
                  <Input value={form.name} onChange={set("name")} placeholder="e.g. Lagos Main" />
                </Field>
              </div>
              <Field label="Code (optional)" error={errors.code}>
                <Input value={form.code} onChange={set("code")} placeholder="LOS-01" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="City" error={errors.city}>
                <Input value={form.city} onChange={set("city")} />
              </Field>
              <Field label="State" error={errors.state}>
                <Input value={form.state} onChange={set("state")} />
              </Field>
            </div>

            <Field label="Address" error={errors.address}>
              <Textarea rows={2} value={form.address} onChange={set("address")} />
            </Field>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive warehouses can't receive new stock items.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              {isEdit ? (
                <Button type="button" variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : isEdit ? "Save changes" : "Create warehouse"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {warehouse?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This only works if the warehouse holds no stock items. This cannot be undone.
            </AlertDialogDescription>
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