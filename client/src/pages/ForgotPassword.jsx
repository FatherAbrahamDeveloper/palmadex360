import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { authApi, getErrorMessage } from "@/services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      setSent((await authApi.forgotPassword(email)).message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We will email you a link to choose a new one" footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
      {sent ? (
        <div className="space-y-3 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">{sent} The link expires in 1 hour.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="email" type="email" autoComplete="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : "Send reset link"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
