import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Pencil, MapPin, Mail, Phone,
  Globe, Building2, Package, FileText, History,
} from "lucide-react";

import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supplierApi } from "@/lib/supplierApi";

const labels = {
  companyName: "Company name",
  tradingName: "Trading name",
  businessType: "Business type",
  description: "Description",
  establishedDate: "Established date",
  registrationStatus: "Registration status",
  registrationNumber: "Registration number",
  registrationCountry: "Registration country",
  taxIdentificationNumber: "Tax identification number",
  registrationAuthority: "Registration authority",
  email: "Email",
  phone: "Phone",
  alternativePhone: "Alternative phone",
  website: "Website",
  contactPerson: "Contact person",
  contactJobTitle: "Contact job title",
  country: "Country",
  stateOrRegion: "State or region",
  city: "City",
  address: "Address",
  warehouseAddress: "Warehouse address",
  hasExportedBefore: "Exported before",
  exportExperienceYears: "Export experience (years)",
  previousExportCountries: "Previous export countries",
  exportDestinations: "Export destinations",
  logisticsCapabilities: "Logistics capabilities",
  leadTimeDays: "Lead time (days)",
  qualityControlDescription: "Quality control",
  traceabilityAvailable: "Traceability available",
  preferredPaymentTerms: "Preferred payment terms",
  quotationCurrency: "Quotation currency",
  tradeReferences: "Trade references",
};

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function DetailSection({ title, fields, supplier }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field} className="min-w-0">
            <dt className="text-sm text-muted-foreground">
              {labels[field] || field}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium">
              {formatValue(supplier[field])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function SupplierContactDetails({
  supplierId,
  onBack,
  onEdit,
}) {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await supplierApi.get(supplierId);
        if (active) setSupplier(result.supplier);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [supplierId]);

  if (loading) {
    return <p className="p-8 text-center">Loading supplier details...</p>;
  }

  if (error || !supplier) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to suppliers
        </Button>
        <p className="text-sm text-red-600">
          {error || "Supplier not found."}
        </p>
      </div>
    );
  }

  const products = supplier.products || [];
  const documents = supplier.documents || [];
  const history = supplier.verificationHistory || [];

  return (
    <ModulePageShell
      title={supplier.companyName}
      description="Supplier profile and onboarding information"
      icon={Building2}
      actions={
        <Button onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit supplier
        </Button>
      }
    >
      <div className="space-y-5">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to suppliers
        </Button>

        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {supplier.companyName}
              </h2>
              {supplier.tradingName && (
                <p className="text-muted-foreground">
                  {supplier.tradingName}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[supplier.city, supplier.country]
                    .filter(Boolean)
                    .join(", ") || "Location not provided"}
                </span>
                {supplier.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {supplier.email}
                  </span>
                )}
                {supplier.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {supplier.phone}
                  </span>
                )}
                {supplier.website && (
                  <a
                    className="flex items-center gap-1 underline"
                    href={supplier.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>

            <Badge>{(supplier.status || "UNKNOWN").replaceAll("_", " ")}</Badge>
          </div>
        </section>

        <DetailSection
          title="Company information"
          supplier={supplier}
          fields={[
            "companyName", "tradingName", "businessType", "description",
            "establishedDate", "registrationStatus", "registrationNumber",
            "registrationCountry", "taxIdentificationNumber",
            "registrationAuthority",
          ]}
        />

        <DetailSection
          title="Contact information"
          supplier={supplier}
          fields={[
            "contactPerson", "contactJobTitle", "email", "phone",
            "alternativePhone", "website",
          ]}
        />

        <DetailSection
          title="Location"
          supplier={supplier}
          fields={[
            "country", "stateOrRegion", "city", "address", "warehouseAddress",
          ]}
        />

        <DetailSection
          title="Export and logistics"
          supplier={supplier}
          fields={[
            "hasExportedBefore", "exportExperienceYears",
            "previousExportCountries", "exportDestinations",
            "logisticsCapabilities", "leadTimeDays",
          ]}
        />

        <DetailSection
          title="Quality and commercial information"
          supplier={supplier}
          fields={[
            "qualityControlDescription", "traceabilityAvailable",
            "preferredPaymentTerms", "quotationCurrency", "tradeReferences",
          ]}
        />

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Package className="h-4 w-4" /> Products ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products have been added for this supplier.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {product.name || product.productName || "Product"}
                  </p>
                  {product.description && (
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4" /> Documents ({documents.length})
          </h2>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents uploaded.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {doc.fileName || doc.name || doc.documentType || "Document"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <History className="h-4 w-4" /> Verification history ({history.length})
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No verification activity recorded.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border-l-2 pl-4">
                  <p className="font-medium">
                    {(entry.status || entry.action || "Update").replaceAll("_", " ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.createdAt
                      ? new Date(entry.createdAt).toLocaleString()
                      : ""}
                    {entry.changedBy
                      ? ` · ${entry.changedBy.firstName} ${entry.changedBy.lastName}`
                      : ""}
                  </p>
                  {entry.notes && (
                    <p className="mt-1 text-sm">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Created {new Date(supplier.createdAt).toLocaleString()} · Last
          updated {new Date(supplier.updatedAt).toLocaleString()}
        </p>
      </div>
    </ModulePageShell>
  );
}