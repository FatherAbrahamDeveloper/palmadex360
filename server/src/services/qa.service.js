import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { permissionService } from "./permission.service.js";
import { notificationService } from "./notification.service.js";
import { activityService } from "./activity.service.js";
import { appUrl } from "./mail.service.js";
import { DEFAULT_QA_TEMPLATES } from "./qaDefaults.js";

// Commodity quality checklists (QA/QC) for procurement.
//
// A template is an ordered list of rows (see qaDefaults.js for the row types).
// An inspection copies the template's rows, collects answers, and on submit is
// evaluated row by row. Any failed critical row makes the inspection FAILED, which:
//   - stops the linked purchase request from being marked completed, and
//   - stops a linked shipment from moving to Loading or any later status,
// until an Administrator or Super Admin overrides it with a reason, or a newer
// inspection of the same container passes.

export const OVERRIDE_ROLES = ["SUPER_ADMIN", "ADMIN"];
const fullName = (u) => (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : null);
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

/* ----------------------------- evaluation ----------------------------- */

function rangeText(min, max, unit = "") {
  const u = unit === "%" ? "%" : unit ? ` ${unit}` : "";
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}${u}`;
  if (max != null) return `max ${fmt(max)}${u}`;
  if (min != null) return `min ${fmt(min)}${u}`;
  return "";
}
const within = (v, min, max) => (min == null || v >= min) && (max == null || v <= max);

// Returns { results, failures, missing }.
export function evaluate(parameters, answers = {}) {
  const results = [];
  const missing = [];
  for (const p of parameters) {
    const a = answers[p.key] || {};
    const u = p.unit === "%" ? "%" : p.unit ? ` ${p.unit}` : "";
    let status = "PASS";
    let message = "";

    if (p.type === "CHOICE") {
      const chosen = (p.options || []).find((o) => o.label === a.option);
      if (!chosen) {
        status = "MISSING";
      } else if (p.measure) {
        if (a.value == null || Number.isNaN(Number(a.value))) {
          status = "MISSING";
          message = `Spec ${chosen.label}, measured value not entered`;
        } else {
          const v = Number(a.value);
          const ok = within(v, chosen.min, chosen.max);
          status = ok ? "PASS" : "FAIL";
          message = ok
            ? `Measured ${fmt(v)}${u}, within ${chosen.label}`
            : `Measured ${fmt(v)}${u} is outside the ticked spec ${chosen.label}`;
        }
      } else if (chosen.acceptable === false) {
        status = "FAIL";
        message = `${chosen.label} is not acceptable`;
      } else {
        status = "INFO";
        message = chosen.label;
      }
    } else if (p.type === "CONFIRM") {
      if (a.confirmed === true) { status = "PASS"; message = `Confirmed: ${p.requirement}`; }
      else if (a.confirmed === false) { status = "FAIL"; message = `Not met: ${p.requirement}`; }
      else status = "MISSING";
    } else if (p.type === "NUMBER") {
      if (a.value == null || Number.isNaN(Number(a.value))) status = "MISSING";
      else {
        const v = Number(a.value);
        if (p.min == null && p.max == null) { status = "INFO"; message = `${fmt(v)}${u}`; }
        else {
          const ok = within(v, p.min, p.max);
          status = ok ? "PASS" : "FAIL";
          message = `${fmt(v)}${u} ${ok ? "is within" : "is outside"} ${rangeText(p.min, p.max, p.unit)}`;
        }
      }
    } else {
      const text = (a.text || "").trim();
      status = text ? "INFO" : "MISSING";
      message = text;
    }

    if (status === "FAIL" && p.critical === false) status = "WARN";
    if (status === "MISSING" && p.required !== false) missing.push(p.label);
    if (status === "MISSING" && p.required === false) status = "INFO";
    results.push({ key: p.key, label: p.label, status, message, note: a.note || null });
  }
  const failures = results.filter((r) => r.status === "FAIL");
  return { results, failures, missing };
}

/* ------------------------------- helpers ------------------------------ */

const templateDto = (t) => ({
  id: t.id, name: t.name, commodity: t.commodity, productId: t.productId, product: t.product || null,
  description: t.description, parameters: t.parameters, isActive: t.isActive, version: t.version,
  inspectionCount: t._count?.inspections ?? undefined, createdAt: t.createdAt, updatedAt: t.updatedAt,
});

const INSPECTION_INCLUDE = {
  purchaseRequest: { select: { id: true, requestNumber: true, itemName: true, status: true } },
  shipment: { select: { id: true, shipmentNumber: true, status: true } },
  supplier: { select: { id: true, companyName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  overriddenBy: { select: { id: true, firstName: true, lastName: true } },
};

function inspectionDto(i, user) {
  const draft = i.status === "DRAFT";
  return {
    id: i.id, inspectionNumber: i.inspectionNumber, templateId: i.templateId, templateName: i.templateName,
    templateVersion: i.templateVersion, commodity: i.commodity,
    purchaseRequestId: i.purchaseRequestId, purchaseRequest: i.purchaseRequest || null,
    shipmentId: i.shipmentId, shipment: i.shipment || null,
    supplierId: i.supplierId, supplier: i.supplier || null,
    cropYear: i.cropYear, inspectionDate: i.inspectionDate, containerNumber: i.containerNumber,
    parameters: i.parameters, answers: i.answers || {}, results: i.results || null,
    generalComment: i.generalComment, inspectorName: i.inspectorName, signedAt: i.signedAt,
    status: i.status, failureSummary: i.failureSummary, submittedAt: i.submittedAt,
    overriddenAt: i.overriddenAt, overrideReason: i.overrideReason,
    overriddenBy: i.overriddenBy ? { id: i.overriddenBy.id, name: fullName(i.overriddenBy) } : null,
    createdBy: i.createdBy ? { id: i.createdBy.id, name: fullName(i.createdBy) } : null,
    createdAt: i.createdAt, updatedAt: i.updatedAt,
    canEdit: draft,
    canDelete: draft,
    supersededBy: i.supersededBy || null,
    canOverride: i.status === "FAILED" && !i.supersededBy && OVERRIDE_ROLES.includes(user?.role),
  };
}

async function requireTemplateManager(user) {
  if (!(await permissionService.can(user, "procurement", "FULL"))) {
    throw new HttpError(403, "Only users with full Procurement access can manage checklist templates");
  }
}

async function nextNumber(companyId) {
  const prefix = `QC-${new Date().getFullYear()}-`;
  const last = await prisma.qaInspection.findFirst({
    where: { companyId, inspectionNumber: { startsWith: prefix } },
    orderBy: { inspectionNumber: "desc" }, select: { inspectionNumber: true },
  });
  const n = last ? parseInt(last.inspectionNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isNaN(n) ? 1 : n).padStart(4, "0")}`;
}

