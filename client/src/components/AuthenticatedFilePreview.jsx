
import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { Loader2, FileText, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthenticatedFilePreview({ file, className = "" }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file?.id) {
      setError("File information is unavailable.");
      setLoading(false);
      return;
    }

    let objectUrl;

    const controller = new AbortController();

    const loadFile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/files/${encodeURIComponent(file.id)}/content`,
          {
            responseType: "blob",
            signal: controller.signal,
          }
        );

        objectUrl = URL.createObjectURL(response.data);
        setBlobUrl(objectUrl);
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;

        setError(
          err.response?.status === 404
            ? "File could not be found."
            : err.response?.status === 401
              ? "Your session has expired. Please log in again."
              : "Unable to load this file."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file?.id]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading preview...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center gap-2 p-6 text-center ${className}`}>
        <AlertCircle className="w-7 h-7 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!blobUrl) return null;

  const mimeType = file?.mimeType || "";
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <div className={`space-y-3 ${className}`}>
      {isImage ? (
        <img
          src={blobUrl}
          alt={file.originalName || "Document preview"}
          className="max-w-full max-h-[600px] mx-auto rounded-lg object-contain"
        />
      ) : isPdf ? (
        <iframe
          src={blobUrl}
          title={file.originalName || "PDF preview"}
          className="w-full h-[600px] rounded-lg border"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 py-8">
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Preview is not available for this file type.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground truncate">
          {file.originalName}
        </span>

        <a
          href={blobUrl}
          download={file.originalName || "document"}
          className="shrink-0"
        >
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </a>
      </div>
    </div>
  );
}
