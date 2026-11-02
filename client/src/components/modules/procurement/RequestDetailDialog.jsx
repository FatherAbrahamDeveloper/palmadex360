import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { procurementApi, getErrorMessage } from "@/services/api";
import {
  STATUS_LABELS, statusStyles, formatDate, formatItem, formatMoney,
} from "./PurchaseRequestRow";

const ACTION_LABELS = {
  APPROVED: "Approve",
  REJECTED: "Reject",
  IN_PROGRESS: "Start procurement",
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel request",
};

const DESTRUCTIVE = ["REJECTED", "CANCELLED"];

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

export default function RequestDetailDialog({ open, onOpenChange, requestId, onChanged, onEdit, onDeleted }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async (id) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await procurementApi.get(id);
      setRequest(res.data);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Failed to load the request"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && requestId) {
      setRequest(null);
      setNote("");
      setNoteError(null);
      load(requestId);
    }
  }, [open, requestId, load]);

  async function changeStatus(status) {
    if (status === "REJECTED" && !note.trim()) {
      setNoteError("A reason is required when rejecting");
      return;
    }
    setNoteError(null);
    setBusy(true);
    try {
      const res = await procurementApi.changeStatus(request.id, { status, note: note.trim() || null });
      setRequest(res.data);
      setNote("");
      toast.success(`Request ${STATUS_LABELS[status].toLowerCase()}`);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update the status"));
      load(request.id); // refresh in case someone else changed it
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await procurementApi.remove(request.id);
      toast.success("Request deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the request"));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {loading && !request ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : loadError ? (
            <div className="space-y-3 text-center py-4">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => load(requestId)}>Try again</Button>
            </div>
          ) : request ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{request.requestNumber}</span>
                  <Badge variant="secondary" className={statusStyles[request.status]}>
                    {STATUS_LABELS[request.status]}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{formatItem(request)}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <Detail label="Supplier">{request.supplierName}</Detail>
                <Detail label="Estimated cost">
                  {request.estimatedCost !== null ? formatMoney(request.estimatedCost, request.currency) : "Not set"}
                </Detail>
                <Detail label="Requested">{formatDate(request.createdAt)}</Detail>
                <Detail label="Needed by">{formatDate(request.requiredByDate)}</Detail>
              </div>

              {request.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
                </div>
              )}

              {request.allowedStatuses.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <Label>Note (required when rejecting)</Label>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                  {noteError && <p className="text-xs text-destructive">{noteError}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {request.allowedStatuses.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={DESTRUCTIVE.includes(status) ? "outline" : "default"}
                        className={DESTRUCTIVE.includes(status) ? "text-destructive" : ""}
                        disabled={busy}
                        onClick={() => changeStatus(status)}
                      >
                        {ACTION_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">History</p>
                <ul className="divide-y rounded-md border">
                  {request.events.map((e) => (
                    <li key={e.id} className="p-3 text-sm">
                      <p className="font-medium">
                        {e.fromStatus ? `${STATUS_LABELS[e.fromStatus]} → ` : ""}{STATUS_LABELS[e.toStatus]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                        {e.changedBy ? ` · ${e.changedBy.name}` : ""}
                      </p>
                      {e.note && <p className="text-xs mt-1">{e.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {request.canDelete ? (
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                ) : <span />}
                {request.canEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(request)}>Edit details</Button>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {request?.requestNumber} and its history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}