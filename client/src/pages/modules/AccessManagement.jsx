import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Settings, UserPlus, Search, Loader2, AlertCircle, Check, X, Mail, KeyRound, Unlock, LogOut,
  ShieldOff, Trash2, RotateCcw, Save, ScanFace,
} from "lucide-react";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userApi, accessApi, customerApi, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ROLES, roleLabel, canAccess } from "@/lib/roleConfig";
import { cn, formatDate, timeAgo, prettyEnum } from "@/lib/utils";

const STATUS_STYLE = {
  PENDING: "bg-amber-500 text-white", ACTIVE: "bg-emerald-600 text-white", INACTIVE: "bg-slate-400 text-white", REJECTED: "bg-destructive text-white",
};
const FACE_STYLE = { NONE: "text-muted-foreground", PENDING: "text-amber-600", APPROVED: "text-emerald-600", REJECTED: "text-destructive" };
const LEVEL_STYLE = { NONE: "text-muted-foreground", VIEW: "text-sky-700", EDIT: "text-amber-700", FULL: "text-emerald-700" };
const PRIVILEGED = ["SUPER_ADMIN", "ADMIN"];

function useRoles() {
  const [meta, setMeta] = useState(null);
  useEffect(() => { accessApi.meta().then(setMeta).catch(() => {}); }, []);
  return meta;
}

