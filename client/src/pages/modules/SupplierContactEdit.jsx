import React, { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import ModulePageShell from "@/components/modules/ModulePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supplierApi } from "@/lib/supplierApi";

const initialValues = {
  companyName: "",
  tradingName: "",
  businessType: "",
  description: "",
  establishedDate: "",
  registrationStatus: "IN_PROGRESS",
  registrationNumber: "",
  registrationCountry: "",
  taxIdentificationNumber: "",
  registrationAuthority: "",
  email: "",
  phone: "",
  alternativePhone: "",
  website: "",
  contactPerson: "",
  contactJobTitle: "",
  country: "",
  stateOrRegion: "",
  city: "",
  address: "",
  warehouseAddress: "",
  hasExportedBefore: "",
  exportExperienceYears: "",
  previousExportCountries: "",
  exportDestinations: "",
  logisticsCapabilities: "",
  leadTimeDays: "",
  qualityControlDescription: "",
  traceabilityAvailable: "",
  preferredPaymentTerms: "",
  quotationCurrency: "USD",
  tradeReferences: "",
};

const groups = [
  {
    title: "Company information",
    fields: [
      ["companyName", "Company name", true],
      ["tradingName", "Trading name"],
      ["businessType", "Business type", false, "select"],
      ["description", "Company description", false, "textarea"],
      ["establishedDate", "Established date", false, "date"],
    ],
  },
  {
    title: "Registration and tax",
    fields: [
      ["registrationStatus", "Registration status", false, "registration"],
      ["registrationNumber", "Registration number"],
      ["registrationCountry", "Registration country"],
      ["taxIdentificationNumber", "Tax identification number"],
      ["registrationAuthority", "Registration authority"],
    ],
  },
  {
    title: "Contact details",
    fields: [
      ["email", "Email address", true, "email"],
      ["phone", "Phone number", true, "tel"],
      ["alternativePhone", "Alternative phone"],
      ["website", "Website", false, "url"],
      ["contactPerson", "Contact person", true],
      ["contactJobTitle", "Contact person's job title"],
    ],
  },
  {
    title: "Business location",
    fields: [
      ["country", "Country", true],
      ["stateOrRegion", "State or region"],
      ["city", "City", true],
      ["address", "Business address", true, "textarea"],
      ["warehouseAddress", "Warehouse address", false, "textarea"],
    ],
  },
  {
    title: "Export and logistics",
    fields: [
      ["hasExportedBefore", "Has exported before?", false, "boolean"],
      ["exportExperienceYears", "Years of export experience", false, "number"],
      ["previousExportCountries", "Previous export countries", false, "textarea"],
      ["exportDestinations", "Export destinations", false, "textarea"],
      ["logisticsCapabilities", "Logistics capabilities", false, "textarea"],
      ["leadTimeDays", "Typical lead time in days", false, "number"],
    ],
  },
  {
    title: "Quality and commercial terms",
    fields: [
      ["qualityControlDescription", "Quality control process", false, "textarea"],
      ["traceabilityAvailable", "Product traceability available?", false, "boolean"],
      ["preferredPaymentTerms", "Preferred payment terms"],
      ["quotationCurrency", "Quotation currency"],
      ["tradeReferences", "Trade references", false, "textarea"],
    ],
  },
];

const businessTypes = [
  "FARMER", "COOPERATIVE", "AGGREGATOR", "PROCESSOR",
  "MANUFACTURER", "EXPORTER", "WHOLESALER", "OTHER",
];

function fromApi(supplier) {
  const result = { ...initialValues };

  for (const key of Object.keys(result)) {
    const value = supplier[key];

    if (value === null || value === undefined) continue;

    if (key === "establishedDate") {
      result[key] = String(value).slice(0, 10);
    } else if (key === "hasExportedBefore" || key === "traceabilityAvailable") {
      result[key] = value === true ? "true" : value === false ? "false" : "";
    } else if (Array.isArray(value)) {
      result[key] = value.join(", ");
    } else {
      result[key] = String(value);
    }
  }

  return result;
}

function toApi(values) {
  const data = { ...values };

  for (const key of [
    "exportExperienceYears",
    "leadTimeDays",
  ]) {
    data[key] = data[key] === "" ? null : Number(data[key]);
  }

  for (const key of [
    "hasExportedBefore",
    "traceabilityAvailable",
  ]) {
    data[key] = data[key] === "" ? null : data[key] === "true";
  }

  if (data.establishedDate === "") data.establishedDate = null;

  for (const key of [
    "previousExportCountries",
    "exportDestinations",
    "tradeReferences",
  ]) {
    data[key] = data[key]
      ? data[key].split(",").map((item) => item.trim()).filter(Boolean)
      : [];
  }

  return data;
}

function Field({ field, value, onChange }) {
  const [name, label, required, type = "text"] = field;
  const common = {
    id: name,
    name,
    value: value ?? "",
    onChange: (e) => onChange(name, e.target.value),
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}{required ? " *" : ""}
      </label>

      {type === "textarea" ? (
        <textarea
          {...common}
          rows={3}
          required={required}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      ) : type === "select" ? (
        <select
          {...common}
          required={required}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Select business type</option>
          {businessTypes.map((item) => (
            <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
          ))}
        </select>
      ) : type === "registration" ? (
        <select {...common} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="IN_PROGRESS">In progress</option>
          <option value="REGISTERED">Registered</option>
          <option value="NOT_REGISTERED">Not registered</option>
        </select>
      ) : type === "boolean" ? (
        <select {...common} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Not specified</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : (
        <Input
          {...common}
          type={type}
          required={required}
          min={type === "number" ? 0 : undefined}
        />
      )}
    </div>
  );
}

export default function SupplierContactEdit({
  supplierId = null,
  onCancel,
  onSaved,
}) {
  const isEdit = Boolean(supplierId);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!supplierId) return;

    let active = true;

    supplierApi.get(supplierId)
      .then((result) => {
        if (active) setValues(fromApi(result.supplier));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [supplierId]);

  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = toApi(values);

      if (isEdit) {
        await supplierApi.update(supplierId, data);
      } else {
        await supplierApi.create(data);
      }

      setSuccess(isEdit ? "Supplier updated successfully." : "Supplier created successfully.");
      onSaved?.();
    } catch (err) {
      setError(err.message || "Unable to save supplier.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-center">Loading supplier...</p>;
  }

  return (
    <ModulePageShell
      title={isEdit ? "Edit supplier" : "Add supplier"}
      description="Enter the company's business and contact information."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {error && (
          <div role="alert" className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </p>
        )}

        {groups.map((group) => (
          <section key={group.title} className="rounded-xl border bg-card p-5">
            <h2 className="mb-5 font-semibold">{group.title}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <div
                  key={field[0]}
                  className={field[3] === "textarea" ? "md:col-span-2" : ""}
                >
                  <Field
                    field={field}
                    value={values[field[0]]}
                    onChange={change}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create supplier"}
          </Button>
        </div>
      </form>
    </ModulePageShell>
  );
}