async function getInspection(companyId, id) {
  const i = await prisma.qaInspection.findFirst({ where: { id, companyId }, include: INSPECTION_INCLUDE });
  if (!i) throw new HttpError(404, "Quality check not found");
  return i;
}

// Validates and normalises the purchase request / shipment links.
async function resolveLinks(companyId, input, current = {}) {
  const out = {};
  if (input.purchaseRequestId !== undefined) {
    if (input.purchaseRequestId) {
      const pr = await prisma.purchaseRequest.findFirst({ where: { id: input.purchaseRequestId, companyId }, select: { id: true, supplierId: true } });
      if (!pr) throw new HttpError(400, "Selected purchase request was not found");
      out.purchaseRequestId = pr.id;
      out.supplierId = pr.supplierId || null;
    } else {
      out.purchaseRequestId = null;
      if (current.purchaseRequestId) out.supplierId = null;
    }
  }
  if (input.shipmentId !== undefined) {
    if (input.shipmentId) {
      const s = await prisma.shipment.findFirst({ where: { id: input.shipmentId, companyId }, select: { id: true } });
      if (!s) throw new HttpError(400, "Selected shipment was not found");
      out.shipmentId = s.id;
    } else out.shipmentId = null;
  }
  return out;
}

const cleanAnswers = (parameters, answers = {}) => {
  const keys = new Set(parameters.map((p) => p.key));
  return Object.fromEntries(Object.entries(answers).filter(([k]) => keys.has(k)));
};

// For a failed check: the newer submitted check of the same container (in the same
// purchase request or shipment) that replaced it, if any. Replaced failures no longer block.
async function supersededBy(i) {
  if (i.status !== "FAILED" || !(i.purchaseRequestId || i.shipmentId)) return null;
  const scope = [i.purchaseRequestId && { purchaseRequestId: i.purchaseRequestId }, i.shipmentId && { shipmentId: i.shipmentId }].filter(Boolean);
  return prisma.qaInspection.findFirst({
    where: {
      companyId: i.companyId, id: { not: i.id }, OR: scope,
      containerNumber: i.containerNumber ? { equals: i.containerNumber, mode: "insensitive" } : null,
      status: { in: ["PASSED", "FAILED", "OVERRIDDEN"] }, submittedAt: { gt: i.submittedAt },
    },
    orderBy: { submittedAt: "desc" },
    select: { id: true, inspectionNumber: true, status: true },
  });
}

