import prisma from "../config/prisma.js";
import { permissionService } from "../services/permission.service.js";

const PER_MODULE = 5;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

// One search across every module the user can view. Customers search only their own records.
export const globalSearch = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < MIN_QUERY_LENGTH) return res.json({ query, results: [], total: 0 });
    if (query.length > MAX_QUERY_LENGTH) return res.status(400).json({ message: `Search query cannot exceed ${MAX_QUERY_LENGTH} characters` });

    const user = req.user;
    const { companyId } = user;
    const has = async (m) => permissionService.can(user, m, "VIEW");
    const c = (field) => ({ [field]: { contains: query, mode: "insensitive" } });
    const isCustomer = user.role === "CUSTOMER";
    const tasks = [];

    if (!isCustomer && (await has("crm"))) {
      tasks.push(prisma.cRMContact.findMany({
        where: { companyId, OR: ["displayName", "firstName", "lastName", "companyName", "email", "phone"].map(c) },
        select: { id: true, displayName: true, companyName: true, email: true, status: true },
        take: PER_MODULE, orderBy: { updatedAt: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "contact", module: "CRM", title: r.displayName, subtitle: [r.companyName, r.email, r.status].filter(Boolean).join(" · "), path: `/crm/${r.id}` }))));
    }
    if (!isCustomer && (await has("suppliers"))) {
      tasks.push(prisma.supplier.findMany({
        where: { companyId, OR: ["companyName", "tradingName", "email", "contactPerson", "city", "country", "phone"].map(c) },
        select: { id: true, companyName: true, contactPerson: true, city: true, status: true },
        take: PER_MODULE, orderBy: { updatedAt: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "supplier", module: "Suppliers", title: r.companyName, subtitle: [r.contactPerson, r.city, r.status].filter(Boolean).join(" · "), path: `/suppliers/${r.id}` }))));
    }
    if (isCustomer || (await has("orders"))) {
      tasks.push(prisma.exportOrder.findMany({
        where: { companyId, ...(isCustomer ? { customerId: user.customerId || "__none__" } : {}), OR: ["orderNumber", "customerName", "productName"].map(c) },
        select: { id: true, orderNumber: true, customerName: true, productName: true, status: true },
        take: PER_MODULE, orderBy: { updatedAt: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "order", module: "Export Orders", title: r.orderNumber, subtitle: [isCustomer ? null : r.customerName, r.productName, r.status].filter(Boolean).join(" · "), path: isCustomer ? `/portal?order=${r.id}` : `/orders?q=${encodeURIComponent(r.orderNumber)}` }))));
    }
    if (isCustomer || (await has("products"))) {
      tasks.push(prisma.product.findMany({
        where: { companyId, ...(isCustomer ? { isActive: true } : {}), OR: ["name", "sku", "description", "hsCode"].map(c) },
        select: { id: true, name: true, sku: true, category: { select: { name: true } } },
        take: PER_MODULE, orderBy: { updatedAt: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "product", module: "Products", title: r.name, subtitle: [r.sku ? `SKU: ${r.sku}` : null, r.category?.name].filter(Boolean).join(" · "), path: isCustomer ? `/portal?tab=catalog&product=${r.id}` : `/products/${r.id}` }))));
    }
    if (!isCustomer && (await has("shipping"))) {
      tasks.push(prisma.shipment.findMany({
        where: { companyId, OR: ["shipmentNumber", "vesselName", "bookingNumber", "billOfLadingNumber", "destinationPort"].map(c) },
        select: { id: true, shipmentNumber: true, vesselName: true, destinationPort: true, status: true },
        take: PER_MODULE, orderBy: { updatedAt: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "shipment", module: "Shipping", title: r.shipmentNumber, subtitle: [r.vesselName, r.destinationPort, r.status].filter(Boolean).join(" · "), path: `/shipping?q=${encodeURIComponent(r.shipmentNumber)}` }))));
    }
    if (!isCustomer && (await has("portal"))) {
      tasks.push(prisma.customer.findMany({
        where: { companyId, OR: ["name", "email", "phone", "country"].map(c) },
        select: { id: true, name: true, country: true, email: true },
        take: PER_MODULE, orderBy: { name: "asc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "customer", module: "Customers", title: r.name, subtitle: [r.country, r.email].filter(Boolean).join(" · "), path: `/portal?customer=${r.id}` }))));
    }
    if (await has("support")) {
      const agent = !isCustomer && (await permissionService.can(user, "support", "EDIT"));
      const scope = agent ? {} : isCustomer && user.customerId ? { OR: [{ createdById: user.id }, { customerId: user.customerId }] } : { createdById: user.id };
      tasks.push(prisma.supportTicket.findMany({
        where: { companyId, ...scope, AND: [{ OR: ["ticketNumber", "subject"].map(c) }] },
        select: { id: true, ticketNumber: true, subject: true, status: true },
        take: PER_MODULE, orderBy: { updatedAt: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "ticket", module: "Support", title: `${r.ticketNumber} · ${r.subject}`, subtitle: r.status.replace(/_/g, " "), path: `/support?t=${r.id}` }))));
    }
    if (await has("knowledge")) {
      const editor = !isCustomer && (await permissionService.can(user, "knowledge", "EDIT"));
      tasks.push(prisma.knowledgeArticle.findMany({
        where: { companyId, ...(editor ? {} : { status: "PUBLISHED" }), ...(isCustomer ? { audience: "ALL" } : {}), OR: ["title", "summary", "tags"].map(c) },
        select: { id: true, title: true, slug: true, type: true },
        take: PER_MODULE, orderBy: { viewCount: "desc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "article", module: "Knowledge Base", title: r.title, subtitle: r.type.charAt(0) + r.type.slice(1).toLowerCase(), path: `/knowledge/${r.slug}` }))));
    }
    if (!isCustomer && (await has("access"))) {
      tasks.push(prisma.user.findMany({
        where: { companyId, OR: ["firstName", "lastName", "email"].map(c) },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        take: PER_MODULE, orderBy: { firstName: "asc" },
      }).then((rows) => rows.map((r) => ({ id: r.id, type: "user", module: "Users", title: `${r.firstName} ${r.lastName}`, subtitle: [r.email, r.role.replace(/_/g, " ")].join(" · "), path: `/access?user=${r.id}` }))));
    }

    const results = (await Promise.all(tasks)).flat();
    res.json({ query, results, total: results.length });
  } catch (error) {
    next(error);
  }
};
