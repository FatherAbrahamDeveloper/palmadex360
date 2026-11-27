import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ShieldCheck, Printer, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { qaApi, getErrorMessage } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  QA_STATUS, evaluateRow, RESULT_STYLE, RESULT_LABEL, rangeText, unitSuffix,
  formatDay, formatDateTime, printChecklist, OVERRIDE_ROLES,
} from "./qaShared";

function OptionChip({ active, disabled, onClick, children, bad }) {
  return (
    <button
      type="button" disabled={disabled} onClick={onClick} aria-pressed={active}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? (bad ? "border-red-500 bg-red-50 text-red-800" : "border-primary bg-primary text-primary-foreground") : "bg-card hover:border-primary/50",
        disabled && !active && "opacity-60",
        disabled && "cursor-default"
      )}
    >
      {active && "✓ "}{children}
    </button>
  );
}

function ResultLine({ result }) {
  if (!result || result.status === "MISSING") return null;
  const Icon = result.status === "PASS" ? CheckCircle2 : result.status === "FAIL" ? XCircle : result.status === "WARN" ? AlertTriangle : Info;
  return (
    <p className={cn("mt-1 flex items-center gap-1 text-xs", RESULT_STYLE[result.status])}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {RESULT_LABEL[result.status]}{result.message ? `: ${result.message}` : ""}
    </p>
  );
}

function Row({ index, p, answer, onChange, readOnly, result }) {
  const set = (patch) => onChange(p.key, { ...answer, ...patch });
  const failed = result?.status === "FAIL";
  return (
    <div className={cn("grid gap-2 border-b px-3 py-3 sm:grid-cols-[2rem_11rem_1fr] sm:items-start", failed && "bg-red-50/70 dark:bg-red-950/20")}>
      <span className="text-xs font-semibold text-muted-foreground sm:pt-1.5">{index + 1}</span>
      <div className="sm:pt-1">
        <p className="text-sm font-semibold leading-tight">{p.label}</p>
        {p.critical === false && p.type !== "TEXT" && <p className="text-[11px] text-muted-foreground">Recorded only</p>}
        {p.help && <p className="text-[11px] text-muted-foreground mt-0.5">{p.help}</p>}
      </div>
      <div className="min-w-0">
        {p.type === "CHOICE" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {p.options.map((o) => (
              <OptionChip key={o.label} active={answer.option === o.label} bad={o.acceptable === false} disabled={readOnly}
                onClick={() => set({ option: answer.option === o.label ? null : o.label })}>
                {o.label}
              </OptionChip>
            ))}
            {p.measure && (
              <div className="flex items-center gap-1.5 sm:ml-2">
                <Label className="text-xs text-muted-foreground" htmlFor={`m-${p.key}`}>Measured</Label>
                <Input id={`m-${p.key}`} type="number" inputMode="decimal" step="any" className="h-8 w-24" disabled={readOnly}
                  value={answer.value ?? ""} onChange={(e) => set({ value: e.target.value === "" ? null : e.target.value })} />
                {p.unit && <span className="text-xs text-muted-foreground">{p.unit}</span>}
              </div>
            )}
          </div>
        )}
        {p.type === "CONFIRM" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">{p.requirement}</span>
            <div className="flex gap-1.5">
              <OptionChip active={answer.confirmed === true} disabled={readOnly} onClick={() => set({ confirmed: answer.confirmed === true ? null : true })}>Yes</OptionChip>
              <OptionChip active={answer.confirmed === false} bad disabled={readOnly} onClick={() => set({ confirmed: answer.confirmed === false ? null : false })}>No</OptionChip>
            </div>
          </div>
        )}
        {p.type === "NUMBER" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input type="number" inputMode="decimal" step="any" className="h-8 w-28" disabled={readOnly} aria-label={p.label}
              value={answer.value ?? ""} onChange={(e) => set({ value: e.target.value === "" ? null : e.target.value })} />
            {p.unit && <span className="text-xs text-muted-foreground">{p.unit}</span>}
            {(p.min != null || p.max != null) && <span className="text-xs text-muted-foreground">Limit: {rangeText(p.min, p.max, p.unit)}</span>}
          </div>
        )}
        {p.type === "TEXT" && (
          <Input className="h-8" disabled={readOnly} aria-label={p.label} value={answer.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
        )}
        <ResultLine result={result} />
      </div>
    </div>
  );
}

