import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qaApi, getErrorMessage } from "@/services/api";

const NONE = "none";
const today = () => new Date().toISOString().slice(0, 10);
const cropYear = () => { const d = new Date(); const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${y + 1}`; };

// Picks the checklist whose commodity best matches the purchase request's item name.
// Generic words (dried, raw, seed…) don't count, so "Hibiscus flower (dried)" finds hibiscus, not ginger.
const GENERIC = new Set(["dried", "dry", "raw", "split", "whole", "seed", "seeds", "bean", "beans", "nut", "nuts", "flower", "flowers", "grade", "natural", "white", "hardwood", "loading"]);
const words = (s) => s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !GENERIC.has(w));
const guessTemplate = (templates, itemName = "") => {
  const name = itemName.toLowerCase();
  const itemWords = new Set(words(itemName));
  let best = null;
  let bestScore = 0;
  for (const t of templates) {
    const score = name.includes(t.commodity.toLowerCase()) ? 100 : words(t.commodity).filter((w) => itemWords.has(w)).length;
    if (score > bestScore) { best = t; bestScore = score; }
  }
  return best;
};

export default function NewCheckDialog({ open, onOpenChange, purchaseRequestId, onCreated }) {
  const [opts, setOpts] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setOpts(null);
    qaApi.options().then((o) => {
      setOpts(o);
      const pr = o.purchaseRequests.find((p) => p.id === purchaseRequestId);
      setForm({
        templateId: (pr && guessTemplate(o.templates, pr.itemName)?.id) || o.templates[0]?.id || "",
        purchaseRequestId: purchaseRequestId || NONE,
        shipmentId: NONE, containerNumber: "", cropYear: cropYear(), inspectionDate: today(),
      });
    }).catch((err) => setError(getErrorMessage(err, "Could not load checklists")));
  }, [open, purchaseRequestId]);

  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === "purchaseRequestId" && opts) {
      const pr = opts.purchaseRequests.find((p) => p.id === v);
      const t = pr && guessTemplate(opts.templates, pr.itemName);
      if (t) next.templateId = t.id;
    }
    return next;
  });

  async function create() {
    if (!form.templateId) { setError("Choose a checklist"); return; }
    setSaving(true);
    setError(null);
    try {
      const c = await qaApi.create({
        templateId: form.templateId,
        purchaseRequestId: form.purchaseRequestId === NONE ? null : form.purchaseRequestId,
        shipmentId: form.shipmentId === NONE ? null : form.shipmentId,
        containerNumber: form.containerNumber.trim() || null,
        cropYear: form.cropYear.trim() || null,
        inspectionDate: form.inspectionDate || undefined,
      });
      toast.success(`${c.inspectionNumber} started`);
      onOpenChange(false);
      onCreated?.(c);
    } catch (err) {
      setError(getErrorMessage(err, "Could not start the quality check"));
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New quality check</DialogTitle>
          <DialogDescription>Start a QA/QC checklist for one container or lot. You can save it as a draft and finish it later.</DialogDescription>
        </DialogHeader>
        {!opts ? (
          <p className="text-sm text-muted-foreground">{error || "Loading checklists…"}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Checklist</Label>
              <Select value={form.templateId} onValueChange={(v) => set("templateId", v)}>
                <SelectTrigger><SelectValue placeholder="Choose a checklist" /></SelectTrigger>
                <SelectContent>{opts.templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Purchase request (optional)</Label>
              <Select value={form.purchaseRequestId} onValueChange={(v) => set("purchaseRequestId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not linked</SelectItem>
                  {opts.purchaseRequests.map((p) => <SelectItem key={p.id} value={p.id}>{p.requestNumber} · {p.itemName} · {p.supplierName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Shipment (optional)</Label>
              <Select value={form.shipmentId} onValueChange={(v) => set("shipmentId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not linked</SelectItem>
                  {opts.shipments.map((s) => <SelectItem key={s.id} value={s.id}>{s.shipmentNumber} · {s.destinationPort} · {s.status.replace("_", " ").toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">If this check fails, the linked shipment cannot move to Loading until an administrator releases it.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Container no.</Label><Input value={form.containerNumber} onChange={(e) => set("containerNumber", e.target.value.toUpperCase())} placeholder="MSCU1234567" /></div>
              <div className="space-y-1.5"><Label>Crop year</Label><Input value={form.cropYear} onChange={(e) => set("cropYear", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.inspectionDate} onChange={(e) => set("inspectionDate", e.target.value)} /></div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!opts || saving} onClick={create}>Start checklist</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
