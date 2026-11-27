import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HeadphonesIcon, Plus, Search, Loader2, AlertCircle, ArrowLeft, Lock, Send, RotateCcw, XCircle, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportApi, portalApi, knowledgeApi, customerApi, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeEvent } from "@/context/RealtimeContext";
import { canAccess } from "@/lib/roleConfig";
import { cn, timeAgo, formatDateTime, prettyEnum } from "@/lib/utils";

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const CATEGORIES = ["GENERAL", "ORDER", "SHIPMENT", "DOCUMENT", "BILLING", "TECHNICAL", "ACCOUNT", "COMPLAINT"];
const STATUS_STYLE = {
  OPEN: "bg-sky-100 text-sky-800", IN_PROGRESS: "bg-amber-100 text-amber-800", WAITING_ON_USER: "bg-violet-100 text-violet-800",
  RESOLVED: "bg-emerald-100 text-emerald-800", CLOSED: "bg-slate-200 text-slate-700",
};
const PRIORITY_STYLE = { LOW: "text-slate-500", MEDIUM: "text-sky-700", HIGH: "text-amber-700", URGENT: "text-destructive font-semibold" };
const statusLabel = (s) => (s === "WAITING_ON_USER" ? "Waiting on you" : prettyEnum(s));

function Pill({ status, agent }) {
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>{agent && status === "WAITING_ON_USER" ? "Waiting on requester" : statusLabel(status)}</span>;
}

