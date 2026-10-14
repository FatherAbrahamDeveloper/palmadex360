import React, { useCallback, useEffect, useState } from "react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Loader2 } from "lucide-react";
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
  NEW: "bg-muted text-muted-foreground",
  CONTACTED: "bg-blue-500/10 text-blue-600",
  QUALIFIED: "bg-primary/10 text-primary",
  FOLLOW_UP: "bg-chart-4/10 text-chart-4",
  NEGOTIATION: "bg-chart-5/10 text-chart-5",
  WON: "bg-green-500/10 text-green-600",
  LOST: "bg-red-500/10 text-red-600",
  CLOSED: "bg-gray-500/10 text-gray-600",
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
      description="Manage customer relationships and leads"
      icon={Users}
      actions={
        <Button
          size="sm"
          onClick={() => {
            setError("");
            setShowAddContact(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Contact
        </Button>
      }
    >
<div className="flex items-center gap-3 mb-4">
<div className="relative flex-1 max-w-sm">
<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search contacts..."
        className="pl-9"
      />
    </div>

    {loading && (
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    )}
  </div>

  {error && (
    <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {error}
    </div>
  )}

  {showAddContact && (
    <div className="mb-6 rounded-xl border bg-card p-5">
      <form onSubmit={createContact}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Add Contact</h2>
            <p className="text-sm text-muted-foreground">
              Create a new CRM contact.
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
            <label className="text-sm font-medium">
              Display Name *
            </label>

            <Input
              className="mt-1"
              value={form.displayName}
              onChange={(event) =>
                updateForm("displayName", event.target.value)
              }
              placeholder="Global Foods Inc."
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Company
            </label>

            <Input
              className="mt-1"
              value={form.companyName}
              onChange={(event) =>
                updateForm("companyName", event.target.value)
              }
              placeholder="Company name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              First Name
            </label>

            <Input
              className="mt-1"
              value={form.firstName}
              onChange={(event) =>
                updateForm("firstName", event.target.value)
              }
              placeholder="John"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Last Name
            </label>

            <Input
              className="mt-1"
              value={form.lastName}
              onChange={(event) =>
                updateForm("lastName", event.target.value)
              }
              placeholder="Doe"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Email
            </label>

            <Input
              type="email"
              className="mt-1"
              value={form.email}
              onChange={(event) =>
                updateForm("email", event.target.value)
              }
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Phone
            </label>

            <Input
              className="mt-1"
              value={form.phone}
              onChange={(event) =>
                updateForm("phone", event.target.value)
              }
              placeholder="+234..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Source
            </label>

            <select
              className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
            <label className="text-sm font-medium">
              Status
            </label>

            <select
              className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(event) =>
                updateForm("status", event.target.value)
              }
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button type="submit" disabled={creating}>
            {creating && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}

            {creating ? "Creating..." : "Create Contact"}
          </Button>
        </div>
      </form>
    </div>
  )}

  <div className="bg-card rounded-xl border overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Name
            </th>

            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Company
            </th>

            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Status
            </th>

            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Email
            </th>

            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Phone
            </th>

            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Source
            </th>

            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
              Last Updated
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading contacts...
              </td>
            </tr>
          ) : contacts.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                {search
                  ? "No contacts found."
                  : "No CRM contacts yet."}
              </td>
            </tr>
          ) : (
            contacts.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => navigate(`/crm/${contact.id}`)}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">
                  {getContactName(contact)}
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {contact.companyName || "—"}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={
                      statusColors[contact.status] ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {statusLabels[contact.status] ||
                      contact.status}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {contact.email || "—"}
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {contact.phone || "—"}
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {contact.source || "—"}
                </td>

                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDateTime(contact.updatedAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</ModulePageShell>


);
}