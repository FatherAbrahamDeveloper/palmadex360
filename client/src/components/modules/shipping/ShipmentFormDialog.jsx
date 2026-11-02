import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { shipmentApi, exportOrderApi, getErrorMessage } from "@/services/api"; // adjust path
import { STATUS_LABELS } from "./ShipmentCard";

const EMPTY = {
  vesselName: "", shippingLine: "", voyageNumber: "", bookingNumber: "", billOfLadingNumber: "",
  originPort: "", destinationPort: "", etd: "", eta: "", containerCount: "1",
  status: "BOOKED", notes: "", orderIds: [],
};

const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");

const fromShipment = (s) => ({
  vesselName: s.vesselName,
  shippingLine: s.shippingLine || "",
  voyageNumber: s.voyageNumber || "",
  bookingNumber: s.bookingNumber || "",
  billOfLadingNumber: s.billOfLadingNumber || "",
  originPort: s.originPort,
  destinationPort: s.destinationPort,
  etd: toDateInput(s.etd),
  eta: toDateInput(s.eta),
  containerCount: String(s.containerCount),
  status: s.status,
  notes: s.notes || "",
  orderIds: (s.orders || []).map((o) => o.id),
});

function validate(f) {
  const e = {};
  if (f.vesselName.trim().length < 2) e.vesselName = "Vessel name is required";
  if (f.originPort.trim().length < 2) e.originPort = "Origin port is required";
  if (f.destinationPort.trim().length < 2) e.destinationPort = "Destination port is required";
  const count = Number(f.containerCount);
  if (!Number.isInteger(count) || count < 1) e.containerCount = "Enter at least 1 container";
  if (f.etd && f.eta && f.eta < f.etd) e.eta = "ETA cannot be earlier than ETD";
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

export default function ShipmentFormDialog({ open, onOpenChange, shipment, onSaved, onDeleted }) {
  const isEdit = Boolean(shipment);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [orderOptions, setOrderOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(shipment ? fromShipment(shipment) : EMPTY);
    setErrors({});

    // Offer open orders, plus any already linked to this shipment (even if delivered).
    const linked = shipment?.orders || [];
    exportOrderApi
      .list({ limit: 100 })
      .then((res) => {
        const active = res.data.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
        const merged = new Map([...linked, ...active].map((o) => [o.id, o]));
        setOrderOptions([...merged.values()]);
      })
      .catch(() => setOrderOptions(linked));
  }, [open, shipment]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleOrder = (id) =>
    setForm((f) => ({
      ...f,
      orderIds: f.orderIds.includes(id) ? f.orderIds.filter((x) => x !== id) : [...f.orderIds, id],
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const text = (v) => v.trim() || null;
    const payload = {
      vesselName: form.vesselName.trim(),
      shippingLine: text(form.shippingLine),
      voyageNumber: text(form.voyageNumber),
      bookingNumber: text(form.bookingNumber),
      billOfLadingNumber: text(form.billOfLadingNumber),
      originPort: form.originPort.trim(),
      destinationPort: form.destinationPort.trim(),
      etd: form.etd || null,
      eta: form.eta || null,
      containerCount: Number(form.containerCount),
      status: form.status,
      notes: text(form.notes),
      orderIds: form.orderIds,
    };

    setSaving(true);
    try {
      if (isEdit) await shipmentApi.update(shipment.id, payload);
      else await shipmentApi.create(payload);
      toast.success(isEdit ? "Shipment updated" : "Shipment created");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not save the shipment"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await shipmentApi.remove(shipment.id);
      toast.success("Shipment deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the shipment"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit ${shipment.shipmentNumber}` : "New Shipment"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update shipment details or status." : "The shipment number is generated automatically."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Vessel" error={errors.vesselName}>
                <Input value={form.vesselName} onChange={set("vesselName")} placeholder="e.g. MV Atlantic Cargo" />
              </Field>
              <Field label="Shipping line (optional)" error={errors.shippingLine}>
                <Input value={form.shippingLine} onChange={set("shippingLine")} placeholder="e.g. Maersk" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Origin port" error={errors.originPort}>
                <Input value={form.originPort} onChange={set("originPort")} placeholder="Lagos, NG" />
              </Field>
              <Field label="Destination port" error={errors.destinationPort}>
                <Input value={form.destinationPort} onChange={set("destinationPort")} placeholder="Rotterdam, NL" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="ETD (departure)" error={errors.etd}>
                <Input type="date" value={form.etd} onChange={set("etd")} />
              </Field>
              <Field label="ETA (arrival)" error={errors.eta}>
                <Input type="date" value={form.eta} onChange={set("eta")} />
              </Field>
              <Field label="Containers" error={errors.containerCount}>
                <Input type="number" min="1" step="1" value={form.containerCount} onChange={set("containerCount")} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Voyage no." error={errors.voyageNumber}>
                <Input value={form.voyageNumber} onChange={set("voyageNumber")} />
              </Field>
              <Field label="Booking no." error={errors.bookingNumber}>
                <Input value={form.bookingNumber} onChange={set("bookingNumber")} />
              </Field>
              <Field label="Bill of lading no." error={errors.billOfLadingNumber}>
                <Input value={form.billOfLadingNumber} onChange={set("billOfLadingNumber")} />
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

            <Field label="Linked export orders (optional)" error={errors.orderIds}>
              <div className="max-h-40 overflow-y-auto rounded-md border divide-y">
                {orderOptions.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">No open export orders available.</p>
                ) : (
                  orderOptions.map((o) => (
                    <label key={o.id} className="flex items-center gap-3 p-2.5 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.orderIds.includes(o.id)}
                        onCheckedChange={() => toggleOrder(o.id)}
                      />
                      <span className="font-mono text-xs text-muted-foreground">{o.orderNumber}</span>
                      <span className="truncate">{o.customerName}</span>
                    </label>
                  ))
                )}
              </div>
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
                  {saving ? "Saving..." : isEdit ? "Save changes" : "Create shipment"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this shipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {shipment?.shipmentNumber} and its status history. Linked export orders are not affected.
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