export default function ChecklistDialog({ open, onOpenChange, checkId, onChanged }) {
  const { user } = useAuth();
  const canWrite = canAccess(user, "procurement", "EDIT");
  const canOverride = OVERRIDE_ROLES.includes(user?.role);

  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [header, setHeader] = useState({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signed, setSigned] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const apply = (c) => {
    setCheck(c);
    setAnswers(c.answers || {});
    setHeader({
      cropYear: c.cropYear || "", containerNumber: c.containerNumber || "",
      inspectionDate: c.inspectionDate ? String(c.inspectionDate).slice(0, 10) : "",
      generalComment: c.generalComment || "", inspectorName: c.inspectorName || "",
    });
    setDirty(false);
  };

  const load = useCallback(async (id) => {
    setLoading(true);
    setLoadError(null);
    try { apply(await qaApi.get(id)); }
    catch (err) { setLoadError(getErrorMessage(err, "Could not load the quality check")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open && checkId) { setCheck(null); setSigned(false); setReason(""); load(checkId); }
  }, [open, checkId, load]);

  const editable = check?.status === "DRAFT" && canWrite;
  const live = useMemo(() => {
    if (!check) return {};
    if (check.results && !editable) return Object.fromEntries(check.results.map((r) => [r.key, r]));
    return Object.fromEntries(check.parameters.map((p) => [p.key, evaluateRow(p, answers[p.key])]));
  }, [check, answers, editable]);
  const liveList = Object.values(live);
  const failing = check ? check.parameters.filter((p) => live[p.key]?.status === "FAIL") : [];
  const missing = check ? check.parameters.filter((p) => live[p.key]?.status === "MISSING") : [];

  const onAnswer = (key, value) => { setAnswers((a) => ({ ...a, [key]: value })); setDirty(true); };
  const onHeader = (k, v) => { setHeader((h) => ({ ...h, [k]: v })); setDirty(true); };

  const payload = () => ({
    ...header,
    inspectionDate: header.inspectionDate || undefined,
    answers: Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, {
      ...a, value: a?.value === null || a?.value === undefined || a?.value === "" ? null : Number(a.value),
    }])),
  });

  async function save(quiet) {
    setBusy(true);
    try {
      const c = await qaApi.update(check.id, payload());
      apply(c);
      if (!quiet) toast.success("Draft saved");
      onChanged?.();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save the checklist"));
      return false;
    } finally { setBusy(false); }
  }

  async function submit() {
    setConfirmSubmit(false);
    if (dirty && !(await save(true))) return;
    setBusy(true);
    try {
      const c = await qaApi.submit(check.id, { inspectorName: header.inspectorName, signed: true });
      apply(c);
      onChanged?.();
      if (c.status === "FAILED") toast.error("Quality check failed. Loading is blocked until an administrator reviews it.", { duration: 8000 });
      else toast.success("Quality check passed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not submit the checklist"));
    } finally { setBusy(false); }
  }

  async function override() {
    setBusy(true);
    try {
      apply(await qaApi.override(check.id, { reason: reason.trim() }));
      setReason("");
      toast.success("Failure released. Loading can continue.");
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not override"));
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try {
      await qaApi.remove(check.id);
      toast.success("Draft deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the draft"));
    } finally { setBusy(false); }
  }

  const status = check && QA_STATUS[check.status];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v && dirty && editable && !window.confirm("Discard unsaved changes?")) return; onOpenChange(v); }}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          {loading && !check ? (
            <div className="space-y-3 p-6"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
          ) : loadError ? (
            <div className="space-y-3 p-8 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => load(checkId)}>Try again</Button>
            </div>
          ) : check ? (
            <>
              <DialogHeader className="border-b px-6 pt-6 pb-4">
                <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
                  <span className="font-mono text-sm text-muted-foreground">{check.inspectionNumber}</span>
                  <Badge variant="secondary" className={status.className}>{status.label}</Badge>
                </DialogTitle>
                <DialogDescription className="text-base font-semibold text-foreground">{check.templateName}</DialogDescription>
                <p className="text-xs text-muted-foreground">
                  {[check.purchaseRequest && `Purchase request ${check.purchaseRequest.requestNumber}`, check.supplier?.companyName, check.shipment && `Shipment ${check.shipment.shipmentNumber}`].filter(Boolean).join(" · ") || "Not linked to a purchase request or shipment"}
                </p>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                {check.status === "FAILED" && check.supersededBy && (
                  <div className="rounded-xl border bg-muted/50 p-4 text-sm">
                    <p className="flex items-center gap-2 font-semibold"><Info className="h-5 w-5" /> Replaced by a newer check</p>
                    <p className="mt-1">This container was checked again in {check.supersededBy.inspectionNumber} ({QA_STATUS[check.supersededBy.status]?.label.toLowerCase()}). This failure is kept as a record and no longer blocks loading.</p>
                    <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">{check.failureSummary?.split("\n").map((l) => <li key={l}>{l}</li>)}</ul>
                  </div>
                )}
                {check.status === "FAILED" && !check.supersededBy && (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:bg-red-950/30 dark:text-red-200">
                    <p className="flex items-center gap-2 font-semibold"><XCircle className="h-5 w-5" /> This consignment failed the quality check</p>
                    <p className="mt-1 text-sm">Loading{check.shipment ? ` and shipment ${check.shipment.shipmentNumber}` : ""} is blocked{check.purchaseRequest ? `, and ${check.purchaseRequest.requestNumber} cannot be completed` : ""}. {canOverride ? "As an administrator you can review and release it below." : "Please contact the administrator for further updates."}</p>
                    <ul className="mt-2 list-disc pl-5 text-sm">{check.failureSummary?.split("\n").map((l) => <li key={l}>{l}</li>)}</ul>
                  </div>
                )}
                {check.status === "OVERRIDDEN" && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5" /> Failure released by {check.overriddenBy?.name || "an administrator"} on {formatDateTime(check.overriddenAt)}</p>
                    <p className="mt-1 text-sm"><b>Reason:</b> {check.overrideReason}</p>
                    <p className="mt-2 text-xs">Original failure: {check.failureSummary?.replace(/\n/g, "; ")}</p>
                  </div>
                )}
                {check.status === "PASSED" && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> All critical parameters are within specification</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5"><Label>Crop year</Label><Input disabled={!editable} placeholder="e.g. 2026/2027" value={header.cropYear} onChange={(e) => onHeader("cropYear", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Date</Label><Input type="date" disabled={!editable} value={header.inspectionDate} onChange={(e) => onHeader("inspectionDate", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Container no.</Label><Input disabled={!editable} placeholder="e.g. MSCU1234567" value={header.containerNumber} onChange={(e) => onHeader("containerNumber", e.target.value.toUpperCase())} /></div>
                </div>

                <div>
                  <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide">Quality specifications (tick appropriately)</p>
                  <div className="overflow-hidden rounded-xl border">
                    {check.parameters.map((p, i) => (
                      <Row key={p.key} index={i} p={p} answer={answers[p.key] || {}} onChange={onAnswer} readOnly={!editable} result={live[p.key]} />
                    ))}
                  </div>
                  {editable && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {liveList.filter((r) => r.status !== "MISSING").length} of {check.parameters.length} rows completed
                      {failing.length > 0 && <span className="ml-2 font-medium text-red-700">· {failing.length} out of spec</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>General comment</Label>
                  <Textarea rows={2} disabled={!editable} value={header.generalComment} onChange={(e) => onHeader("generalComment", e.target.value)} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>Name</Label><Input disabled={!editable} value={header.inspectorName} onChange={(e) => onHeader("inspectorName", e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label>Sign / date</Label>
                    {check.signedAt ? (
                      <p className="flex h-9 items-center text-sm">Signed electronically {formatDateTime(check.signedAt)}</p>
                    ) : editable ? (
                      <label className="flex h-9 items-center gap-2 text-sm">
                        <Checkbox checked={signed} onCheckedChange={(v) => setSigned(v === true)} />
                        I confirm this checklist is accurate
                      </label>
                    ) : <p className="flex h-9 items-center text-sm text-muted-foreground">Not signed yet</p>}
                  </div>
                </div>

                {check.status === "FAILED" && !check.supersededBy && canOverride && (
                  <div className="space-y-2 rounded-xl border p-4">
                    <Label htmlFor="override-reason">Release this failure (administrators only)</Label>
                    <Textarea id="override-reason" rows={2} placeholder="Why can loading go ahead? For example: buyer accepted the moisture level in writing." value={reason} onChange={(e) => setReason(e.target.value)} />
                    <div className="flex justify-end">
                      <Button size="sm" disabled={busy || reason.trim().length < 10} onClick={override}><ShieldCheck className="mr-1 h-4 w-4" /> Override and release</Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Created by {check.createdBy?.name || "unknown"} on {formatDay(check.createdAt)}
                  {check.submittedAt && ` · submitted ${formatDateTime(check.submittedAt)}`}
                  {` · checklist version ${check.templateVersion}`}
                </p>
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t bg-card px-6 py-3">
                <div className="flex gap-2">
                  {check.canDelete && canWrite && <Button variant="outline" size="sm" className="text-destructive" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete draft</Button>}
                  <Button variant="outline" size="sm" onClick={() => { if (!printChecklist({ ...check, answers })) toast.error("Allow pop-ups to print the checklist"); }}><Printer className="mr-1 h-4 w-4" /> Print</Button>
                </div>
                {editable && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={busy || !dirty} onClick={() => save(false)}>Save draft</Button>
                    <Button size="sm" disabled={busy || missing.length > 0 || !signed || !header.inspectorName.trim()} onClick={() => setConfirmSubmit(true)}
                      title={missing.length ? `Complete: ${missing.map((m) => m.label).join(", ")}` : !signed ? "Tick the confirmation to sign" : undefined}>
                      Submit checklist
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{failing.length ? "Submit a failing checklist?" : "Submit this checklist?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {failing.length
                ? `${failing.map((f) => f.label).join(", ")} ${failing.length === 1 ? "is" : "are"} out of specification. Submitting records a failed check, blocks loading and alerts the administrators.`
                : "The checklist is locked once submitted. To correct it later, start a new check for the same container."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>{check?.inspectionNumber} has not been submitted. Deleting it cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={busy}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
