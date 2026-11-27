import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Takes a live photo with the device camera for identity verification.
// It is reviewed by a Palmadex administrator; it is not used for automatic recognition or sign-in.
export const FACE_NOTICE =
  "Palmadex 360 keeps a photo of your face to confirm who we are dealing with. An administrator compares it with your details when approving your account. It is stored securely, only visible to you and authorised administrators, and is not used to sign you in or shared with anyone else.";

export default function FaceCapture({ value, onChange, consent, onConsentChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | starting | live | error
  const [error, setError] = useState("");

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("This browser cannot use the camera. Try Chrome, Edge or Safari on a device with a camera.");
      return;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      setStatus("live");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      setStatus("error");
      setError(err?.name === "NotAllowedError"
        ? "Camera access was blocked. Allow camera access in your browser's address bar, then try again."
        : "We could not start your camera. Check that no other app is using it.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const width = 480;
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // Mirror back so the saved photo is not flipped.
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    onChange(canvas.toDataURL("image/jpeg", 0.85));
    stop();
    setStatus("idle");
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
        {value ? (
          <img src={value} alt="Your face photo" className="h-full w-full object-cover" />
        ) : status === "live" ? (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover -scale-x-100" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-3/4 aspect-[3/4] rounded-[50%] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>
          </>
        ) : status === "starting" ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Starting camera" />
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Camera className="mx-auto mb-2 h-8 w-8" />
            Face the camera in good light, without sunglasses or a hat.
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="flex gap-2">
        {value ? (
          <Button type="button" variant="outline" className="flex-1" onClick={() => { onChange(""); start(); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retake photo
          </Button>
        ) : status === "live" ? (
          <Button type="button" className="flex-1" onClick={capture}>
            <Camera className="mr-2 h-4 w-4" /> Take photo
          </Button>
        ) : (
          <Button type="button" variant="outline" className="flex-1" onClick={start} disabled={status === "starting"}>
            <Camera className="mr-2 h-4 w-4" /> {status === "error" ? "Try again" : "Turn on camera"}
          </Button>
        )}
      </div>
      {value && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Photo captured
        </p>
      )}

      <label className="flex items-start gap-3 rounded-lg border p-3 text-xs leading-relaxed text-muted-foreground">
        <Checkbox checked={!!consent} onCheckedChange={(v) => onConsentChange(v === true)} className="mt-0.5" aria-label="I agree to the face photo notice" />
        <span>{FACE_NOTICE}</span>
      </label>
    </div>
  );
}
