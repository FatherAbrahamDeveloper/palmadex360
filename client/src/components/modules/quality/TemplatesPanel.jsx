import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Plus, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { qaApi, getErrorMessage } from "@/services/api";
import TemplateEditorDialog from "./TemplateEditorDialog";

export default function TemplatesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setRows(await qaApi.templates({ includeInactive: true })); }
    catch (err) { setError(getErrorMessage(err, "Could not load checklists")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(t, isActive) {
    try { await qaApi.updateTemplate(t.id, { isActive }); load(); }
    catch (err) { toast.error(getErrorMessage(err, "Could not update the checklist")); }
  }

  const duplicate = (t) => setEditing({ ...t, id: undefined, name: `${t.name} (copy)`, isActive: true, _copy: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">One checklist per commodity. Edit the rows, limits and options to match each buyer contract.</p>
        <Button size="sm" onClick={() => setEditing(null)}><Plus className="mr-1 h-4 w-4" /> New checklist</Button>
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((t) => (
            <div key={t.id} className="surface flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.commodity} · {t.parameters.length} rows · version {t.version} · used {t.inspectionCount || 0}×</p>
                </div>
                {!t.isActive && <Badge variant="secondary">Off</Badge>}
              </div>
              {t.description && <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>}
              <div className="mt-auto flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs"><Switch checked={t.isActive} onCheckedChange={(v) => toggle(t, v)} /> Available</label>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => duplicate(t)}><Copy className="mr-1 h-3.5 w-3.5" /> Duplicate</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(t)}>Edit</Button>
                </div>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className="surface col-span-full space-y-2 p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No checklists yet.</p>
            </div>
          )}
        </div>
      )}
      <TemplateEditorDialog
        open={editing !== undefined}
        onOpenChange={(v) => !v && setEditing(undefined)}
        template={editing?._copy ? { ...editing, id: undefined } : editing}
        onSaved={load}
      />
    </div>
  );
}
