import React, { useCallback, useEffect, useState } from "react";
import { Ship, Plus, AlertCircle } from "lucide-react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ShipmentCard from "@/components/modules/shipping/ShipmentCard";
import ShipmentFormDialog from "@/components/modules/shipping/ShipmentFormDialog";
import { shipmentApi, getErrorMessage } from "@/services/api"; // adjust path

const PAGE_SIZE = 20;

export default function Shipping() {
  const [shipments, setShipments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentApi.list({ page, limit: PAGE_SIZE });
      setShipments(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load shipments"));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (shipment) => { setEditing(shipment); setDialogOpen(true); };

  const handleDeleted = () => {
    if (shipments.length === 1 && page > 1) setPage(page - 1);
    else load();
  };

  return (
    <ModulePageShell
      title="Shipping & Logistics"
      description="Track shipments and logistics operations"
      icon={Ship}
      actions={
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Shipment
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center space-y-3">
          <Ship className="w-8 h-8 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">No shipments yet</h3>
          <p className="text-sm text-muted-foreground">Create your first shipment to start tracking cargo.</p>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Shipment</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipments.map((s) => (
              <ShipmentCard key={s.id} shipment={s} onClick={() => openEdit(s)} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <ShipmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shipment={editing}
        onSaved={load}
        onDeleted={handleDeleted}
      />
    </ModulePageShell>
  );
}