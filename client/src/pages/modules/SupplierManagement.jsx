import React, { useCallback, useEffect, useState } from "react";
import {
  Truck, Plus, Search, MapPin, Package,
  RefreshCw, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";

import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supplierApi } from "@/lib/supplierApi";
import SupplierContactDetails from "./SupplierContactDetails";
import SupplierContactEdit from "./SupplierContactEdit";

const statusLabels = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  MORE_INFO_REQUIRED: "More information required",
};

function StatusBadge({ status }) {
  const styles = {
    VERIFIED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PENDING: "bg-amber-100 text-amber-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    MORE_INFO_REQUIRED: "bg-orange-100 text-orange-800",
  };

  return (
    <Badge
      variant="secondary"
      className={styles[status] || ""}
    >
      {statusLabels[status] || status || "Unknown"}
    </Badge>
  );
}

export default function SupplierManagement() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
const [notice, setNotice] = useState("");

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await supplierApi.list({
        page,
        pageSize: 12,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
      });

      setItems(result.items || []);
      setPagination(result.pagination || {});
    } catch (err) {
      setError(err.message || "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);
  async function handleDelete(supplier) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${supplier.companyName}"?\n\n` +
    "This action may permanently remove the supplier record."
  );

  if (!confirmed) return;

  setDeletingId(supplier.id);
  setError("");
  setNotice("");

  try {
    // Requires a matching DELETE method in supplierApi.
    await supplierApi.remove(supplier.id);

    setNotice(
      `${supplier.companyName} was deleted successfully.`
    );

    // If this was the last card on the current page,
    // move to the previous page instead of showing an empty page.
    if (items.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
    } else {
      await loadSuppliers();
    }
  } catch (err) {
    setError(
      err?.response?.data?.message ||
      err.message ||
      "Unable to delete this supplier."
    );
  } finally {
    setDeletingId(null);
  }
}

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  if (selectedId) {
    return (
      <SupplierContactDetails
        supplierId={selectedId}
        onBack={() => setSelectedId(null)}
        onEdit={() => {
          setEditingId(selectedId);
          setSelectedId(null);
        }}
      />
    );
  }

  if (creating || editingId) {
    return (
      <SupplierContactEdit
        supplierId={editingId}
        onCancel={() => {
          setCreating(false);
          setEditingId(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditingId(null);
          loadSuppliers();
        }}
      />
    );
  }

  return (
    <ModulePageShell
      title="Supplier & Vendor Management"
      description="Manage supplier relationships, onboarding and verification."
      icon={Truck}
      actions={
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Supplier
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search company, city or country..."
              className="pl-9"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={loadSuppliers}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error && (
  <div
    role="alert"
    className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
  >
    {error}
  </div>
)}

{notice && (
  <div
    role="status"
    className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
  >
    {notice}
  </div>
)}

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">
            Loading suppliers...
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold">No suppliers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search or add a supplier.
            </p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((supplier) => (
              <div
                key={supplier.id}
                className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">
                      {supplier.companyName}
                    </h3>
                    {supplier.tradingName && (
                      <p className="text-sm text-muted-foreground">
                        {supplier.tradingName}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={supplier.status} />
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {[supplier.city, supplier.country]
                      .filter(Boolean)
                      .join(", ") || "Location not provided"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Package className="h-4 w-4 shrink-0" />
                    {supplier.productCount ?? 0} active products
                  </p>
                  <p>
                    {supplier.businessType
                      ? supplier.businessType.replaceAll("_", " ")
                      : "Business type not specified"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
  <Button
    variant="outline"
    size="sm"
    className="min-w-0 flex-1"
    onClick={() => setSelectedId(supplier.id)}
    disabled={deletingId === supplier.id}
  >
    <Eye className="mr-1.5 h-4 w-4 shrink-0" />
    View
  </Button>

  <Button
    variant="outline"
    size="sm"
    className="min-w-0 flex-1"
    onClick={() => setEditingId(supplier.id)}
    disabled={deletingId === supplier.id}
  >
    <Pencil className="mr-1.5 h-4 w-4 shrink-0" />
    Edit
  </Button>

  <Button
    variant="destructive"
    size="sm"
    className="min-w-0 flex-1"
    onClick={() => handleDelete(supplier)}
    disabled={deletingId !== null}
  >
    <Trash2 className="mr-1.5 h-4 w-4 shrink-0" />
    {deletingId === supplier.id ? "Deleting..." : "Delete"}
  </Button>
</div>
              </div>
            ))}
          </div>
        )}

        {!loading && pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pagination.total} supplier(s) · Page {pagination.page} of{" "}
              {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </ModulePageShell>
  );
}