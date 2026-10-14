import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Send,
  Globe,
  FileCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supplierApi } from "@/lib/supplierApi";

const sections = [
  {
    title: "Company details",
    description: "Tell us about your business and what you supply.",
    fields: [
      ["companyName", "Registered company name", "text", true],
      ["tradingName", "Trading name", "text"],
      ["businessType", "Business type", "select", true],
      ["description", "Products or services supplied", "textarea"],
      ["establishedDate", "Date established", "date"],
    ],
  },
  {
    title: "Registration information",
    description: "Provide your business registration details where available.",
    fields: [
      ["registrationStatus", "Registration status", "registration"],
      ["registrationNumber", "Company registration number"],
      ["registrationCountry", "Country of registration"],
      ["taxIdentificationNumber", "Tax identification number"],
      ["registrationAuthority", "Registration authority"],
    ],
  },
  {
    title: "Contact information",
    description: "How can the Renamy Connect team reach you?",
    fields: [
      ["contactPerson", "Contact person's full name", "text", true],
      ["contactJobTitle", "Job title"],
      ["email", "Business email", "email", true],
      ["phone", "Business phone", "tel", true],
      ["alternativePhone", "Alternative phone", "tel"],
      ["website", "Company website (optional)", "text"],
    ],
  },
  {
    title: "Business address",
    description: "Tell us where your business operates.",
    fields: [
      ["country", "Country", "text", true],
      ["stateOrRegion", "State or region"],
      ["city", "City", "text", true],
      ["address", "Registered or business address", "textarea", true],
      ["warehouseAddress", "Warehouse or production address", "textarea"],
    ],
  },
  {
    title: "Export experience and logistics",
    description: "Help us understand your delivery and export capabilities.",
    fields: [
      ["hasExportedBefore", "Have you exported before?", "boolean"],
      ["exportExperienceYears", "Years of export experience", "number"],
      ["previousExportCountries", "Countries previously exported to", "textarea"],
      ["exportDestinations", "Preferred export destinations", "textarea"],
      ["logisticsCapabilities", "Logistics and delivery capabilities", "textarea"],
      ["leadTimeDays", "Typical order lead time (days)", "number"],
    ],
  },
  {
    title: "Quality and commercial information",
    description: "Share your quality-control and trading preferences.",
    fields: [
      ["qualityControlDescription", "Quality-control procedures", "textarea"],
      ["traceabilityAvailable", "Can you trace products to their source?", "boolean"],
      ["preferredPaymentTerms", "Preferred payment terms"],
      ["quotationCurrency", "Preferred quotation currency", "currency"],
      ["tradeReferences", "Trade references", "textarea"],
    ],
  },
];

const businessTypes = [
  "FARMER",
  "COOPERATIVE",
  "AGGREGATOR",
  "PROCESSOR",
  "MANUFACTURER",
  "EXPORTER",
  "WHOLESALER",
  "OTHER",
];

