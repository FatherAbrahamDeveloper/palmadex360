import React, { useCallback, useEffect, useState } from "react";
import { ShoppingBag, Plus, AlertCircle } from "lucide-react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PurchaseRequestRow, { STATUS_LABELS } from "@/components/modules/procurement/PurchaseRequestRow";
import RequestFormDialog from "@/components/modules/procurement/RequestFormDialog";
import RequestDetailDialog from "@/components/modules/procurement/RequestDetailDialog";
import { procurementApi, getErrorMessage } from "@/services/api";

const PAGE_SIZE = 20;
const ALL = "all";

export default function Procurement() {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await procurementApi.list({
        page,
        limit: PAGE_SIZE,
        status: status === ALL ? undefined : status,
      });
      setRequests(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load purchase requests"));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openDetail = (request) => { setSelectedId(request.id); setDetailOpen(true); };
  const openEdit = (request) => { setDetailOpen(false); setEditing(request); setFormOpen(true); };

  const handleDeleted = () => {
    if (requests.length === 1 && page > 1) setPage(page - 1);
    else load();
  };

  return (
    <ModulePageShell
      title="Procurement"
      description="Manage purchase requests and procurement workflows"
      icon={ShoppingBag}
      actions={
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Request
        </Button>
      }
    >
      <div className="mb-4">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center space-y-3">
          <ShoppingBag className="w-8 h-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">
            {status === ALL ? "No purchase requests yet" : "No requests with this status"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {status === ALL
              ? "Create your first request to start the procurement workflow."
              : "Try a different status filter."}
          </p>
          {status === ALL && (
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Request</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <PurchaseRequestRow key={r.id} request={r} onClick={() => openDetail(r)} />
          ))}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <RequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        request={editing}
        onSaved={load}
      />
      <RequestDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        requestId={selectedId}
        onChanged={load}
        onEdit={openEdit}
        onDeleted={handleDeleted}
      />
    </ModulePageShell>
  );
}