function NewTicketDialog({ open, onOpenChange, onCreated, isAgent }) {
  const { user } = useAuth();
  const empty = { subject: "", description: "", category: "GENERAL", priority: "MEDIUM", exportOrderId: "", customerId: "" };
  const [form, setForm] = useState(empty);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(empty);
    if (user.role === "CUSTOMER") portalApi.orders(null, { limit: 50 }).then((r) => setOrders(r.data)).catch(() => {});
    if (isAgent) customerApi.options().then(setCustomers).catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suggest help articles while the person types the subject.
  useEffect(() => {
    if (!open || form.subject.trim().length < 4 || !canAccess(user, "knowledge")) { setSuggestions([]); return undefined; }
    const t = setTimeout(() => knowledgeApi.list({ q: form.subject, limit: 3 }).then((r) => setSuggestions(r.data)).catch(() => {}), 400);
    return () => clearTimeout(t);
  }, [open, form.subject, user]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === "string" ? v : v.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const t = await supportApi.create({ ...form, exportOrderId: form.exportOrderId || null, customerId: form.customerId || null });
      toast.success(`Ticket ${t.ticketNumber} created. We have emailed you a copy.`);
      onOpenChange(false);
      onCreated(t);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAgent ? "New ticket" : "How can we help?"}</DialogTitle>
          <DialogDescription>Describe the issue. You will get replies here and by email.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="t-sub">Subject</Label><Input id="t-sub" value={form.subject} onChange={set("subject")} required minLength={4} /></div>
          {suggestions.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
              <p className="font-medium flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> These articles might answer it:</p>
              {suggestions.map((a) => <a key={a.id} href={`/knowledge/${a.slug}`} target="_blank" rel="noreferrer" className="block text-primary hover:underline">{a.title}</a>)}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-cat">Category</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger id="t-cat"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{prettyEnum(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-pri">Priority</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger id="t-pri"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{prettyEnum(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {orders.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="t-ord">Related order (optional)</Label>
              <Select value={form.exportOrderId || "none"} onValueChange={(v) => set("exportOrderId")(v === "none" ? "" : v)}>
                <SelectTrigger id="t-ord"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific order</SelectItem>
                  {orders.map((o) => <SelectItem key={o.id} value={o.id}>{o.orderNumber} · {o.productName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {isAgent && customers.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="t-cust">On behalf of customer (optional)</Label>
              <Select value={form.customerId || "none"} onValueChange={(v) => set("customerId")(v === "none" ? "" : v)}>
                <SelectTrigger id="t-cust"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Internal ticket</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5"><Label htmlFor="t-desc">Details</Label><Textarea id="t-desc" rows={6} value={form.description} onChange={set("description")} required minLength={10} placeholder="What happened, what you expected, and any order or shipment numbers." /></div>
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : "Submit ticket"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TicketDetail({ id, onBack, onChanged }) {
  const { user } = useAuth();
  const [t, setT] = useState(null);
  const [agents, setAgents] = useState([]);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => supportApi.get(id).then((d) => { setT(d); setResolution(d.resolution || ""); }).catch((err) => { toast.error(getErrorMessage(err)); onBack(); }), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (t?.isAgent && !agents.length) supportApi.agents().then(setAgents).catch(() => {}); }, [t?.isAgent]); // eslint-disable-line react-hooks/exhaustive-deps
  useRealtimeEvent("ticket:updated", (p) => { if (p.id === id) load(); });

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); if (msg) toast.success(msg); await load(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  async function send(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    await act(() => supportApi.reply(id, { body: reply, internal }), internal ? "Note added" : "Reply sent");
    setReply(""); setInternal(false);
  }

  if (!t) return <div className="surface p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading ticket" /></div>;
  const mineOrCustomer = t.createdBy?.id === user.id || (user.customerId && t.customer?.id === user.customerId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="surface p-5">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> All tickets</Button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{t.ticketNumber}</span>
            <Pill status={t.status} agent={t.isAgent} />
            <span className={cn("text-xs", PRIORITY_STYLE[t.priority])}>{prettyEnum(t.priority)} priority</span>
          </div>
          <h2 className="text-lg font-heading font-bold mt-1">{t.subject}</h2>
          <p className="text-xs text-muted-foreground">Opened by {t.createdBy?.name || "a former user"} {timeAgo(t.createdAt)}{t.customer ? ` · ${t.customer.name}` : ""}{t.exportOrder ? ` · order ${t.exportOrder.orderNumber}` : ""}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm">{t.description}</p>
          {t.resolution && t.status === "RESOLVED" && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm"><p className="font-medium text-emerald-800">Resolution</p><p className="whitespace-pre-wrap">{t.resolution}</p></div>}
        </div>

        <div className="surface divide-y">
          {t.messages.length === 0 && <p className="p-5 text-sm text-muted-foreground">No replies yet.</p>}
          {t.messages.map((m) => (
            m.kind === "SYSTEM" ? (
              <p key={m.id} className="px-5 py-2 text-xs text-muted-foreground bg-muted/30">{m.body} · {timeAgo(m.createdAt)}</p>
            ) : (
              <div key={m.id} className={cn("p-5", m.kind === "NOTE" && "bg-amber-50")}>
                <p className="text-sm font-medium flex items-center gap-2">
                  {m.author?.name || "Former user"}
                  {m.author?.role && m.author.role !== "CUSTOMER" && <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">Palmadex</span>}
                  {m.kind === "NOTE" && <span className="text-[10px] rounded bg-amber-200 px-1.5 py-0.5 flex items-center gap-1"><Lock className="h-3 w-3" /> Internal note</span>}
                  <span className="text-xs font-normal text-muted-foreground ml-auto">{formatDateTime(m.createdAt)}</span>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
              </div>
            )
          ))}
        </div>

        {(t.status !== "CLOSED" || t.isAgent) && (
          <form onSubmit={send} className="surface p-4 space-y-3">
            <Label htmlFor="reply" className="sr-only">Reply</Label>
            <Textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={internal ? "Internal note, only visible to the support team" : "Write a reply"} className={cn(internal && "bg-amber-50")} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {t.isAgent ? <label className="flex items-center gap-2 text-sm"><Switch checked={internal} onCheckedChange={setInternal} /> Internal note</label> : <span />}
              <Button type="submit" disabled={busy || !reply.trim()}><Send className="h-4 w-4 mr-1" /> {internal ? "Add note" : "Send reply"}</Button>
            </div>
          </form>
        )}
      </div>

      <aside className="space-y-4">
        {t.isAgent ? (
          <div className="surface p-5 space-y-3">
            <p className="font-medium text-sm">Manage ticket</p>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={t.status} onValueChange={(status) => act(() => supportApi.update(id, { status, ...(status === "RESOLVED" && resolution ? { resolution } : {}) }), "Status updated")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "WAITING_ON_USER" ? "Waiting on requester" : prettyEnum(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Select value={t.assignedTo?.id || "none"} onValueChange={(v) => act(() => supportApi.update(id, { assignedToId: v === "none" ? null : v }), "Assignment updated")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.id === user.id ? " (me)" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={t.priority} onValueChange={(priority) => act(() => supportApi.update(id, { priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{prettyEnum(p)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={t.category} onValueChange={(category) => act(() => supportApi.update(id, { category }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{prettyEnum(c)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res">Resolution summary</Label>
              <Textarea id="res" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Shared with the requester when resolved" />
              <Button size="sm" className="w-full" disabled={busy || !resolution.trim()} onClick={() => act(() => supportApi.update(id, { status: "RESOLVED", resolution }), "Ticket resolved and requester notified")}>Resolve with this summary</Button>
            </div>
            {canAccess(user, "support", "FULL") && (
              <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={async () => {
                if (!window.confirm(`Delete ${t.ticketNumber}? This cannot be undone.`)) return;
                try { await supportApi.remove(id); toast.success("Ticket deleted"); onChanged(); onBack(); } catch (err) { toast.error(getErrorMessage(err)); }
              }}>Delete ticket</Button>
            )}
          </div>
        ) : (
          <div className="surface p-5 space-y-3 text-sm">
            <p><span className="text-muted-foreground">Assigned to:</span> {t.assignedTo?.name || "Our team will pick this up shortly"}</p>
            {mineOrCustomer && ["RESOLVED", "CLOSED"].includes(t.status) && <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={() => act(() => supportApi.reopen(id), "Ticket reopened")}><RotateCcw className="h-4 w-4 mr-1" /> Reopen ticket</Button>}
            {mineOrCustomer && t.status !== "CLOSED" && <Button size="sm" variant="ghost" className="w-full" disabled={busy} onClick={() => act(() => supportApi.close(id), "Ticket closed")}><XCircle className="h-4 w-4 mr-1" /> Close ticket, my issue is solved</Button>}
          </div>
        )}
      </aside>
    </div>
  );
}

export default function Support() {
  const [params, setParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "ACTIVE", priority: "ALL", scope: "all" });
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const ticketId = params.get("t");

  const loadStats = useCallback(() => supportApi.stats().then(setStats).catch(() => {}), []);
  const load = useCallback(async () => {
    try {
      setError("");
      setData(await supportApi.list({
        q: filters.q || undefined, status: filters.status === "ALL" ? undefined : filters.status,
        priority: filters.priority === "ALL" ? undefined : filters.priority, scope: filters.scope, page,
      }));
    } catch (err) { setError(getErrorMessage(err, "Could not load tickets")); }
  }, [filters, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => setPage(1), [filters]);
  useRealtimeEvent("ticket:updated", () => { load(); loadStats(); });

  const openTicket = (id) => setParams((p) => { const n = new URLSearchParams(p); n.delete("new"); if (id) n.set("t", id); else n.delete("t"); return n; });
  const isAgent = stats?.isAgent;
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: typeof v === "string" ? v : v.target.value }));

  const cards = stats ? (isAgent
    ? [["Open", stats.open], ["Unassigned", stats.unassigned], ["Assigned to me", stats.mine], ["Urgent", stats.urgent], ["Avg. resolution", stats.avgResolutionHours != null ? `${stats.avgResolutionHours} h` : "No data"]]
    : [["Open tickets", stats.open], ["Waiting on you", stats.byStatus.WAITING_ON_USER || 0], ["Resolved (30 days)", stats.resolvedLast30Days]]) : [];

  return (
    <ModulePageShell
      title="Support & Ticketing"
      description={isAgent ? "Triage, assign and resolve support requests" : "Raise an issue and follow it to resolution"}
      icon={HeadphonesIcon}
      actions={<Button size="sm" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" /> New ticket</Button>}
    >
      {ticketId ? (
        <TicketDetail id={ticketId} onBack={() => openTicket(null)} onChanged={() => { load(); loadStats(); }} />
      ) : (
        <>
          <div className={cn("grid gap-3", isAgent ? "grid-cols-2 md:grid-cols-5" : "grid-cols-1 sm:grid-cols-3")}>
            {stats ? cards.map(([label, value]) => (
              <div key={label} className="surface p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-2xl font-heading font-bold mt-1">{value}</p>
              </div>
            )) : [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input value={filters.q} onChange={set("q")} placeholder="Filter by ticket number or subject" className="pl-9" aria-label="Filter tickets" />
            </div>
            <Select value={filters.status} onValueChange={set("status")}>
              <SelectTrigger className="md:w-44" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Open and in progress</SelectItem>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={set("priority")}>
              <SelectTrigger className="md:w-36" aria-label="Priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any priority</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{prettyEnum(p)}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAgent && (
              <Select value={filters.scope} onValueChange={set("scope")}>
                <SelectTrigger className="md:w-36" aria-label="Scope"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All tickets</SelectItem><SelectItem value="mine">Assigned to me</SelectItem></SelectContent>
              </Select>
            )}
          </div>

          {error ? (
            <div className="surface p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={load}>Try again</Button>
            </div>
          ) : !data ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : data.data.length === 0 ? (
            <div className="surface p-10 text-center space-y-3">
              <HeadphonesIcon className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tickets here.</p>
              <Button size="sm" onClick={() => setNewOpen(true)}>Raise a ticket</Button>
            </div>
          ) : (
            <div className="surface divide-y">
              {data.data.map((t) => (
                <button key={t.id} type="button" onClick={() => openTicket(t.id)} className="w-full text-left px-5 py-4 hover:bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate"><span className="font-mono text-xs text-muted-foreground mr-2">{t.ticketNumber}</span>{t.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prettyEnum(t.category)} · {t.createdBy?.name || "Former user"}{t.customer ? ` (${t.customer.name})` : ""} · updated {timeAgo(t.updatedAt)}
                      {data.meta.isAgent && ` · ${t.assignedTo ? `assigned to ${t.assignedTo.name}` : "unassigned"}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("text-xs", PRIORITY_STYLE[t.priority])}>{prettyEnum(t.priority)}</span>
                    <Pill status={t.status} agent={data.meta.isAgent} />
                  </div>
                </button>
              ))}
            </div>
          )}
          {data?.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
      <NewTicketDialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) setParams((p) => { const n = new URLSearchParams(p); n.delete("new"); return n; }); }} onCreated={(t) => { load(); loadStats(); openTicket(t.id); }} isAgent={isAgent} />
    </ModulePageShell>
  );
}
