
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { complianceApi, getErrorMessage } from "@/services/api";
import ComplianceForm from "@/components/modules/compliance/ComplianceForm";
import ComplianceDetails from "@/components/modules/compliance/ComplianceDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

const statusConfig = {
  COMPLIANT: {
    label: "Compliant",
    style: "bg-primary/10 text-primary",
    icon: CheckCircle,
  },
  IN_REVIEW: {
    label: "In Review",
    style: "bg-chart-4/10 text-chart-4",
    icon: Clock,
  },
  ACTION_REQUIRED: {
    label: "Action Required",
    style: "bg-destructive/10 text-destructive",
    icon: AlertTriangle,
  },
};

const normalizeStatus = (status) =>
  String(status || "IN_REVIEW").toUpperCase().replaceAll(" ", "_");

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

export default function Compliance() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

const loadItems = useCallback(async () => {
  setError("");

  try {
    const res = await complianceApi.list({
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    setItems(res.data || []);
  } catch (err) {
    setError(getErrorMessage(err, "Unable to load compliance requirements."));
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        normalizeStatus(item.status) === statusFilter;

      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        [
          item.title,
          item.region,
          item.authority,
          item.reference,
          item.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const removeItem = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);

    try {
      await complianceApi.remove(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete requirement."));
    } finally {
      setDeletingId(null);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: items.length,
      COMPLIANT: items.filter(
        (x) => normalizeStatus(x.status) === "COMPLIANT"
      ).length,
      IN_REVIEW: items.filter(
        (x) => normalizeStatus(x.status) === "IN_REVIEW"
      ).length,
      ACTION_REQUIRED: items.filter(
        (x) => normalizeStatus(x.status) === "ACTION_REQUIRED"
      ).length,
    };
  }, [items]);

  return (
    <ModulePageShell
      title="Trade Compliance"
      description="Manage your company's regulations, certifications and compliance requirements."
      icon={Shield}
    >
      <div className="space-y-5">
        {/* Search and actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requirements..."
              className="pl-9"
            />
          </div>

          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: "ALL", label: "All" },
            { value: "COMPLIANT", label: "Compliant" },
            { value: "IN_REVIEW", label: "In Review" },
            { value: "ACTION_REQUIRED", label: "Action Required" },
          ].map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
              <span className="ml-2 opacity-70">
                {statusCounts[filter.value]}
              </span>
            </Button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={loadItems}>
              <RefreshCw className="w-3 h-3 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Requirements */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 px-5 text-center">
            <Shield className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />

            <h3 className="font-semibold text-sm">
              {items.length === 0
                ? "No compliance requirements yet"
                : "No matching requirements"}
            </h3>

            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {items.length === 0
                ? "Start by adding your company's first compliance requirement."
                : "Try another search term or change your status filter."}
            </p>

            {items.length === 0 && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Requirement
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const normalized = normalizeStatus(item.status);
              const config =
                statusConfig[normalized] || statusConfig.IN_REVIEW;
              const StatusIcon = config.icon;

              const overdue =
                item.dueDate &&
                new Date(item.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
                normalized !== "COMPLIANT";

              return (
                <div
                  key={item.id}
                  className="group bg-card rounded-xl border p-4 sm:p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => openDetails(item)}
                    >
                      <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.region}
                        {item.authority ? ` · ${item.authority}` : ""}
                      </p>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={config.style}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>

                      <div className="relative">
                        <details
  className="relative"
  onClick={(e) => {
    if (e.target.closest("button")) {
      e.currentTarget.open = false;
    }
  }}
>
  <summary className="list-none cursor-pointer p-2 rounded-md hover:bg-muted">
    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
  </summary>

  <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border bg-popover p-1 shadow-lg">
    <button
      type="button"
      onClick={() => openDetails(item)}
      className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted"
    >
      <Eye className="w-4 h-4" /> View
    </button>

    <button
      type="button"
      onClick={() => openEdit(item)}
      className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted"
    >
      <Pencil className="w-4 h-4" /> Edit
    </button>

    <button
      type="button"
      disabled={deletingId === item.id}
      onClick={() => removeItem(item)}
      className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
    >
      {deletingId === item.id ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      Delete
    </button>
  </div>
</details>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <Progress
                    
                      value={Math.min(100, Math.max(0, Number(item.completion) || 0))}
                      className="flex-1 h-2"
                    />
                    <span className="text-xs font-medium w-10 text-right">
                      {item.completion ?? 0}%
                      
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {item.dueDate ? (
                        <span className={overdue ? "text-destructive font-medium" : ""}>
                          {overdue ? "Overdue · " : "Due · "}
                          {formatDate(item.dueDate)}
                        </span>
                      ) : (
                        <span>No due date</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openDetails(item)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ComplianceForm
  open={formOpen}
  onOpenChange={setFormOpen}
  item={editingItem}
  onSaved={loadItems}
/>

<ComplianceDetails
  open={detailsOpen}
  onOpenChange={setDetailsOpen}
  item={selectedItem}
  onUpdated={loadItems}
/>
      </div>
    </ModulePageShell>
  );
}