const initial = {
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

function Field({ field, value, onChange }) {
  const [name, label, type = "text", required = false] = field;

  const common = {
    id: name,
    name,
    value: value ?? "",
    required,
    onChange: (event) => onChange(name, event.target.value),
    className:
      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
  };

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          {...common}
          rows={3}
          className={`${common.className} resize-y`}
        />
      ) : type === "select" ? (
        <select {...common}>
          <option value="">Select business type</option>
          {businessTypes.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : type === "registration" ? (
        <select {...common}>
          <option value="IN_PROGRESS">In progress</option>
          <option value="REGISTERED">Registered</option>
          <option value="NOT_REGISTERED">Not registered</option>
        </select>
      ) : type === "boolean" ? (
        <select {...common}>
          <option value="">Please select</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : type === "currency" ? (
        <select {...common}>
          {["USD", "NGN", "EUR", "GBP", "GHS", "KES", "ZAR"].map(
            (currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            )
          )}
        </select>
      ) : (
        <Input
          id={name}
          name={name}
          type={name === "website" ? "text" : type}
          value={value ?? ""}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
          autoComplete={
            name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : name === "website"
                  ? "url"
                  : undefined
          }
          placeholder={
            name === "website"
              ? "Optional — enter your website if available"
              : name === "email"
                ? "name@company.com"
                : undefined
          }
          min={type === "number" ? 0 : undefined}
          className="h-11"
        />
      )}
    </div>
  );
}

function preparePayload(values, declarationAccepted, privacyNoticeAccepted) {
  const data = { ...values };

  for (const key of ["exportExperienceYears", "leadTimeDays"]) {
    data[key] =
      data[key] === "" || data[key] == null
        ? null
        : Number(data[key]);
  }

  for (const key of ["hasExportedBefore", "traceabilityAvailable"]) {
    data[key] =
      data[key] === "" || data[key] == null
        ? null
        : data[key] === "true";
  }

  data.establishedDate = data.establishedDate || null;

  for (const key of [
    "previousExportCountries",
    "exportDestinations",
    "tradeReferences",
  ]) {
    data[key] = data[key]?.trim() || null;
  }

  // Website is optional. Do not validate its format.
  data.website = data.website?.trim() || null;

  return {
    ...data,
    declarationAccepted,
    privacyNoticeAccepted,
  };
}

export default function SupplierApplicationForm() {
  const [values, setValues] = useState(initial);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!declarationAccepted || !privacyNoticeAccepted) {
      setError(
        "Please tick both the declaration and privacy notice checkboxes before submitting."
      );
      return;
    }

    setSubmitting(true);

    try {
      await supplierApi.apply(
        preparePayload(
          values,
          declarationAccepted,
          privacyNoticeAccepted
        )
      );

      setSubmitted(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl p-4 py-10 md:p-8">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm md:p-12">
          <CheckCircle2 className="mx-auto mb-5 h-16 w-16 text-green-600" />

          <h1 className="text-2xl font-bold">
            Application submitted successfully!
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Thank you for applying to become a Renamy Global Resources Ltd supplier.
            Your application has been received and your information has been saved.
          </p>

          <p className="mt-5 text-sm font-medium">
            Application status: PENDING
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 py-8 md:p-8">
      <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="bg-primary px-6 py-8 text-primary-foreground md:px-9 md:py-10">
<img
  src="/palmadexLogo.svg"
  alt="Palmadex360 logo"
  className="mb-4 h-20 w-20 object-contain"
/>
          <p className="mb-2 text-sm font-medium opacity-90">
            PALMADEX GIS  SUPPLIER NETWORK
          </p>

          <h1 className="text-2xl font-bold md:text-3xl">
            Potential Supplier Application Form
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 opacity-90">
            Register your business, introduce your products and capabilities,
            and submit your information for supplier verification.
          </p>
        </div>

       <div className="border-t bg-muted/30 px-4 py-5 sm:px-6 md:px-9">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        *
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Required fields
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Complete all fields marked with an asterisk.
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
        <FileCheck className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Application review
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Our team will review your submitted information.
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Privacy matters
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Please read our privacy notice before submitting.
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
        <AlertCircle className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Approval is not guaranteed
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Submitting an application does not guarantee supplier approval.
        </p>
      </div>
    </div>
  </div>
</div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="rounded-2xl border bg-card p-5 shadow-sm md:p-7"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
              {section.fields.map((field) => (
                <div
                  key={field[0]}
                  className={
                    field[2] === "textarea" ? "md:col-span-2" : ""
                  }
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

        <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="flex items-start gap-3">
            <FileCheck className="mt-1 h-6 w-6 shrink-0 text-primary" />

            <div>
              <h2 className="text-lg font-semibold">
                Declaration and privacy notice
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please review and confirm both statements before submitting.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-muted/40">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(event) =>
                setDeclarationAccepted(event.target.checked)
              }
              required
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />

            <span className="text-sm leading-6">
              I declare that the information provided in this application
              is accurate and complete to the best of my knowledge. I
              understand that Renamy Connect may verify the information.
              <span className="ml-1 font-semibold text-red-600">*</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-muted/40">
            <input
              type="checkbox"
              checked={privacyNoticeAccepted}
              onChange={(event) =>
                setPrivacyNoticeAccepted(event.target.checked)
              }
              required
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />

            <span className="text-sm leading-6">
              I acknowledge that I have read the Palmadex GIS privacy
              notice and understand how my business and contact information
              will be processed.
              <span className="ml-1 font-semibold text-red-600">*</span>
            </span>
          </label>

          <p className="text-xs text-muted-foreground">
            Both confirmations are required to submit your application.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

            <p className="text-xs leading-5 text-muted-foreground">
              Please ensure your business information is accurate.
              Submission does not guarantee supplier approval.
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 shrink-0 px-6"
          >
            {submitting ? (
              "Submitting application..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit application
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}