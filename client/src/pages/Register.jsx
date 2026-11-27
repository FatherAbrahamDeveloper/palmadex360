import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Building2, Phone, Loader2, MailCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput, { passwordProblems } from "@/components/auth/PasswordInput";
import FaceCapture from "@/components/auth/FaceCapture";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/services/api";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { firstName: "", lastName: "", organization: "", phone: "", email: "", password: "", confirmPassword: "", accountType: "CUSTOMER" };

const ACCOUNT_TYPES = [
  { id: "CUSTOMER", title: "Buyer / customer", text: "Place export orders and track shipments" },
  { id: "STAFF", title: "Palmadex staff", text: "Work in the modules your administrator assigns" },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [faceImage, setFaceImage] = useState("");
  const [faceConsent, setFaceConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const update = (field) => (e) => setForm((c) => ({ ...c, [field]: e.target.value }));
  const problems = passwordProblems(form.password);

  function next(e) {
    e.preventDefault();
    setError("");
    if (problems.length) return setError(`Password needs ${problems.join(", ")}.`);
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setStep(2);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!faceImage) return setError("Take a face photo to continue.");
    if (!faceConsent) return setError("Please agree to the face photo notice.");
    try {
      setLoading(true);
      const { confirmPassword, ...payload } = form;
      const res = await register({ ...payload, faceImage, faceConsent });
      if (res.token) navigate("/"); // the very first account becomes Super Admin
      else setDone(res);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
      if (err?.response?.status === 409) setStep(1);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to activate your account">
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">
            We sent a verification link to <span className="font-medium text-foreground">{form.email}</span>. After you verify, an administrator will review your details and approve your account. We will email you when it is ready.
          </p>
          <Button asChild className="w-full"><Link to="/login">Back to sign in</Link></Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={step === 1 ? "Step 1 of 2: your details" : "Step 2 of 2: identity photo"}
      footer={<>Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></>}
    >
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

      {step === 1 ? (
        <form onSubmit={next} className="space-y-4">
          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">I am registering as</legend>
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.id} type="button" onClick={() => setForm((c) => ({ ...c, accountType: t.id }))}
                aria-pressed={form.accountType === t.id}
                className={cn("rounded-lg border p-3 text-left transition-colors", form.accountType === t.id ? "border-primary bg-primary/5" : "hover:bg-muted")}
              >
                <span className="block text-sm font-medium">{t.title}</span>
                <span className="block text-xs text-muted-foreground">{t.text}</span>
              </button>
            ))}
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">{form.accountType === "CUSTOMER" ? "Company name" : "Department or team (optional)"}</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="organization" autoComplete="organization" className="pl-10" value={form.organization} onChange={update("organization")} required={form.accountType === "CUSTOMER"} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="email" type="email" autoComplete="email" className="pl-10" value={form.email} onChange={update("email")} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="phone" type="tel" autoComplete="tel" className="pl-10" value={form.phone} onChange={update("phone")} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={update("password")} aria-describedby="password-hint" required />
            <p id="password-hint" className={cn("text-xs", form.password && problems.length ? "text-amber-700" : "text-muted-foreground")}>
              {form.password && problems.length ? `Still needs ${problems.join(", ")}.` : "At least 8 characters, with a letter and a number."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput id="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={update("confirmPassword")} required />
          </div>

          <Button type="submit" className="w-full">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">Take a clear photo of your face. It helps us confirm who we are dealing with before your account is approved.</p>
          <FaceCapture value={faceImage} onChange={setFaceImage} consent={faceConsent} onConsentChange={setFaceConsent} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button type="submit" className="flex-1" disabled={loading || !faceImage || !faceConsent}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Creating account" /> : "Create account"}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