/* -------------------------- blocking (used by others) -------------------------- */

// The latest submitted check per container decides. Returns the failed ones.
export async function blockingFailures(companyId, where) {
  const rows = await prisma.qaInspection.findMany({
    where: { companyId, ...where, status: { in: ["PASSED", "FAILED", "OVERRIDDEN"] } },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, inspectionNumber: true, containerNumber: true, status: true, failureSummary: true },
  });
  const latest = new Map();
  for (const r of rows) {
    const k = (r.containerNumber || "").trim().toUpperCase();
    if (!latest.has(k)) latest.set(k, r);
  }
  return [...latest.values()].filter((r) => r.status === "FAILED");
}

export function blockedMessage(failures, what) {
  const f = failures[0];
  const more = failures.length > 1 ? ` (and ${failures.length - 1} more)` : "";
  const why = f.failureSummary ? `: ${f.failureSummary.split("\n")[0]}` : "";
  return `${what} is blocked because quality check ${f.inspectionNumber}${f.containerNumber ? ` for container ${f.containerNumber}` : ""} failed${why}${more}. Please contact an administrator to review or override it.`;
}

/* -------------------------------- service -------------------------------- */

export const qaService = {
  // Creates the starting checklists the first time a company uses quality checks.
  async ensureDefaults(companyId, userId) {
    const count = await prisma.qaTemplate.count({ where: { companyId } });
    if (count) return;
    for (const t of DEFAULT_QA_TEMPLATES) {
      await prisma.qaTemplate.upsert({
        where: { companyId_name: { companyId, name: t.name } },
        create: { ...t, companyId, createdById: userId || null },
        update: {},
      });
    }
  },

  /* templates */
  async listTemplates(user, { includeInactive } = {}) {
    await this.ensureDefaults(user.companyId, user.id);
    const rows = await prisma.qaTemplate.findMany({
      where: { companyId: user.companyId, ...(includeInactive ? {} : { isActive: true }) },
      include: { product: { select: { id: true, name: true } }, _count: { select: { inspections: true } } },
      orderBy: [{ isActive: "desc" }, { commodity: "asc" }],
    });
    return { data: rows.map(templateDto) };
  },

  async getTemplate(user, id) {
    const t = await prisma.qaTemplate.findFirst({
      where: { id, companyId: user.companyId },
      include: { product: { select: { id: true, name: true } }, _count: { select: { inspections: true } } },
    });
    if (!t) throw new HttpError(404, "Checklist template not found");
    return templateDto(t);
  },

  async createTemplate(user, input) {
    await requireTemplateManager(user);
    if (input.productId && !(await prisma.product.findFirst({ where: { id: input.productId, companyId: user.companyId } }))) {
      throw new HttpError(400, "Selected product was not found");
    }
    if (await prisma.qaTemplate.findFirst({ where: { companyId: user.companyId, name: input.name } })) {
      throw new HttpError(409, "A checklist with this name already exists");
    }
    const t = await prisma.qaTemplate.create({ data: { ...input, companyId: user.companyId, createdById: user.id } });
    activityService.record({ companyId: user.companyId, userId: user.id, action: "created", entity: "QaTemplate", entityId: t.id, summary: `created the checklist ${t.name}`, link: "/procurement?tab=templates" });
    return this.getTemplate(user, t.id);
  },

  async updateTemplate(user, id, input) {
    await requireTemplateManager(user);
    const existing = await this.getTemplate(user, id);
    if (input.productId && !(await prisma.product.findFirst({ where: { id: input.productId, companyId: user.companyId } }))) {
      throw new HttpError(400, "Selected product was not found");
    }
    if (input.name && input.name !== existing.name && (await prisma.qaTemplate.findFirst({ where: { companyId: user.companyId, name: input.name } }))) {
      throw new HttpError(409, "A checklist with this name already exists");
    }
    const data = { ...input };
    if (input.parameters) data.version = existing.version + 1;
    await prisma.qaTemplate.update({ where: { id }, data });
    activityService.record({ companyId: user.companyId, userId: user.id, action: "updated", entity: "QaTemplate", entityId: id, summary: `updated the checklist ${input.name || existing.name}`, link: "/procurement?tab=templates" });
    return this.getTemplate(user, id);
  },

  // Templates already used are switched off instead of deleted, so records stay readable.
  async removeTemplate(user, id) {
    await requireTemplateManager(user);
    const t = await this.getTemplate(user, id);
    if (t.inspectionCount) {
      await prisma.qaTemplate.update({ where: { id }, data: { isActive: false } });
      return { deactivated: true };
    }
    await prisma.qaTemplate.delete({ where: { id } });
    return { deleted: true };
  },

  /* inspections */
  async options(user) {
    await this.ensureDefaults(user.companyId, user.id);
    const companyId = user.companyId;
    const [templates, requests, shipments] = await Promise.all([
      prisma.qaTemplate.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, commodity: true, productId: true }, orderBy: { commodity: "asc" } }),
      prisma.purchaseRequest.findMany({
        where: { companyId, status: { in: ["APPROVED", "IN_PROGRESS", "PENDING"] } },
        select: { id: true, requestNumber: true, itemName: true, supplierName: true, status: true },
        orderBy: { createdAt: "desc" }, take: 200,
      }),
      prisma.shipment.findMany({
        where: { companyId, status: { not: "CANCELLED" } },
        select: { id: true, shipmentNumber: true, status: true, destinationPort: true },
        orderBy: { createdAt: "desc" }, take: 200,
      }),
    ]);
    return { data: { templates, purchaseRequests: requests, shipments } };
  },

  async list(user, q) {
    const where = { companyId: user.companyId };
    if (q.status) where.status = q.status;
    if (q.purchaseRequestId) where.purchaseRequestId = q.purchaseRequestId;
    if (q.shipmentId) where.shipmentId = q.shipmentId;
    if (q.search) {
      where.OR = [
        { inspectionNumber: { contains: q.search, mode: "insensitive" } },
        { commodity: { contains: q.search, mode: "insensitive" } },
        { containerNumber: { contains: q.search, mode: "insensitive" } },
        { inspectorName: { contains: q.search, mode: "insensitive" } },
      ];
    }
    const [rows, total, counts] = await Promise.all([
      prisma.qaInspection.findMany({ where, include: INSPECTION_INCLUDE, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.limit, take: q.limit }),
      prisma.qaInspection.count({ where }),
      prisma.qaInspection.groupBy({ by: ["status"], where: { companyId: user.companyId }, _count: { _all: true } }),
    ]);
    const summary = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
    for (const r of rows) if (r.status === "FAILED") r.supersededBy = await supersededBy(r);
    return {
      data: rows.map((r) => {
        const d = inspectionDto(r, user);
        delete d.parameters; delete d.answers;
        return d;
      }),
      meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)), summary },
    };
  },

  async get(user, id) {
    const i = await getInspection(user.companyId, id);
    i.supersededBy = await supersededBy(i);
    return inspectionDto(i, user);
  },

  async create(user, input) {
    const template = await prisma.qaTemplate.findFirst({ where: { id: input.templateId, companyId: user.companyId } });
    if (!template) throw new HttpError(400, "Selected checklist was not found");
    if (!template.isActive) throw new HttpError(400, "This checklist is switched off. Choose another one.");
    const links = await resolveLinks(user.companyId, input);
    const { templateId, answers, purchaseRequestId, shipmentId, ...header } = input;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const row = await prisma.qaInspection.create({
          data: {
            ...header, ...links,
            inspectionDate: header.inspectionDate || new Date(),
            companyId: user.companyId, createdById: user.id,
            inspectionNumber: await nextNumber(user.companyId),
            templateId: template.id, templateName: template.name, templateVersion: template.version, commodity: template.commodity,
            parameters: template.parameters,
            answers: cleanAnswers(template.parameters, answers),
            inspectorName: header.inspectorName || fullName(user),
          },
        });
        return this.get(user, row.id);
      } catch (err) {
        if (err?.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }
  },

  async update(user, id, input) {
    const existing = await getInspection(user.companyId, id);
    if (existing.status !== "DRAFT") throw new HttpError(409, "A submitted quality check cannot be changed. Start a new check instead.");
    const links = await resolveLinks(user.companyId, input, existing);
    const { answers, purchaseRequestId, shipmentId, ...header } = input;
    const data = { ...header, ...links };
    if (answers) data.answers = cleanAnswers(existing.parameters, { ...(existing.answers || {}), ...answers });
    await prisma.qaInspection.update({ where: { id }, data });
    return this.get(user, id);
  },

  async remove(user, id) {
    const existing = await getInspection(user.companyId, id);
    if (existing.status !== "DRAFT") throw new HttpError(409, "Submitted quality checks are kept as a record and cannot be deleted");
    await prisma.qaInspection.delete({ where: { id } });
  },

  async submit(user, id, { inspectorName }) {
    const existing = await getInspection(user.companyId, id);
    if (existing.status !== "DRAFT") throw new HttpError(409, "This quality check has already been submitted");
    const { results, failures, missing } = evaluate(existing.parameters, existing.answers || {});
    if (missing.length) {
      throw new HttpError(400, `Complete these rows before submitting: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}`);
    }
    const failed = failures.length > 0;
    const failureSummary = failed ? failures.map((f) => `${f.label}: ${f.message}`).join("\n") : null;

    const updated = await prisma.qaInspection.updateMany({
      where: { id, companyId: user.companyId, status: "DRAFT" },
      data: {
        status: failed ? "FAILED" : "PASSED", results, failureSummary,
        inspectorName, signedAt: new Date(), submittedAt: new Date(),
      },
    });
    if (!updated.count) throw new HttpError(409, "This quality check was just updated by someone else. Refresh and try again.");

    const label = `${existing.inspectionNumber} (${existing.commodity}${existing.containerNumber ? `, container ${existing.containerNumber}` : ""})`;
    activityService.record({
      companyId: user.companyId, userId: user.id, action: failed ? "failed" : "passed", entity: "QaInspection", entityId: id,
      summary: `${failed ? "recorded a FAILED" : "recorded a passed"} quality check ${label}`, link: `/procurement?tab=quality&check=${id}`,
    });

    if (failed) {
      const admins = await prisma.user.findMany({
        where: { companyId: user.companyId, role: { in: OVERRIDE_ROLES }, isActive: true, approvalStatus: "APPROVED", id: { not: user.id } },
        select: { id: true, email: true },
      });
      const link = `/procurement?tab=quality&check=${id}`;
      for (const a of admins) {
        notificationService.notify({
          userId: a.id, companyId: user.companyId, type: "QUALITY_FAILED",
          title: `Quality check failed: ${existing.inspectionNumber}`,
          message: `${existing.commodity}${existing.containerNumber ? `, container ${existing.containerNumber}` : ""}. ${failures.length} parameter(s) out of spec. Loading is blocked until reviewed.`,
          link,
          email: { to: a.email, paragraphs: [`Submitted by ${fullName(user)}.`, ...failures.map((f) => `${f.label}: ${f.message}`), "Loading is blocked until an administrator reviews it or a new check passes."], action: { label: "Review the quality check", url: appUrl(link) } },
        }).catch(() => {});
      }
    }
    return this.get(user, id);
  },

  async override(user, id, { reason }) {
    if (!OVERRIDE_ROLES.includes(user.role)) throw new HttpError(403, "Only an Administrator or Super Admin can override a failed quality check");
    const existing = await getInspection(user.companyId, id);
    if (existing.status !== "FAILED") throw new HttpError(409, "Only failed quality checks can be overridden");
    const newer = await supersededBy(existing);
    if (newer) throw new HttpError(409, `This failure was already replaced by ${newer.inspectionNumber} and no longer blocks loading`);
    await prisma.qaInspection.update({
      where: { id },
      data: { status: "OVERRIDDEN", overriddenById: user.id, overriddenAt: new Date(), overrideReason: reason },
    });
    activityService.record({
      companyId: user.companyId, userId: user.id, action: "overrode", entity: "QaInspection", entityId: id,
      summary: `overrode failed quality check ${existing.inspectionNumber}`, link: `/procurement?tab=quality&check=${id}`,
    });
    if (existing.createdById && existing.createdById !== user.id) {
      notificationService.notify({
        userId: existing.createdById, companyId: user.companyId, type: "QUALITY_OVERRIDDEN",
        title: `Quality check ${existing.inspectionNumber} released`,
        message: `${fullName(user)} overrode the failure: ${reason}`,
        link: `/procurement?tab=quality&check=${id}`,
      }).catch(() => {});
    }
    return this.get(user, id);
  },
};
