import React, { useCallback, useEffect, useState } from "react";
import { ShoppingBag, Plus, AlertCircle, ClipboardCheck, ClipboardList } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QualityChecksPanel from "@/components/modules/quality/QualityChecksPanel";
import TemplatesPanel from "@/components/modules/quality/TemplatesPanel";
import NewCheckDialog from "@/components/modules/quality/NewCheckDialog";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleConfig";
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

const TABS = ["requests", "quality", "templates"];

export default function Procurement() {
  const { user } = useAuth();
  const canWrite = canAccess(user, "procurement", "EDIT");
  const canManageTemplates = canAccess(user, "procurement", "FULL");
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) && (params.get("tab") !== "templates" || canManageTemplates) ? params.get("tab") : "requests";
  const checkId = params.get("check");
  const setTab = (t) => setParams(t === "requests" ? {} : { tab: t }, { replace: true });
  const openCheck = (id) => setParams({ tab: "quality", check: id }, { replace: true });
  const [newCheckFor, setNewCheckFor] = useState(null);

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
      description="Purchase requests, commodity quality checks (QA/QC) and checklists"
      icon={ShoppingBag}
      actions={
        tab === "requests" && canWrite ? (
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> New Request
          </Button>
        ) : null
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="requests"><ShoppingBag className="mr-1.5 h-4 w-4" /> Purchase requests</TabsTrigger>
          <TabsTrigger value="quality"><ClipboardCheck className="mr-1.5 h-4 w-4" /> Quality checks</TabsTrigger>
          {canManageTemplates && <TabsTrigger value="templates"><ClipboardList className="mr-1.5 h-4 w-4" /> Checklists</TabsTrigger>}
        </TabsList>

        <TabsContent value="quality">
          <QualityChecksPanel initialCheckId={checkId} onCheckClosed={() => checkId && setParams({ tab: "quality" }, { replace: true })} />
        </TabsContent>
        {canManageTemplates && <TabsContent value="templates"><TemplatesPanel /></TabsContent>}

        <TabsContent value="requests">
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
        <div className="surface p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="surface p-10 text-center space-y-3">
          <ShoppingBag className="w-8 h-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">
            {status === ALL ? "No purchase requests yet" : "No requests with this status"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {status === ALL
              ? "Create your first request to start the procurement workflow."
              : "Try a different status filter."}
          </p>
          {status === ALL && canWrite && (
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

        </TabsContent>
      </Tabs>

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
        onOpenCheck={(id) => { setDetailOpen(false); openCheck(id); }}
        onNewCheck={(id) => { setDetailOpen(false); setNewCheckFor(id); }}
      />
      <NewCheckDialog
        open={!!newCheckFor}
        onOpenChange={(v) => !v && setNewCheckFor(null)}
        purchaseRequestId={newCheckFor}
        onCreated={(c) => openCheck(c.id)}
      />
    </ModulePageShell>
  );
}