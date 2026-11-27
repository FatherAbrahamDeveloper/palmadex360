import React, { useState } from "react";
import { Loader2, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import FaceCapture from "@/components/auth/FaceCapture";
import { useAuth } from "@/context/AuthContext";
import { authApi, getErrorMessage } from "@/services/api";

// Shown after sign-in to accounts that have no face photo yet (or whose photo was rejected).
export default function FaceEnrollment() {
  const { user, setUser, logout } = useAuth();
  const [image, setImage] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setSaving(true);
    try {
      const res = await authApi.enrollFace(image);
      setUser(res.user);
      toast.success(res.message);
    } catch (err) {
      setError(getErrorMessage(err, "We could not save your photo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout
      title="Register your face"
      subtitle={user?.faceStatus === "REJECTED" ? "Your previous photo could not be verified. Please take a new one." : "Every Palmadex 360 account needs an identity photo on file."}
      footer={<button type="button" onClick={logout} className="text-primary hover:underline">Sign out</button>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3 text-sm">
          <ScanFace className="h-5 w-5 shrink-0 text-primary" />
          <span>This takes a few seconds. An administrator checks the photo against your details.</span>
        </div>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
        <FaceCapture value={image} onChange={setImage} consent={consent} onConsentChange={setConsent} />
        <Button className="w-full" onClick={submit} disabled={!image || !consent || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : "Submit photo and continue"}
        </Button>
      </div>
    </AuthLayout>
  );
}
