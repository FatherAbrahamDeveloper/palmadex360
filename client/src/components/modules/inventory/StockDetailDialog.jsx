import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { inventoryApi, getErrorMessage } from "@/services/api"; // adjust path
import { formatQty } from "./StockCard";

const MOVEMENT_LABELS = {
  RECEIPT: "Receive stock (+)",
  ISSUE: "Issue / dispatch (−)",
  ADJUSTMENT: "Adjustment (+ or −)",
};

const EMPTY_MV = { type: "RECEIPT", quantity: "", reference: "", note: "" };

const settingsFrom = (i) => ({
  unit: i.unit,
  capacity: i.capacity === null ? "" : String(i.capacity),
  reorderLevel: i.reorderLevel === null ? "" : String(i.reorderLevel),
});

function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function StockDetailDialog({ open, onOpenChange, item, onChanged, onDeleted }) {
  const [current, setCurrent] = useState(item);
  const [tab, setTab] = useState("movement");
  const [mv, setMv] = useState(EMPTY_MV);
  const [mvErrors, setMvErrors] = useState({});
  const [settings, setSettings] = useState(item ? settingsFrom(item) : {});
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState({ loading: false, error: null, items: [] });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open && item) {
      setCurrent(item);
      setTab("movement");
      setMv(EMPTY_MV);
      setMvErrors({});
      setSettings(settingsFrom(item));
    }
  }, [open, item]);

  const loadHistory = useCallback(async (id) => {
    setHistory((h) => ({ ...h, loading: true, error: null }));
    try {
      const res = await inventoryApi.movements(id, { limit: 20 });
      setHistory({ loading: false, error: null, items: res.data });
    } catch (err) {
      setHistory({ loading: false, error: getErrorMessage(err, "Failed to load history"), items: [] });
    }
  }, []);

  useEffect(() => {
    if (open && tab === "history" && current?.id) loadHistory(current.id);
  }, [open, tab, current?.id, loadHistory]);

  if (!current) return null;

  async function submitMovement(e) {
    e.preventDefault();
    const found = {};
    const qty = Number(mv.quantity);
    if (mv.quantity === "" || Number.isNaN(qty) || qty === 0) found.quantity = "Enter a quantity";
    else if (mv.type !== "ADJUSTMENT" && qty < 0) found.quantity = "Quantity must be greater than 0";
    if (mv.type === "ADJUSTMENT" && !mv.note.trim()) found.note = "A note is required for adjustments";
    setMvErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const res = await inventoryApi.recordMovement(current.id, {
        type: mv.type,
        quantity: mv.quantity,
        reference: mv.reference.trim() || null,
        note: mv.note.trim() || null,
      });
      setCurrent(res.data);
      setMv(EMPTY_MV);
      toast.success("Stock updated");
      onChanged();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        setMvErrors(Object.fromEntries(fieldErrors.map((x) => [x.field, x.message])));
      }
      toast.error(getErrorMessage(err, "Could not record the movement"));
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await inventoryApi.update(current.id, {
        unit: settings.unit.trim() || "ton",
        capacity: settings.capacity === "" ? null : settings.capacity,
        reorderLevel: settings.reorderLevel === "" ? null : settings.reorderLevel,
      });
      setCurrent(res.data);
      toast.success("Settings saved");
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save settings"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await inventoryApi.remove(current.id);
      toast.success("Stock item deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the stock item"));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{current.product.name}</DialogTitle>
            <DialogDescription>
              {current.warehouse.name} · {formatQty(current.quantity, current.unit)} in stock
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="movement">Movement</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="movement">
              <form onSubmit={submitMovement} className="space-y-4 pt-2">
                <Field label="Type">
                  <Select value={mv.type} onValueChange={(v) => setMv((m) => ({ ...m, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label={`Quantity (${current.unit})`}
                  error={mvErrors.quantity}
                  hint={mv.type === "ADJUSTMENT" ? "Use a negative number to reduce stock." : undefined}
                >
                  <Input type="number" step="any" value={mv.quantity} onChange={(e) => setMv((m) => ({ ...m, quantity: e.target.value }))} />
                </Field>
                <Field label="Reference (optional)" error={mvErrors.reference} hint="e.g. an order or shipment number">
                  <Input value={mv.reference} onChange={(e) => setMv((m) => ({ ...m, reference: e.target.value }))} />
                </Field>
                <Field label={mv.type === "ADJUSTMENT" ? "Note (required)" : "Note (optional)"} error={mvErrors.note}>
                  <Textarea rows={2} value={mv.note} onChange={(e) => setMv((m) => ({ ...m, note: e.target.value }))} />
                </Field>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Saving..." : "Record movement"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="history">
              <div className="pt-2">
                {history.loading ? (
                  <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : history.error ? (
                  <p className="text-sm text-destructive">{history.error}</p>
                ) : history.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {history.items.map((m) => (
                      <li key={m.id} className="p-3 text-sm flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{MOVEMENT_LABELS[m.type].split(" (")[0]}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                            {m.createdBy ? ` · ${m.createdBy.name}` : ""}
                          </p>
                          {(m.reference || m.note) && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {[m.reference, m.note].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={m.quantityChange >= 0 ? "font-semibold text-primary" : "font-semibold text-destructive"}>
                            {m.quantityChange > 0 ? "+" : ""}{m.quantityChange.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Balance {m.balanceAfter.toLocaleString()}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {history.items.length === 20 && (
                  <p className="text-xs text-muted-foreground mt-2">Showing the 20 most recent movements.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <form onSubmit={saveSettings} className="space-y-4 pt-2">
                <Field label="Unit">
                  <Input value={settings.unit} onChange={(e) => setSettings((s) => ({ ...s, unit: e.target.value }))} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Capacity" hint="Drives the progress bar">
                    <Input type="number" min="0" step="any" value={settings.capacity} onChange={(e) => setSettings((s) => ({ ...s, capacity: e.target.value }))} />
                  </Field>
                  <Field label="Reorder level" hint="Low-stock alert at or below">
                    <Input type="number" min="0" step="any" value={settings.reorderLevel} onChange={(e) => setSettings((s) => ({ ...s, reorderLevel: e.target.value }))} />
                  </Field>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                    Delete item
                  </Button>
                  <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save settings"}</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this stock item?</AlertDialogTitle>
            <AlertDialogDescription>
              Only possible when the quantity is zero. Its movement history will be removed too.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}