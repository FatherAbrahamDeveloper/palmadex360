
import prisma from "../config/prisma.js";

const MAX_RESULTS_PER_MODULE = 5;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export const globalSearch = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();

    if (query.length < MIN_QUERY_LENGTH) {
      return res.json({
        query,
        results: [],
        total: 0,
      });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        message: `Search query cannot exceed ${MAX_QUERY_LENGTH} characters`,
      });
    }

    const { companyId } = req.user;

    if (!companyId) {
      return res.status(403).json({
        message: "Company access is required",
      });
    }

    const contains = (field) => ({
      [field]: { contains: query },
    });

    const [contacts, suppliers, orders] = await Promise.all([
      // CRM CONTACTS
      prisma.cRMContact.findMany({
        where: {
          companyId,
          OR: [
            contains("displayName"),
            contains("firstName"),
            contains("lastName"),
            contains("companyName"),
            contains("email"),
            contains("phone"),
          ],
        },
        select: {
          id: true,
          displayName: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
        },
        take: MAX_RESULTS_PER_MODULE,
        orderBy: { updatedAt: "desc" },
      }),

      // SUPPLIERS
      prisma.supplier.findMany({
        where: {
          companyId,
          OR: [
            contains("companyName"),
            contains("tradingName"),
            contains("email"),
            contains("contactPerson"),
            contains("city"),
            contains("country"),
            contains("phone"),
          ],
        },
        select: {
          id: true,
          companyName: true,
          tradingName: true,
          contactPerson: true,
          city: true,
          country: true,
          status: true,
        },
        take: MAX_RESULTS_PER_MODULE,
        orderBy: { updatedAt: "desc" },
      }),

      // EXPORT ORDERS
      prisma.exportOrder.findMany({
        where: {
          companyId,
          OR: [
            contains("orderNumber"),
            contains("customerName"),
            contains("productName"),
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          productName: true,
          status: true,
        },
        take: MAX_RESULTS_PER_MODULE,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product.findMany({
  where: {
    companyId,
    OR: [
      { name: { contains: query } },
      { sku: { contains: query } },
      { description: { contains: query } },
      { hsCode: { contains: query } },
      { originCountry: { contains: query } },
    ],
  },
  select: {
    id: true,
    name: true,
    sku: true,
    category: {
      select: {
        name: true,
      },
    },
  },
  take: MAX_RESULTS_PER_MODULE,
  orderBy: { updatedAt: "desc" },
}),
    ]);

    const results = [
      ...contacts.map((contact) => ({
        id: contact.id,
        type: "customer",
        title: contact.displayName,
        subtitle: [
          contact.companyName,
          contact.email,
          contact.status,
        ].filter(Boolean).join(" · "),
        path: `/crm/${contact.id}`,
        module: "CRM",
      })),

      ...suppliers.map((supplier) => ({
        id: supplier.id,
        type: "supplier",
        title: supplier.companyName,
        subtitle: [
          supplier.contactPerson,
          supplier.city,
          supplier.status,
        ].filter(Boolean).join(" · "),
        path: `/suppliers/${supplier.id}`,
        module: "Suppliers",
      })),

      ...orders.map((order) => ({
        id: order.id,
        type: "order",
        title: order.orderNumber,
        subtitle: [
          order.customerName,
          order.productName,
          order.status,
        ].filter(Boolean).join(" · "),
        path: "/orders",
        module: "Export Orders",
      })),
      ...products.map((product) => ({
  id: product.id,
  type: "product",
  title: product.name,
  subtitle: [
    product.sku ? `SKU: ${product.sku}` : null,
    product.category?.name,
  ].filter(Boolean).join(" · "),
  path: "/products",
  module: "Products",
})),
    ];

    return res.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    next(error);
  }
};
