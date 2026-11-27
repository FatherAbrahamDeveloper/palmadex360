import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Mail, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { authApi, getErrorMessage } from "@/services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginTwoFactor } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  const goHome = () => navigate(location.state?.from?.pathname || "/", { replace: true });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorCode("");
    setInfo("");
    try {
      const res = await login(email, password);
      if (res.twoFactorRequired) setChallenge(res.challengeToken);
      else goHome();
    } catch (err) {
      setError(getErrorMessage(err, "Sign-in failed. Please try again."));
      setErrorCode(err?.response?.data?.code || "");
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginTwoFactor(challenge, code);
      goHome();
    } catch (err) {
      setError(getErrorMessage(err, "That code did not work."));
      if (err?.response?.status === 401 && /expired/i.test(err?.response?.data?.message || "")) setChallenge(null);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      const res = await authApi.resendVerification(email);
      setInfo(res.message);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AuthLayout
      title={challenge ? "Two-step verification" : "Welcome back"}
      subtitle={challenge ? "Enter the 6-digit code from your authenticator app" : "Sign in to your Palmadex 360 account"}
      footer={<>Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link></>}
    >
      {info && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{info}</div>}
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
          {errorCode === "EMAIL_NOT_VERIFIED" && (
            <button type="button" onClick={resend} className="mt-2 block font-medium underline">Send a new verification email</button>
          )}
        </div>
      )}

      {challenge ? (
        <form onSubmit={handleCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Authentication code</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="pl-10 tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus required />
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading || code.length !== 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Verifying" /> : "Verify and sign in"}
          </Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => { setChallenge(null); setCode(""); }}>Back to sign in</button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="email" type="email" autoComplete="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>
            <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Signing in" /> : <><LogIn className="mr-2 h-4 w-4" /> Sign in</>}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
