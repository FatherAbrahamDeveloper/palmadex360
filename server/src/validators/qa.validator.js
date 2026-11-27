import { z } from "zod";

const optStr = (max) => z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());
const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().finite().nullable().optional()
);

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "row";

const option = z.object({
  label: z.string().trim().min(1, "Option label is required").max(80),
  min: optNum,
  max: optNum,
  acceptable: z.boolean().optional().default(true),
});

const parameter = z
  .object({
    key: optStr(40),
    label: z.string().trim().min(1, "Every row needs a name").max(120),
    type: z.enum(["CHOICE", "CONFIRM", "NUMBER", "TEXT"]),
    options: z.array(option).max(8).optional(),
    measure: z.boolean().optional().default(false),
    requirement: optStr(200),
    unit: optStr(20),
    min: optNum,
    max: optNum,
    critical: z.boolean().optional().default(true),
    required: z.boolean().optional().default(true),
    help: optStr(300),
  })
  .superRefine((p, ctx) => {
    if (p.type === "CHOICE" && (!p.options || p.options.length < 2)) {
      ctx.addIssue({ code: "custom", path: ["options"], message: `"${p.label}" needs at least two options` });
    }
    if (p.type === "CONFIRM" && !p.requirement) {
      ctx.addIssue({ code: "custom", path: ["requirement"], message: `"${p.label}" needs the requirement to confirm` });
    }
    const pairs = p.type === "NUMBER" ? [p] : p.type === "CHOICE" && p.measure ? p.options || [] : [];
    for (const o of pairs) {
      if (o.min !== null && o.min !== undefined && o.max !== null && o.max !== undefined && o.min > o.max) {
        ctx.addIssue({ code: "custom", path: ["min"], message: `"${p.label}": minimum is higher than maximum` });
      }
    }
  });

// Gives every row a unique key (used to match answers to rows).
const withKeys = (params) => {
  const seen = new Set();
  return params.map((p) => {
    let key = slug(p.key || p.label);
    let n = 2;
    while (seen.has(key)) key = `${slug(p.key || p.label)}_${n++}`;
    seen.add(key);
    const clean = { ...p, key };
    if (clean.type !== "CHOICE") { delete clean.options; delete clean.measure; }
    if (clean.type !== "CONFIRM") delete clean.requirement;
    if (clean.type !== "NUMBER") { delete clean.min; delete clean.max; }
    if (clean.type === "CONFIRM" || clean.type === "TEXT") delete clean.unit;
    if (clean.type === "TEXT") clean.critical = false;
    return clean;
  });
};

export const templateSchema = z.object({
  name: z.string().trim().min(3, "Template name is required").max(150),
  commodity: z.string().trim().min(2, "Commodity is required").max(100),
  productId: optStr(40),
  description: optStr(2000),
  isActive: z.boolean().optional(),
  parameters: z.array(parameter).min(1, "Add at least one checklist row").max(60).transform(withKeys),
});
export const templateUpdateSchema = templateSchema.partial();

const answer = z.object({
  option: optStr(80),
  value: optNum,
  confirmed: z.boolean().nullable().optional(),
  text: optStr(500),
  note: optStr(500),
});

const header = {
  purchaseRequestId: optStr(40),
  shipmentId: optStr(40),
  cropYear: optStr(20),
  inspectionDate: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional()),
  containerNumber: z.preprocess((v) => (v === "" ? null : typeof v === "string" ? v.trim().toUpperCase() : v), z.string().max(40).nullable().optional()),
  generalComment: optStr(5000),
  inspectorName: optStr(150),
  answers: z.record(z.string(), answer).optional(),
};

export const createInspectionSchema = z.object({ templateId: z.string().trim().min(1, "Choose a checklist"), ...header });
export const updateInspectionSchema = z.object(header);

export const submitInspectionSchema = z.object({
  inspectorName: z.string().trim().min(2, "Enter the inspector's name").max(150),
  signed: z.literal(true, { message: "Confirm the checklist before submitting" }),
});

export const overrideSchema = z.object({
  reason: z.string().trim().min(10, "Explain why the failure is being released (at least 10 characters)").max(2000),
});

export const listInspectionsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PASSED", "FAILED", "OVERRIDDEN"]).optional(),
  purchaseRequestId: z.string().trim().optional(),
  shipmentId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
