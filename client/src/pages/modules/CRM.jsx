import React, { useCallback, useEffect, useState, useMemo } from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Plus, 
  Search, 
  Loader2, 
  TrendingUp, 
  UserCheck, 
  Sparkles, 
  Building2, 
  Mail, 
  Phone, 
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const CRM_API_URL = `${API_URL.replace(/\/$/, "")}/crm`;

const statusLabels = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  FOLLOW_UP: "Follow Up",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  CLOSED: "Closed",
};

const statusColors = {
  NEW: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  CONTACTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  QUALIFIED: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  FOLLOW_UP: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  NEGOTIATION: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  WON: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  LOST: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  CLOSED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const getContactName = (contact) => {
  if (contact.displayName) {
    return contact.displayName;
  }

  return (
    [contact.firstName, contact.lastName]
      .filter(Boolean)
      .join(" ") || "Unnamed Contact"
  );
};

const getInitials = (name) => {
  if (!name) return "UC";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function CRM() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const [showAddContact, setShowAddContact] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    source: "MANUAL",
    status: "NEW",
  });

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("You are not logged in");
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const response = await fetch(
        `${CRM_API_URL}/contacts${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        throw new Error(
          data.message || "Failed to load CRM contacts"
        );
      }

      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("CRM load error:", err);
      setError(err.message || "Failed to load contacts");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadContacts();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadContacts]);

  // Filter contacts locally by status if a filter is active
  const filteredContacts = useMemo(() => {
    if (statusFilter === "ALL") return contacts;
    return contacts.filter((c) => c.status === statusFilter);
  }, [contacts, statusFilter]);

  // Calculate metrics from loaded contacts
  const metrics = useMemo(() => {
    const total = contacts.length;
    const newLeads = contacts.filter((c) => c.status === "NEW").length;
    const qualified = contacts.filter((c) => c.status === "QUALIFIED").length;
    const wonDeals = contacts.filter((c) => c.status === "WON").length;
    return { total, newLeads, qualified, wonDeals };
  }, [contacts]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const createContact = async (event) => {
    event.preventDefault();

    if (!form.displayName.trim()) {
      setError("Contact name is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("You are not logged in");
      }

      const response = await fetch(`${CRM_API_URL}/contacts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          companyName: form.companyName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          source: form.source,
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        throw new Error(
          data.message || "Failed to create contact"
        );
      }

      setContacts((current) => [data, ...current]);

      setForm({
        displayName: "",
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        phone: "",
        source: "MANUAL",
        status: "NEW",
      });

      setShowAddContact(false);
    } catch (err) {
      console.error("CRM create error:", err);
      setError(err.message || "Failed to create contact");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ModulePageShell
      title="CRM"
      description="Manage customer relationships and leads efficiently"
      icon={Users}
      actions={
        <Button
          size="sm"
          onClick={() => {
            setError("");
            setShowAddContact(true);
          }}
          className="shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Contact
        </Button>
      }
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Contacts</p>
            <p className="text-2xl font-bold mt-1">{metrics.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Leads</p>
            <p className="text-2xl font-bold mt-1">{metrics.newLeads}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Qualified Leads</p>
            <p className="text-2xl font-bold mt-1">{metrics.qualified}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Won Deals</p>
            <p className="text-2xl font-bold mt-1">{metrics.wonDeals}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, company..."
            className="pl-9 bg-card shadow-sm"
          />
        </div>

        
<div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
  <div className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border/70 bg-card px-3 text-muted-foreground">
    <Filter className="h-3.5 w-3.5" />
    <span className="text-xs font-semibold">Filter</span>
  </div>

  <div className="relative shrink-0">
    <select
      className="h-10 min-w-[170px] appearance-none rounded-lg border border-border/70 bg-card pl-3.5 pr-10 text-sm font-medium text-foreground shadow-sm outline-none transition-all hover:bg-muted/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 cursor-pointer"
      value={statusFilter}
      onChange={(event) => setStatusFilter(event.target.value)}
    >
      <option value="ALL">
        All Statuses ({contacts.length})
      </option>

      {Object.entries(statusLabels).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>

    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>

  {loading && (
    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
  )}
</div>

      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
          {error}
        </div>
      )}

      {/* Add Contact Modal / Drawer Form */}
      {showAddContact && (
        <div className="mb-6 rounded-xl border bg-card p-6 shadow-md transition-all">
          <form onSubmit={createContact}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b">
              <div>
                <h2 className="font-semibold text-lg">Add New Contact</h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the details to register a new lead or customer.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddContact(false)}
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Display Name *</label>
                <Input
                  className="mt-1.5"
                  value={form.displayName}
                  onChange={(event) =>
                    updateForm("displayName", event.target.value)
                  }
                  placeholder="Global Foods Inc."
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  className="mt-1.5"
                  value={form.companyName}
                  onChange={(event) =>
                    updateForm("companyName", event.target.value)
                  }
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  className="mt-1.5"
                  value={form.firstName}
                  onChange={(event) =>
                    updateForm("firstName", event.target.value)
                  }
                  placeholder="John"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  className="mt-1.5"
                  value={form.lastName}
                  onChange={(event) =>
                    updateForm("lastName", event.target.value)
                  }
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  className="mt-1.5"
                  value={form.email}
                  onChange={(event) =>
                    updateForm("email", event.target.value)
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  className="mt-1.5"
                  value={form.phone}
                  onChange={(event) =>
                    updateForm("phone", event.target.value)
                  }
                  placeholder="+234..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Source</label>
                <select
                  className="mt-1.5 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                  value={form.source}
                  onChange={(event) =>
                    updateForm("source", event.target.value)
                  }
                >
                  <option value="MANUAL">Manual</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="IMPORT">Import</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Initial Status</label>
                <select
                  className="mt-1.5 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value)
                  }
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddContact(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {creating ? "Creating..." : "Save Contact"}
              </Button>
            </div>
          </form>
        </div>
      )}

      
{/* Contacts Table View */}
<div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border/70 bg-muted/30">
          <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </th>
          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Company
          </th>
          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </th>
          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </th>
          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Phone
          </th>
          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Source
          </th>
          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            Last Updated
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-border/50">
        {loading ? (
          <tr>
            <td colSpan={7} className="px-6 py-20 text-center">
              <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Loading contacts...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please wait a moment.
              </p>
            </td>
          </tr>
        ) : filteredContacts.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/70">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No contacts found
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your search terms or filter status to find what you're looking for."
                  : "Get started by creating your first CRM contact."}
              </p>
            </td>
          </tr>
        ) : (
          filteredContacts.map((contact) => {
            const contactName = getContactName(contact);

            return (
              <tr
                key={contact.id}
                onClick={() => navigate(`/crm/${contact.id}`)}
                className="group cursor-pointer transition-colors duration-150 hover:bg-muted/40"
              >
                {/* Contact */}
                <td className="px-6 py-4">
                  <div className="flex min-w-[180px] items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
                      {getInitials(contactName)}
                    </div>

                    <span
                      className="truncate font-semibold text-foreground"
                      title={contactName}
                    >
                      {contactName}
                    </span>
                  </div>
                </td>

                {/* Company */}
                <td className="px-5 py-4">
                  {contact.companyName ? (
                    <div className="flex max-w-[160px] items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="truncate text-[13px]">
                        {contact.companyName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className={`inline-flex w-fit items-center justify-center whitespace-nowrap rounded-md border-0 px-3 py-1.5 text-xs font-semibold leading-none shadow-none ${
                      statusColors[contact.status] ||
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabels[contact.status] || contact.status}
                  </Badge>
                </td>

                {/* Email */}
                <td className="px-5 py-4">
                  {contact.email ? (
                    <div className="flex max-w-[190px] items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      <span
                        className="truncate text-[13px]"
                        title={contact.email}
                      >
                        {contact.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Phone */}
                <td className="px-5 py-4">
                  {contact.phone ? (
                    <div className="flex max-w-[150px] items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      <span className="truncate text-[13px]">
                        {contact.phone}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Source */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground">
                    {contact.source || "MANUAL"}
                  </span>
                </td>

                {/* Last Updated */}
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {formatDateTime(contact.updatedAt)}
                  </span>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>

    </ModulePageShell>
  );
}