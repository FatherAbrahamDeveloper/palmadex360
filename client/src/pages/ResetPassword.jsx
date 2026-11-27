import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput, { passwordProblems } from "@/components/auth/PasswordInput";
import { authApi, getErrorMessage } from "@/services/api";

// Used for password resets and for invited users setting their first password.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const invite = params.get("invite") === "1";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const problems = passwordProblems(password);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (problems.length) return setError(`Password needs ${problems.join(", ")}.`);
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, password });
      navigate("/login", { replace: true, state: { message: res.message } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={invite ? "Set your password" : "Choose a new password"} subtitle={invite ? "Welcome to Palmadex 360" : "Your old password will stop working"} footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
      {!token ? (
        <p className="text-sm text-muted-foreground">This link is incomplete. <Link className="text-primary underline" to="/forgot-password">Request a new one</Link>.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}{/expired|invalid/i.test(error) && <> <Link className="underline" to="/forgot-password">Request a new link</Link>.</>}</div>}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="text-xs text-muted-foreground">At least 8 characters, with a letter and a number.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "Save password"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
