
import React, { useCallback, useEffect, useState } from "react";
import {
  Truck, Plus, Search, MapPin, Package,
  RefreshCw, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Building2,
  CheckCircle2, Clock, AlertCircle,
  XCircle, Loader2, Globe2
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

const statusStyles = {
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  MORE_INFO_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
};

function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={`font-medium whitespace-nowrap ${
        statusStyles[status] || "bg-muted text-muted-foreground"
      }`}
    >
      {statusLabels[status] || status || "Unknown"}
    </Badge>
  );
}

function StatCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SupplierSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-5">
      <div className="mb-5 flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="h-3 w-36 rounded bg-muted" />
      </div>
      <div className="mt-6 h-9 rounded bg-muted" />
    </div>
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

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  async function handleDelete(supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.companyName}"?\n\nThis action may permanently remove the supplier record.`
    );

    if (!confirmed) return;

    setDeletingId(supplier.id);
    setError("");
    setNotice("");

    try {
      await supplierApi.remove(supplier.id);

      setNotice(`${supplier.companyName} was deleted successfully.`);

      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
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

  const total = pagination.total ?? items.length;
  const verified = items.filter((x) => x.status === "VERIFIED").length;
  const pending = items.filter(
    (x) => ["PENDING", "UNDER_REVIEW", "MORE_INFO_REQUIRED"].includes(x.status)
  ).length;
  const rejected = items.filter((x) => x.status === "REJECTED").length;

  return (
    <ModulePageShell
      title="Supplier & Vendor Mgmt"
      description="Manage supplier relationships, onboarding and verification."
      icon={Truck}
      actions={
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Overview */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Suppliers"
            value={total}
            description="Matching supplier records"
            icon={Building2}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            title="Verified"
            value={verified}
            description="Verified on this page"
            icon={CheckCircle2}
            color="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Pending Review"
            value={pending}
            description="Awaiting verification"
            icon={Clock}
            color="bg-amber-100 text-amber-700"
          />
          <StatCard
            title="Rejected"
            value={rejected}
            description="Rejected on this page"
            icon={XCircle}
            color="bg-red-100 text-red-700"
          />
        </div>

        {/* Search and filters */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search company, city or country..."
                className="h-10 pl-9"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm lg:w-56"
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
              className="h-10"
              onClick={loadSuppliers}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={loadSuppliers}>
              Retry
            </Button>
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {/* Supplier directory heading */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Supplier Directory</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Your registered suppliers and vendors
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {total} supplier(s)
          </span>
        </div>

        {/* Supplier cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SupplierSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="h-7 w-7" />
            </div>
            <h3 className="font-semibold">
              {search || status ? "No matching suppliers" : "No suppliers yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {search || status
                ? "Try adjusting your search or status filter."
                : "Start building your supplier network by adding your first supplier."}
            </p>
            <Button className="mt-5" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((supplier) => (
              <div
                key={supplier.id}
                className="group rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {supplier.companyName}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {supplier.tradingName || "Registered supplier"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={supplier.status} />
                </div>

                {/* Card information */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {[supplier.city, supplier.country]
                        .filter(Boolean)
                        .join(", ") || "Location not provided"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {supplier.productCount ?? 0} active products
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Globe2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="capitalize text-muted-foreground">
                      {supplier.businessType
                        ? supplier.businessType.replaceAll("_", " ").toLowerCase()
                        : "Business type not specified"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedId(supplier.id)}
                    disabled={deletingId === supplier.id}
                  >
                    <Eye className="mr-1.5 h-4 w-4" />
                    View
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingId(supplier.id)}
                    disabled={deletingId !== null}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => handleDelete(supplier)}
                    disabled={deletingId !== null}
                  >
                    {deletingId === supplier.id ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1.5 h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page{" "}
              <span className="font-semibold text-foreground">
                {pagination.page ?? page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {pagination.totalPages ?? 1}
              </span>
              {" · "}
              {pagination.total} suppliers
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
                disabled={page >= (pagination.totalPages ?? 1)}
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
