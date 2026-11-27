import React, { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Plus, AlertCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { qaApi, getErrorMessage } from "@/services/api";
import { cn } from "@/lib/utils";
import { QA_STATUS, formatDay } from "./qaShared";
import NewCheckDialog from "./NewCheckDialog";
import ChecklistDialog from "./ChecklistDialog";

const ALL = "all";

export function QualityCheckRow({ check, onClick }) {
  const s = QA_STATUS[check.status];
  return (
    <div
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn("surface flex cursor-pointer flex-col justify-between gap-2 px-5 py-4 transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center",
        check.status === "FAILED" && !check.supersededBy && "border-red-300")}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{check.inspectionNumber}</span>
          <Badge variant="secondary" className={s.className}>{s.label}</Badge>
        </div>
        <p className="mt-1 truncate text-sm font-medium">{check.commodity}{check.containerNumber ? ` · ${check.containerNumber}` : ""}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[check.purchaseRequest?.requestNumber, check.supplier?.companyName, check.shipment && `Shipment ${check.shipment.shipmentNumber}`, formatDay(check.inspectionDate)].filter(Boolean).join(" · ")}
        </p>
        {check.status === "FAILED" && check.supersededBy && <p className="mt-1 truncate text-xs text-muted-foreground">Replaced by {check.supersededBy.inspectionNumber} · no longer blocking</p>}
        {check.status === "FAILED" && !check.supersededBy && check.failureSummary && <p className="mt-1 truncate text-xs text-red-700">{check.failureSummary.split("\n")[0]}</p>}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{check.inspectorName}</span>
    </div>
  );
}

export default function QualityChecksPanel({ initialCheckId, onCheckClosed }) {
  const { user } = useAuth();
  const canWrite = canAccess(user, "procurement", "EDIT");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, summary: {} });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [openId, setOpenId] = useState(initialCheckId || null);

  useEffect(() => { if (initialCheckId) setOpenId(initialCheckId); }, [initialCheckId]);
  useEffect(() => { const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.list({ page, limit: 20, status: status === ALL ? undefined : status, search: query || undefined });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load quality checks"));
    } finally { setLoading(false); }
  }, [page, status, query]);

  useEffect(() => { load(); }, [load]);

  const counts = meta.summary || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["DRAFT", "PASSED", "FAILED", "OVERRIDDEN"].map((k) => (
          <button key={k} type="button" onClick={() => { setStatus(status === k ? ALL : k); setPage(1); }}
            className={cn("surface px-4 py-3 text-left transition-colors", status === k && "ring-2 ring-primary")}>
            <p className="eyebrow">{QA_STATUS[k].label}</p>
            <p className={cn("font-heading text-2xl font-bold", k === "FAILED" && counts[k] ? "text-red-700" : "")}>{counts[k] || 0}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search check no., commodity, container" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All results</SelectItem>
              {Object.entries(QA_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {canWrite && <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" /> New quality check</Button>}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : error ? (
        <div className="surface space-y-3 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="surface space-y-3 p-10 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="font-semibold">{status === ALL && !query ? "No quality checks yet" : "No checks match"}</h3>
          <p className="text-sm text-muted-foreground">Fill a QA/QC checklist for each container before loading. A failed check blocks loading until an administrator reviews it.</p>
          {canWrite && status === ALL && !query && <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" /> New quality check</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => <QualityCheckRow key={c.id} check={c} onClick={() => setOpenId(c.id)} />)}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <NewCheckDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(c) => { load(); setOpenId(c.id); }} />
      <ChecklistDialog open={!!openId} checkId={openId} onOpenChange={(v) => { if (!v) { setOpenId(null); onCheckClosed?.(); } }} onChanged={load} />
    </div>
  );
}
