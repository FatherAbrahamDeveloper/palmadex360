import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const CRM_API_URL = `${API_URL.replace(/\/$/, "")}/crm`;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function CRMContactEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  /*
   * Load contact
   */
  useEffect(() => {
    let cancelled = false;

    const loadContact = async () => {
      if (!id) {
        setError("Contact ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${CRM_API_URL}/contacts/${id}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to load contact (${response.status})`
          );
        }

        if (cancelled) return;

        setForm({
          displayName: data?.displayName || "",
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          companyName: data?.companyName || "",
          email: data?.email || "",
          phone: data?.phone || "",
          source: data?.source || "MANUAL",
          status: data?.status || "NEW",
        });
      } catch (err) {
        if (cancelled) return;

        console.error("CRM contact load error:", err);

        setError(
          err?.message ||
            "Unable to load contact. Please check that the backend is running."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContact();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
   * Update form field
   */
  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
   * Save contact
   */
  const handleSave = async (event) => {
    event.preventDefault();

    const displayName = form.displayName.trim();

    if (!displayName) {
      setError("Contact name is required");
      return;
    }

    if (!id) {
      setError("Contact ID is missing");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${CRM_API_URL}/contacts/${id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            displayName,
            firstName: form.firstName.trim() || undefined,
            lastName: form.lastName.trim() || undefined,
            companyName: form.companyName.trim() || undefined,
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            source: form.source,
            status: form.status,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to update contact (${response.status})`
        );
      }

      navigate(`/crm/${id}`);
    } catch (err) {
      console.error("CRM contact update error:", err);

      setError(
        err?.message ||
          "Unable to update contact. Please check that the backend is running."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Loading state
   */
  if (loading) {
    return (
      <ModulePageShell
        title="CRM"
        description="Loading contact..."
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      title="Edit Contact"
      description="Update CRM contact information"
    >
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(`/crm/${id}`)}
        disabled={saving}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Contact
      </Button>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="max-w-3xl bg-card border rounded-xl p-6">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Display Name */}
            <div>
              <label className="text-sm font-medium">
                Display Name *
              </label>

              <Input
                className="mt-1"
                value={form.displayName}
                onChange={(event) =>
                  updateForm(
                    "displayName",
                    event.target.value
                  )
                }
                placeholder="Global Foods Inc."
                required
                disabled={saving}
              />
            </div>

            {/* Company */}
            <div>
              <label className="text-sm font-medium">
                Company
              </label>

              <Input
                className="mt-1"
                value={form.companyName}
                onChange={(event) =>
                  updateForm(
                    "companyName",
                    event.target.value
                  )
                }
                placeholder="Company name"
                disabled={saving}
              />
            </div>

            {/* First Name */}
            <div>
              <label className="text-sm font-medium">
                First Name
              </label>

              <Input
                className="mt-1"
                value={form.firstName}
                onChange={(event) =>
                  updateForm(
                    "firstName",
                    event.target.value
                  )
                }
                placeholder="John"
                disabled={saving}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm font-medium">
                Last Name
              </label>

              <Input
                className="mt-1"
                value={form.lastName}
                onChange={(event) =>
                  updateForm(
                    "lastName",
                    event.target.value
                  )
                }
                placeholder="Doe"
                disabled={saving}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium">
                Email
              </label>

              <Input
                type="email"
                className="mt-1"
                value={form.email}
                onChange={(event) =>
                  updateForm(
                    "email",
                    event.target.value
                  )
                }
                placeholder="john@example.com"
                disabled={saving}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium">
                Phone
              </label>

              <Input
                className="mt-1"
                value={form.phone}
                onChange={(event) =>
                  updateForm(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+234..."
                disabled={saving}
              />
            </div>

            {/* Source */}
            <div>
              <label className="text-sm font-medium">
                Source
              </label>

              <select
                className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.source}
                onChange={(event) =>
                  updateForm(
                    "source",
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="MANUAL">
                  Manual
                </option>

                <option value="WHATSAPP">
                  WhatsApp
                </option>

                <option value="EMAIL">
                  Email
                </option>

                <option value="IMPORT">
                  Import
                </option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium">
                Status
              </label>

              <select
                className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    "status",
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="NEW">
                  New
                </option>

                <option value="CONTACTED">
                  Contacted
                </option>

                <option value="QUALIFIED">
                  Qualified
                </option>

                <option value="FOLLOW_UP">
                  Follow Up
                </option>

                <option value="NEGOTIATION">
                  Negotiation
                </option>

                <option value="WON">
                  Won
                </option>

                <option value="LOST">
                  Lost
                </option>

                <option value="CLOSED">
                  Closed
                </option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/crm/${id}`)
              }
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </ModulePageShell>
  );
}