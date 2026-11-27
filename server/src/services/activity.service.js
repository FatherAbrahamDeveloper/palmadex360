import prisma from "../config/prisma.js";
import { ENTITY_MODULE, atLeast } from "../config/access.js";
import { emitToCompany } from "../realtime/socket.js";

const ENTITY_LABEL = {
  CRMContact: "CRM contact", Supplier: "supplier", SupplierApplication: "supplier application",
  Product: "product", ExportOrder: "export order", Shipment: "shipment", File: "document",
  ComplianceRequirement: "compliance requirement", Warehouse: "warehouse", StockLevel: "stock item",
  Invoice: "invoice", Expense: "expense", PurchaseRequest: "purchase request", Customer: "customer",
  QaInspection: "quality check", QaTemplate: "quality checklist", User: "user", SupportTicket: "support ticket", KnowledgeArticle: "help article", Conversation: "conversation",
};

const parse = (s) => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
const name = (u) => (u ? `${u.firstName} ${u.lastName}`.trim() : "System");

const toDto = (a) => {
  const d = parse(a.details);
  const what = ENTITY_LABEL[a.entity] || (a.entity || "record").toLowerCase();
  const sentence = d.summary
    ? `${name(a.user)} ${d.summary}`
    : `${name(a.user)} ${a.action} ${what}${d.label ? ` ${d.label}` : ""}${d.status ? ` (${String(d.status).replace(/_/g, " ").toLowerCase()})` : ""}`;
  return {
    id: a.id, action: a.action, entity: a.entity, entityId: a.entityId, label: d.label || null,
    status: d.status || null, link: d.link || null, text: sentence, actor: a.user ? { id: a.user.id, name: name(a.user) } : null,
    createdAt: a.createdAt,
  };
};

export const activityService = {
  async record({ companyId, userId, action, entity, entityId, label, status, summary, link, ip }) {
    try {
      const row = await prisma.auditLog.create({
        data: {
          companyId: companyId || null, userId: userId || null, action, entity: entity || null,
          entityId: entityId || null, ipAddress: ip || null,
          details: JSON.stringify({ label, status, summary, link }),
        },
      });
      // Only a ping: each client refetches its own permission-filtered feed.
      emitToCompany(companyId, "activity:new", { id: row.id });
      return row;
    } catch (err) {
      console.error("ACTIVITY LOG ERROR:", err.message);
      return null;
    }
  },

  // Feed for one user, limited to modules they can view. Customers see only their own actions.
  async feed(user, { limit = 15, before } = {}) {
    const where = { companyId: user.companyId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) };
    if (user.role === "CUSTOMER") {
      where.userId = user.id;
    } else if (user.role !== "SUPER_ADMIN") {
      const visible = Object.entries(ENTITY_MODULE)
        .filter(([, module]) => atLeast(user.permissions?.[module] || "NONE", "VIEW"))
        .map(([entity]) => entity);
      where.OR = [{ entity: { in: [...visible, "Conversation"] } }, { entity: null }];
    }
    const rows = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });
    return rows.map(toDto);
  },
};
