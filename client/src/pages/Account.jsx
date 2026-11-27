import React, { useEffect, useState } from "react";
import { UserCircle, ShieldCheck, KeyRound, ScanFace, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PasswordInput, { passwordProblems } from "@/components/auth/PasswordInput";
import FaceCapture from "@/components/auth/FaceCapture";
import { useAuth } from "@/context/AuthContext";
import { authApi, getErrorMessage } from "@/services/api";
import { roleLabel } from "@/lib/roleConfig";
import { prettyEnum } from "@/lib/utils";

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="surface p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-primary" /></span>
        <div>
          <h2 className="font-heading font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || "", organization: user.organization || "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      setUser((await authApi.updateProfile(form)).user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Section icon={UserCircle} title="Profile" description={`${user.email} · ${roleLabel(user.role)}${user.customer ? ` · ${user.customer.name}` : ""}`}>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="fn">First name</Label><Input id="fn" value={form.firstName} onChange={set("firstName")} required /></div>
        <div className="space-y-2"><Label htmlFor="ln">Last name</Label><Input id="ln" value={form.lastName} onChange={set("lastName")} required /></div>
        <div className="space-y-2"><Label htmlFor="ph">Phone</Label><Input id="ph" type="tel" value={form.phone} onChange={set("phone")} /></div>
        <div className="space-y-2"><Label htmlFor="org">Organisation</Label><Input id="org" value={form.organization} onChange={set("organization")} /></div>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "Save profile"}</Button></div>
      </form>
    </Section>
  );
}

function ChangePassword() {
  const { startSession } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    const problems = passwordProblems(form.newPassword);
    if (problems.length) return toast.error(`New password needs ${problems.join(", ")}.`);
    if (form.newPassword !== form.confirm) return toast.error("New passwords do not match");
    setSaving(true);
    try {
      const res = await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      startSession(res);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Section icon={KeyRound} title="Password" description="Changing your password signs you out on other devices.">
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="cur">Current password</Label><PasswordInput id="cur" value={form.currentPassword} onChange={set("currentPassword")} required /></div>
        <div className="space-y-2"><Label htmlFor="np">New password</Label><PasswordInput id="np" autoComplete="new-password" value={form.newPassword} onChange={set("newPassword")} required /></div>
        <div className="space-y-2"><Label htmlFor="cp">Confirm new password</Label><PasswordInput id="cp" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} required /></div>
        <div className="sm:col-span-3"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "Change password"}</Button></div>
      </form>
    </Section>
  );
}

function TwoFactor() {
  const { user, refresh } = useAuth();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    try { setSetup(await authApi.setupTwoFactor()); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function enable(e) {
    e.preventDefault();
    setBusy(true);
    try {
      toast.success((await authApi.enableTwoFactor(code)).message);
      setSetup(null); setCode(""); await refresh();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function disable(e) {
    e.preventDefault();
    setBusy(true);
    try {
      toast.success((await authApi.disableTwoFactor({ password, code })).message);
      setPassword(""); setCode(""); await refresh();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <Section icon={ShieldCheck} title="Two-step sign-in" description="Ask for a code from an authenticator app (Google or Microsoft Authenticator) whenever you sign in.">
      {user.twoFactorEnabled ? (
        <form onSubmit={disable} className="space-y-4">
          <Badge className="bg-emerald-600">On</Badge>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2"><Label htmlFor="pw2">Password</Label><PasswordInput id="pw2" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="c2">Current code</Label><Input id="c2" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required /></div>
          </div>
          <Button type="submit" variant="outline" disabled={busy}>Turn off two-step sign-in</Button>
        </form>
      ) : setup ? (
        <form onSubmit={enable} className="flex flex-col sm:flex-row gap-6">
          {setup.qrCode && <img src={setup.qrCode} alt="QR code to scan with your authenticator app" className="w-44 h-44 rounded-lg border bg-white p-2" />}
          <div className="space-y-3 flex-1">
            <p className="text-sm">1. Scan the QR code with your authenticator app, or enter this key manually:</p>
            <code className="block break-all rounded bg-muted px-3 py-2 text-sm">{setup.secret}</code>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="c1">2. Enter the 6-digit code it shows</Label>
              <Input id="c1" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || code.length !== 6}>Turn on</Button>
              <Button type="button" variant="ghost" onClick={() => setSetup(null)}>Cancel</Button>
            </div>
          </div>
        </form>
      ) : (
        <Button onClick={begin} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" /> : "Set up two-step sign-in"}</Button>
      )}
    </Section>
  );
}

function FacePhoto() {
  const { user, setUser } = useAuth();
  const [url, setUrl] = useState("");
  const [retake, setRetake] = useState(false);
  const [image, setImage] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let objectUrl;
    authApi.myFace().then((blob) => { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }).catch(() => setUrl(""));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [user.faceStatus]);

  async function save() {
    setSaving(true);
    try {
      const res = await authApi.enrollFace(image);
      setUser(res.user);
      setRetake(false); setImage(""); setConsent(false);
      toast.success(res.message);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  const tone = { APPROVED: "bg-emerald-600", PENDING: "bg-amber-500", REJECTED: "bg-destructive", NONE: "bg-muted-foreground" }[user.faceStatus];
  return (
    <Section icon={ScanFace} title="Identity photo" description="Used by administrators to confirm who you are. It is not used to sign in.">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="space-y-2">
          {url ? <img src={url} alt="Your identity photo" className="w-40 h-32 object-cover rounded-lg border" /> : <div className="w-40 h-32 rounded-lg border bg-muted" />}
          <Badge className={tone}>{user.faceStatus === "PENDING" ? "Awaiting review" : prettyEnum(user.faceStatus)}</Badge>
        </div>
        <div className="flex-1 max-w-md">
          {retake ? (
            <div className="space-y-3">
              <FaceCapture value={image} onChange={setImage} consent={consent} onConsentChange={setConsent} />
              <div className="flex gap-2">
                <Button onClick={save} disabled={!image || !consent || saving}>Submit new photo</Button>
                <Button variant="ghost" onClick={() => setRetake(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setRetake(true)}>Take a new photo</Button>
          )}
        </div>
      </div>
    </Section>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  async function signOutAll() {
    try {
      await authApi.logoutAll();
      logout();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }
  if (!user) return null;
  return (
    <ModulePageShell title="My account & security" description="Your profile, password, two-step sign-in and identity photo" icon={UserCircle}>
      <div className="space-y-6 max-w-4xl">
        <Profile />
        <ChangePassword />
        <TwoFactor />
        <FacePhoto />
        <Section icon={LogOut} title="Sessions" description="Sign out of Palmadex 360 on every device, including this one.">
          <Button variant="outline" onClick={signOutAll}>Sign out everywhere</Button>
        </Section>
      </div>
    </ModulePageShell>
  );
}