function RoleSelect({ value, onChange, roles, actor, id }) {
  const options = (roles || []).filter((r) => actor?.role === "SUPER_ADMIN" || !PRIVILEGED.includes(r.id));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}><SelectValue placeholder="Choose a role" /></SelectTrigger>
      <SelectContent>
        {options.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function CustomerSelect({ value, onChange, customers, id, allowNew = true }) {
  return (
    <Select value={value || "__new"} onValueChange={(v) => onChange(v === "__new" ? "" : v)}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>
        {allowNew && <SelectItem value="__new">Create a new customer record</SelectItem>}
        {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.country ? ` (${c.country})` : ""}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function FacePhoto({ userId, status, canReview, onReviewed }) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let objectUrl;
    if (status === "NONE") { setUrl(""); return undefined; }
    userApi.face(userId).then((b) => { objectUrl = URL.createObjectURL(b); setUrl(objectUrl); }).catch(() => setUrl(""));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [userId, status]);

  async function review(decision) {
    setBusy(true);
    try {
      await userApi.reviewFace(userId, { decision, note });
      toast.success(decision === "APPROVED" ? "Identity verified" : "Photo rejected; the user will be asked to retake it");
      onReviewed();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 rounded-lg border p-3">
      {url ? <img src={url} alt="Identity photo" className="w-36 h-28 object-cover rounded-md border" /> : (
        <div className="w-36 h-28 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground text-center p-2">No photo yet</div>
      )}
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2"><ScanFace className="h-4 w-4" /> Identity photo: <span className={FACE_STYLE[status]}>{status === "PENDING" ? "awaiting review" : prettyEnum(status)}</span></p>
        <p className="text-xs text-muted-foreground">Compare the photo with the person's name, organisation and any ID you hold before approving.</p>
        {canReview && status !== "NONE" && status !== "APPROVED" && (
          <div className="flex flex-wrap gap-2 items-center">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note if rejecting (optional)" className="h-8 max-w-[220px]" aria-label="Rejection note" />
            <Button size="sm" onClick={() => review("APPROVED")} disabled={busy}><Check className="h-3.5 w-3.5 mr-1" /> Verify</Button>
            <Button size="sm" variant="outline" onClick={() => review("REJECTED")} disabled={busy}><X className="h-3.5 w-3.5 mr-1" /> Reject</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserDialog({ userId, open, onOpenChange, roles, customers, onChanged }) {
  const { user: actor } = useAuth();
  const [u, setU] = useState(null);
  const [form, setForm] = useState({});
  const [approval, setApproval] = useState({ role: "", customerId: "", customerName: "" });
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const canEdit = canAccess(actor, "access", "EDIT");
  const canFull = canAccess(actor, "access", "FULL");

  const closeRef = React.useRef(onOpenChange);
  closeRef.current = onOpenChange;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await userApi.get(userId);
      setU(data);
      setForm({ firstName: data.firstName, lastName: data.lastName, phone: data.phone || "", organization: data.organization || "", role: data.role, isActive: data.isActive, customerId: data.customerId || "" });
      setApproval({ role: data.requestedRole || (data.role === "VIEWER" ? "" : data.role), customerId: "", customerName: data.organization || "" });
    } catch (err) { toast.error(getErrorMessage(err)); closeRef.current(false); }
  }, [userId]);

  useEffect(() => { if (open) { setU(null); load(); } }, [open, load]);

  const run = async (fn, success) => {
    setBusy(true);
    try { const res = await fn(); toast.success(success || res?.message || "Saved"); await load(); onChanged(); return res; }
    catch (err) { toast.error(getErrorMessage(err)); return null; }
    finally { setBusy(false); }
  };

  const isSelf = u?.id === actor?.id;
  const lockedByRank = u && actor?.role !== "SUPER_ADMIN" && PRIVILEGED.includes(u.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        {!u ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                {u.firstName} {u.lastName}
                <Badge className={STATUS_STYLE[u.status]}>{prettyEnum(u.status)}</Badge>
              </DialogTitle>
              <DialogDescription>
                {u.email}{u.phone ? ` · ${u.phone}` : ""}{u.organization ? ` · ${u.organization}` : ""} · joined {formatDate(u.createdAt)}
                {u.lastLoginAt ? ` · last sign-in ${timeAgo(u.lastLoginAt)}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className={cn("rounded-full px-2 py-0.5 border", u.emailVerified ? "text-emerald-700" : "text-amber-700")}>{u.emailVerified ? "Email verified" : "Email not verified"}</span>
              <span className="rounded-full px-2 py-0.5 border">{u.twoFactorEnabled ? "Two-step sign-in on" : "Two-step sign-in off"}</span>
              {u.locked && <span className="rounded-full px-2 py-0.5 border text-destructive">Locked after failed sign-ins</span>}
              {u.requestedRole && <span className="rounded-full px-2 py-0.5 border">Registered as {roleLabel(u.requestedRole)}</span>}
            </div>

            <FacePhoto userId={u.id} status={u.faceStatus} canReview={canEdit} onReviewed={() => { load(); onChanged(); }} />

            {u.approvalStatus === "PENDING" && canEdit && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
                <p className="font-medium text-sm">Approve this registration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ap-role">Role</Label>
                    <RoleSelect id="ap-role" value={approval.role} onChange={(role) => setApproval((a) => ({ ...a, role }))} roles={roles} actor={actor} />
                  </div>
                  {approval.role === "CUSTOMER" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="ap-cust">Customer</Label>
                      <CustomerSelect id="ap-cust" value={approval.customerId} onChange={(customerId) => setApproval((a) => ({ ...a, customerId }))} customers={customers} />
                    </div>
                  )}
                  {approval.role === "CUSTOMER" && !approval.customerId && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="ap-cname">New customer name</Label>
                      <Input id="ap-cname" value={approval.customerName} onChange={(e) => setApproval((a) => ({ ...a, customerName: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy || !approval.role} onClick={() => run(() => userApi.approve(u.id, approval), "Account approved and the user has been emailed")}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejecting (optional)" className="flex-1 min-w-[180px]" aria-label="Rejection reason" />
                  <Button variant="outline" disabled={busy} onClick={() => run(() => userApi.reject(u.id, { reason }), "Registration rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
                </div>
              </div>
            )}

            {u.approvalStatus === "APPROVED" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="u-fn">First name</Label><Input id="u-fn" value={form.firstName} disabled={!canEdit || lockedByRank} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="u-ln">Last name</Label><Input id="u-ln" value={form.lastName} disabled={!canEdit || lockedByRank} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="u-ph">Phone</Label><Input id="u-ph" value={form.phone} disabled={!canEdit || lockedByRank} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="u-org">Organisation</Label><Input id="u-org" value={form.organization} disabled={!canEdit || lockedByRank} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label htmlFor="u-role">Role</Label>
                    {canEdit && !isSelf && !lockedByRank ? (
                      <RoleSelect id="u-role" value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} roles={roles} actor={actor} />
                    ) : <Input id="u-role" value={roleLabel(form.role)} disabled />}
                  </div>
                  {form.role === "CUSTOMER" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="u-cust">Customer</Label>
                      <CustomerSelect id="u-cust" value={form.customerId} onChange={(customerId) => setForm((f) => ({ ...f, customerId }))} customers={customers} />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={!!form.isActive} disabled={!canEdit || isSelf || lockedByRank} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                  Account active {isSelf && <span className="text-xs text-muted-foreground">(you cannot deactivate yourself)</span>}
                </label>
                {canEdit && !lockedByRank && (
                  <Button disabled={busy} onClick={() => run(() => userApi.update(u.id, { ...form, customerId: form.customerId || null }), "User updated")}>
                    <Save className="h-4 w-4 mr-1" /> Save changes
                  </Button>
                )}
              </div>
            )}

            {canEdit && !lockedByRank && (
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Account actions</p>
                <div className="flex flex-wrap gap-2">
                  {!u.emailVerified && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => userApi.action(u.id, "resend-verification"))}><Mail className="h-3.5 w-3.5 mr-1" /> Resend verification</Button>}
                  {!u.emailVerified && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => userApi.action(u.id, "mark-verified"), "Email marked as verified")}><Check className="h-3.5 w-3.5 mr-1" /> Mark email verified</Button>}
                  {u.approvalStatus === "APPROVED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => userApi.action(u.id, "send-password-reset"))}><KeyRound className="h-3.5 w-3.5 mr-1" /> Send password reset</Button>}
                  {u.locked && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => userApi.action(u.id, "unlock"), "Account unlocked")}><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</Button>}
                  {!isSelf && u.approvalStatus === "APPROVED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => userApi.action(u.id, "sign-out"))}><LogOut className="h-3.5 w-3.5 mr-1" /> Sign out everywhere</Button>}
                  {canFull && u.twoFactorEnabled && !isSelf && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => userApi.action(u.id, "disable-2fa"), "Two-step sign-in turned off")}><ShieldOff className="h-3.5 w-3.5 mr-1" /> Turn off two-step sign-in</Button>}
                  {canFull && u.approvalStatus !== "APPROVED" && (
                    <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={async () => {
                      if (!window.confirm(`Delete the registration for ${u.email}? This cannot be undone.`)) return;
                      const ok = await run(() => userApi.remove(u.id), "Registration deleted");
                      if (ok !== null) onOpenChange(false);
                    }}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete registration</Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({ open, onOpenChange, roles, customers, onDone }) {
  const { user: actor } = useAuth();
  const empty = { firstName: "", lastName: "", email: "", phone: "", organization: "", role: "SALES", customerId: "", newCustomerName: "" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setForm(empty); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await userApi.invite({ ...form, customerId: form.customerId || null, newCustomerName: form.newCustomerName || form.organization || null });
      toast.success(`Invitation sent to ${form.email}`);
      onOpenChange(false);
      onDone();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>They get an email to set their own password. They will be asked for an identity photo the first time they sign in.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="i-fn">First name</Label><Input id="i-fn" value={form.firstName} onChange={set("firstName")} required /></div>
          <div className="space-y-1.5"><Label htmlFor="i-ln">Last name</Label><Input id="i-ln" value={form.lastName} onChange={set("lastName")} required /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="i-em">Email</Label><Input id="i-em" type="email" value={form.email} onChange={set("email")} required /></div>
          <div className="space-y-1.5"><Label htmlFor="i-ph">Phone</Label><Input id="i-ph" value={form.phone} onChange={set("phone")} /></div>
          <div className="space-y-1.5"><Label htmlFor="i-role">Role</Label><RoleSelect id="i-role" value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} roles={roles} actor={actor} /></div>
          {form.role === "CUSTOMER" && (
            <>
              <div className="space-y-1.5"><Label htmlFor="i-cust">Customer</Label><CustomerSelect id="i-cust" value={form.customerId} onChange={(customerId) => setForm((f) => ({ ...f, customerId }))} customers={customers} /></div>
              {!form.customerId && <div className="space-y-1.5"><Label htmlFor="i-org">Company name</Label><Input id="i-org" value={form.organization} onChange={set("organization")} required /></div>}
            </>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : "Send invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UsersTab({ roles, customers, statsKey, onChanged }) {
  const [params, setParams] = useSearchParams();
  const { user: actor } = useAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") || "ALL");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const openId = params.get("user");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await userApi.list({ q: q || undefined, status: status === "ALL" ? undefined : status, role: role === "ALL" ? undefined : role, page }));
    } catch (err) { setError(getErrorMessage(err, "Could not load users")); }
  }, [q, status, role, page]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load, statsKey]);
  useEffect(() => setPage(1), [q, status, role]);

  const openUser = (id) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set("user", id); else n.delete("user"); return n; });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, email or organisation" className="pl-9" aria-label="Filter users" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-48" aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Awaiting approval</SelectItem>
            <SelectItem value="FACE_PENDING">Face photo to review</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="md:w-48" aria-label="Role"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {(roles || []).map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {canAccess(actor, "access", "EDIT") && <Button onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4 mr-1" /> Invite user</Button>}
      </div>

      {error ? (
        <div className="surface p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : !data ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : data.data.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">No users match these filters.</div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Identity</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Last sign-in</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id} onClick={() => openUser(u.id)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openUser(u.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}{u.customer ? ` · ${u.customer.name}` : u.organization ? ` · ${u.organization}` : ""}</p>
                  </td>
                  <td className="px-4 py-3"><span className={cn("inline-block px-2 py-1 rounded-full text-xs font-medium", ROLES[u.role]?.color)}>{roleLabel(u.role)}</span></td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block px-2 py-1 rounded-full text-xs font-medium", STATUS_STYLE[u.status])}>{u.status === "PENDING" ? "Awaiting approval" : prettyEnum(u.status)}</span>
                    {!u.emailVerified && <span className="block text-[11px] text-amber-700 mt-1">Email not verified</span>}
                  </td>
                  <td className={cn("px-4 py-3 hidden md:table-cell text-xs", FACE_STYLE[u.faceStatus])}>{u.faceStatus === "NONE" ? "No photo" : u.faceStatus === "PENDING" ? "To review" : prettyEnum(u.faceStatus)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <UserDialog userId={openId} open={!!openId} onOpenChange={(o) => !o && openUser(null)} roles={roles} customers={customers} onChanged={() => { load(); onChanged(); }} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} roles={roles} customers={customers} onDone={() => { load(); onChanged(); }} />
    </div>
  );
}

function PermissionsTab({ meta }) {
  const { user: actor, refresh } = useAuth();
  const editable = actor?.role === "SUPER_ADMIN";
  const [matrix, setMatrix] = useState(null);
  const [changes, setChanges] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => accessApi.matrix().then((m) => { setMatrix(m); setChanges({}); }).catch((err) => toast.error(getErrorMessage(err))), []);
  useEffect(() => { load(); }, [load]);

  const value = (role, module) => changes[`${role}:${module}`] ?? matrix.find((r) => r.role === role)?.permissions[module] ?? "NONE";
  const pending = Object.keys(changes).length;
  const customerModules = ["portal", "communication", "support", "knowledge"];

  async function save() {
    setSaving(true);
    try {
      const list = Object.entries(changes).map(([k, access]) => { const [role, module] = k.split(":"); return { role, module, access }; });
      setMatrix(await accessApi.update(list));
      setChanges({});
      await refresh();
      toast.success("Permissions saved. They apply immediately.");
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function reset(role) {
    if (!window.confirm(`Reset ${roleLabel(role)} to the default permissions?`)) return;
    try { setMatrix(await accessApi.reset(role)); setChanges({}); toast.success("Defaults restored"); } catch (err) { toast.error(getErrorMessage(err)); }
  }

  if (!matrix || !meta) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          <strong>View</strong> opens the module read-only. <strong>Edit</strong> also creates and updates records. <strong>Full</strong> also deletes and approves. Super Admin always has full access.
          {!editable && " Only a Super Admin can change these settings."}
        </p>
        {editable && (
          <div className="flex gap-2 shrink-0">
            {pending > 0 && <Button variant="ghost" onClick={() => setChanges({})}>Discard</Button>}
            <Button onClick={save} disabled={!pending || saving}><Save className="h-4 w-4 mr-1" /> Save {pending ? `${pending} change${pending > 1 ? "s" : ""}` : ""}</Button>
          </div>
        )}
      </div>
      <div className="surface overflow-x-auto">
        <table className="text-xs min-w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 bg-muted px-3 py-2 text-left font-medium min-w-[160px]">Role</th>
              {meta.modules.map((m) => <th key={m.id} className="px-2 py-2 font-medium text-left whitespace-nowrap">{m.label.replace(/ \(.*\)/, "")}</th>)}
            </tr>
          </thead>
          <tbody>
            {meta.roles.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="sticky left-0 bg-card px-3 py-2 align-top">
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">{r.description}</p>
                  {editable && r.id !== "SUPER_ADMIN" && <button type="button" onClick={() => reset(r.id)} className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><RotateCcw className="h-3 w-3" /> Defaults</button>}
                </td>
                {meta.modules.map((m) => {
                  const v = value(r.id, m.id);
                  const locked = !editable || r.id === "SUPER_ADMIN" || (r.id === "CUSTOMER" && !customerModules.includes(m.id));
                  const changed = changes[`${r.id}:${m.id}`] !== undefined;
                  return (
                    <td key={m.id} className={cn("px-1 py-2", changed && "bg-amber-50")}>
                      <select
                        aria-label={`${r.label} access to ${m.label}`}
                        value={v} disabled={locked}
                        onChange={(e) => setChanges((c) => ({ ...c, [`${r.id}:${m.id}`]: e.target.value }))}
                        className={cn("rounded border bg-transparent px-1 py-1 text-xs disabled:opacity-70", LEVEL_STYLE[v])}
                      >
                        {meta.levels.map((l) => <option key={l} value={l}>{l === "NONE" ? "None" : prettyEnum(l)}</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AccessManagement() {
  const meta = useRoles();
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [statsKey, setStatsKey] = useState(0);

  const loadStats = useCallback(() => userApi.stats().then(setStats).catch(() => {}), []);
  useEffect(() => { loadStats(); customerApi.options().then(setCustomers).catch(() => {}); }, [loadStats, statsKey]);

  const cards = useMemo(() => stats ? [
    ["Total users", stats.total], ["Awaiting approval", stats.pending], ["Active", stats.active],
    ["Inactive", stats.inactive], ["Face photos to review", stats.facePending],
  ] : [], [stats]);

  return (
    <ModulePageShell title="User & Access Management" description="Approve registrations, assign roles and control what each role can do" icon={Settings}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats ? cards.map(([label, value]) => (
          <div key={label} className="surface p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          </div>
        )) : [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Roles & permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab roles={meta?.roles} customers={customers} statsKey={statsKey} onChanged={() => setStatsKey((k) => k + 1)} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <PermissionsTab meta={meta} />
        </TabsContent>
      </Tabs>
    </ModulePageShell>
  );
}
