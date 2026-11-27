import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import { authApi, getErrorMessage } from "@/services/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: "loading", message: "" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode runs effects twice; the token is single-use
    ran.current = true;
    const token = params.get("token");
    if (!token) return setState({ status: "error", message: "This verification link is incomplete." });
    authApi.verifyEmail(token)
      .then((res) => setState({ status: "ok", message: res.message }))
      .catch((err) => setState({ status: "error", message: getErrorMessage(err, "We could not verify your email.") }));
  }, [params]);

  return (
    <AuthLayout title="Email verification" subtitle="Palmadex 360">
      <div className="space-y-4 text-center">
        {state.status === "loading" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" aria-label="Verifying" />}
        {state.status === "ok" && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />}
        {state.status === "error" && <AlertCircle className="mx-auto h-12 w-12 text-destructive" />}
        <p className="text-sm text-muted-foreground">{state.message}</p>
        {state.status !== "loading" && <Button asChild className="w-full"><Link to="/login">Go to sign in</Link></Button>}
      </div>
    </AuthLayout>
  );
}
