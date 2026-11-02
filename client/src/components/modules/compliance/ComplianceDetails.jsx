
import React, { useEffect, useState } from "react";
import { complianceApi } from "@/services/api";
import api, { getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Trash2,
  Clock,
  Loader2,
  ExternalLink,
  History,
  AlertCircle,
} from "lucide-react";

const statusConfig = {
  COMPLIANT: {
    label: "Compliant",
    style: "bg-primary/10 text-primary",
  },
  IN_REVIEW: {
    label: "In Review",
    style: "bg-chart-4/10 text-chart-4",
  },
  ACTION_REQUIRED: {
    label: "Action Required",
    style: "bg-destructive/10 text-destructive",
  },
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not specified";

export default function ComplianceDetails({
  open,
  onOpenChange,
  item,
  onUpdated,
}) {
  const [details, setDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDetails = async () => {
    if (!item?.id) return;

    setLoading(true);
    setError("");

    try {
      const [detailRes, historyRes] = await Promise.all([
        complianceApi.get(item.id),
        complianceApi.history(item.id),
      ]);

      setDetails(detailRes.data);
      setHistory(historyRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load requirement details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && item?.id) loadDetails();
  }, [open, item?.id]);

  const uploadDocument = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);

        const uploadRes = await api.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const uploaded = uploadRes.data.files?.[0];

        if (!uploaded?.id) {
          throw new Error("File uploaded but its ID was not returned.");
        }

        await complianceApi.attachDocument(item.id, {
          fileId: uploaded.id,
        });
      }

      await loadDetails();
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload document."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = async (documentId) => {
    if (!window.confirm("Remove this document from the requirement?")) return;

    try {
      await complianceApi.removeDocument(item.id, documentId);
      await loadDetails();
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove document."));
    }
  };

  const current = details || item;
  const status = statusConfig[current?.status] || statusConfig.IN_REVIEW;

  const documents = current?.documents || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error && !details ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadDetails}>Try again</Button>
          </div>
        ) : current ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-6">
                <div>
                  <DialogTitle>{current.title}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {current.region}
                    {current.authority ? ` · ${current.authority}` : ""}
                  </DialogDescription>
                </div>
                <Badge className={status.style}>{status.label}</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Compliance progress
                  </span>
                  <span className="text-sm font-semibold">
                    {current.score ?? 0}%
                  </span>
                </div>
                <Progress value={current.score ?? 0} className="h-2" />
              </section>

              {current.description && (
                <section>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {current.description}
                  </p>
                </section>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Reference</p>
                  <p className="font-medium">{current.reference || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Due date</p>
                  <p className="font-medium">{formatDate(current.dueDate)}</p>
                </div>
              </div>

              {current.notes && (
                <section>
                  <h4 className="text-sm font-semibold mb-2">Internal Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {current.notes}
                  </p>
                </section>
              )}

              <div className="border-t pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Documents</h4>
                    <p className="text-xs text-muted-foreground">
                      Certificates, permits and supporting documents
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={uploading}
                    onClick={() =>
                      document.getElementById("compliance-upload").click()
                    }
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </Button>

                  <input
                    id="compliance-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={uploadDocument}
                  />
                </div>

                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                    No documents attached yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const file = doc.file || doc;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 border rounded-lg p-3"
                        >
                          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {file.originalName || file.name || "Document"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.size
                                ? `${(file.size / 1024).toFixed(0)} KB`
                                : "Attached document"}
                            </p>
                          </div>

                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              title="View document"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeDocument(doc.id)}
                            title="Remove document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">Activity History</h4>
                </div>

                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="mt-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {entry.action || entry.description || "Requirement updated"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.user?.firstName
                              ? `${entry.user.firstName} ${entry.user.lastName || ""}`
                              : "Team member"}
                            {" · "}
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
