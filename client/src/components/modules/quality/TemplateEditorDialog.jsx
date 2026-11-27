import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qaApi, getErrorMessage } from "@/services/api";
import { ROW_TYPES } from "./qaShared";

const blankRow = () => ({ label: "", type: "NUMBER", unit: "%", min: "", max: "", critical: true, required: true, options: [], measure: false, requirement: "", help: "" });
const blankOption = () => ({ label: "", min: "", max: "", acceptable: true });
const toForm = (t) => ({
  name: t?.name || "", commodity: t?.commodity || "", description: t?.description || "", isActive: t?.isActive ?? true,
  parameters: (t?.parameters || [blankRow()]).map((p) => ({
    ...blankRow(), ...p,
    min: p.min ?? "", max: p.max ?? "", unit: p.unit ?? "", requirement: p.requirement ?? "", help: p.help ?? "",
    options: (p.options || []).map((o) => ({ ...o, min: o.min ?? "", max: o.max ?? "" })),
  })),
});
const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export default function TemplateEditorDialog({ open, onOpenChange, template, onSaved }) {
  const [form, setForm] = useState(toForm(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (open) { setForm(toForm(template)); setError(null); } }, [open, template]);

  const setRow = (i, patch) => setForm((f) => ({ ...f, parameters: f.parameters.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const moveRow = (i, d) => setForm((f) => {
    const list = [...f.parameters]; const j = i + d;
    if (j < 0 || j >= list.length) return f;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...f, parameters: list };
  });
  const setOpt = (i, k, patch) => setRow(i, { options: form.parameters[i].options.map((o, j) => (j === k ? { ...o, ...patch } : o)) });

  async function save() {
    setSaving(true);
    setError(null);
    const body = {
      name: form.name.trim(), commodity: form.commodity.trim(), description: form.description.trim() || null, isActive: form.isActive,
      parameters: form.parameters.map((p) => ({
        ...(p.key ? { key: p.key } : {}),
        label: p.label.trim(), type: p.type, critical: p.type === "TEXT" ? false : p.critical, required: p.required,
        help: p.help?.trim() || null,
        ...(p.type === "CHOICE" ? { measure: p.measure, unit: p.unit || null, options: p.options.map((o) => ({ label: o.label.trim(), min: numOrNull(o.min), max: numOrNull(o.max), acceptable: o.acceptable !== false })) } : {}),
        ...(p.type === "NUMBER" ? { unit: p.unit || null, min: numOrNull(p.min), max: numOrNull(p.max) } : {}),
        ...(p.type === "CONFIRM" ? { requirement: p.requirement.trim() } : {}),
      })),
    };
    try {
      const saved = template?.id ? await qaApi.updateTemplate(template.id, body) : await qaApi.createTemplate(body);
      toast.success(template?.id ? "Checklist updated" : "Checklist created");
      onOpenChange(false);
      onSaved?.(saved);
    } catch (err) {
      const first = err?.response?.data?.errors?.[0];
      setError(first ? `${first.message}` : getErrorMessage(err, "Could not save the checklist"));
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.id ? "Edit checklist" : "New checklist"}</DialogTitle>
          <DialogDescription>
            Rows are filled in by inspectors. Changes apply to new checks only; submitted checks keep the version they were filled with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Checklist name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sesame Seed Loading QA/QC Checklist" /></div>
            <div className="space-y-1.5"><Label>Commodity</Label><Input value={form.commodity} onChange={(e) => setForm({ ...form, commodity: e.target.value })} placeholder="Sesame seed" /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /> Available for new checks</label>

          <div className="space-y-3">
            {form.parameters.map((p, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <span className="pb-2 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                  <div className="min-w-[180px] flex-1 space-y-1"><Label className="text-xs">Parameter</Label><Input value={p.label} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="Moisture content" /></div>
                  <div className="w-48 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={p.type} onValueChange={(v) => setRow(i, { type: v, options: v === "CHOICE" && !p.options.length ? [blankOption(), blankOption()] : p.options })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ROW_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1 pb-0.5">
                    <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => moveRow(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Move down" onClick={() => moveRow(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove row" className="text-destructive" onClick={() => setForm({ ...form, parameters: form.parameters.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                {p.type === "NUMBER" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="w-24 space-y-1"><Label className="text-xs">Unit</Label><Input value={p.unit} onChange={(e) => setRow(i, { unit: e.target.value })} /></div>
                    <div className="w-28 space-y-1"><Label className="text-xs">Minimum</Label><Input type="number" step="any" value={p.min} onChange={(e) => setRow(i, { min: e.target.value })} /></div>
                    <div className="w-28 space-y-1"><Label className="text-xs">Maximum</Label><Input type="number" step="any" value={p.max} onChange={(e) => setRow(i, { max: e.target.value })} /></div>
                  </div>
                )}
                {p.type === "CONFIRM" && (
                  <div className="mt-2 space-y-1"><Label className="text-xs">Requirement to confirm</Label><Input value={p.requirement} onChange={(e) => setRow(i, { requirement: e.target.value })} placeholder="Free from moulds and insects" /></div>
                )}
                {p.type === "CHOICE" && (
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                      <Switch checked={p.measure} onCheckedChange={(v) => setRow(i, { measure: v })} />
                      Inspector also enters a measured value that must fall within the ticked option
                    </label>
                    {p.measure && <div className="w-24 space-y-1"><Label className="text-xs">Unit</Label><Input value={p.unit} onChange={(e) => setRow(i, { unit: e.target.value })} /></div>}
                    {p.options.map((o, k) => (
                      <div key={k} className="flex flex-wrap items-center gap-2">
                        <Input className="h-8 w-36" placeholder="Option" value={o.label} onChange={(e) => setOpt(i, k, { label: e.target.value })} />
                        {p.measure ? (
                          <>
                            <Input className="h-8 w-20" type="number" step="any" placeholder="min" value={o.min} onChange={(e) => setOpt(i, k, { min: e.target.value })} />
                            <Input className="h-8 w-20" type="number" step="any" placeholder="max" value={o.max} onChange={(e) => setOpt(i, k, { max: e.target.value })} />
                          </>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs"><Switch checked={o.acceptable !== false} onCheckedChange={(v) => setOpt(i, k, { acceptable: v })} /> Acceptable</label>
                        )}
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Remove option" onClick={() => setRow(i, { options: p.options.filter((_, j) => j !== k) })}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    {p.options.length < 8 && <Button type="button" variant="outline" size="sm" onClick={() => setRow(i, { options: [...p.options, blankOption()] })}><Plus className="mr-1 h-3.5 w-3.5" /> Option</Button>}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {p.type !== "TEXT" && <label className="flex items-center gap-1.5 text-xs"><Switch checked={p.critical} onCheckedChange={(v) => setRow(i, { critical: v })} /> Failing blocks loading</label>}
                  <label className="flex items-center gap-1.5 text-xs"><Switch checked={p.required} onCheckedChange={(v) => setRow(i, { required: v })} /> Required</label>
                  <Input className="h-8 min-w-[200px] flex-1" placeholder="Help text for the inspector (optional)" value={p.help} onChange={(e) => setRow(i, { help: e.target.value })} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, parameters: [...form.parameters, blankRow()] })}><Plus className="mr-1 h-4 w-4" /> Add row</Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={save}>{template?.id ? "Save changes" : "Create checklist"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
