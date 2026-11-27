import { customerService } from "../services/customer.service.js";
import { portalService, resolvePortalCustomer } from "../services/portal.service.js";
import * as v from "../validators/customer.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const customerController = {
  list: asyncHandler(async (req, res) => res.json(await customerService.list(req.user.companyId, v.listCustomersQuery.parse(req.query)))),
  options: asyncHandler(async (req, res) => res.json({ data: await customerService.options(req.user.companyId) })),
  get: asyncHandler(async (req, res) => res.json({ data: await customerService.get(req.user.companyId, req.params.id) })),
  create: asyncHandler(async (req, res) => res.status(201).json({ data: await customerService.create(req.user.companyId, v.customerSchema.parse(req.body)) })),
  update: asyncHandler(async (req, res) => res.json({ data: await customerService.update(req.user.companyId, req.params.id, v.updateCustomerSchema.parse(req.body)) })),
  remove: asyncHandler(async (req, res) => { await customerService.remove(req.user.companyId, req.params.id); res.status(204).send(); }),
};

const scoped = (fn) => asyncHandler(async (req, res) => {
  const customer = await resolvePortalCustomer(req.user, req.query.customerId);
  return fn(req, res, customer);
});

export const portalController = {
  summary: scoped(async (req, res, c) => res.json({ data: await portalService.summary(req.user, c) })),
  catalog: asyncHandler(async (req, res) => res.json({ data: await portalService.catalog(req.user, { q: req.query.q ? String(req.query.q).slice(0, 100) : "" }) })),
  orders: scoped(async (req, res, c) => res.json(await portalService.orders(req.user, c, {
    status: ["PENDING", "PROCESSING", "IN_TRANSIT", "DELIVERED", "CANCELLED"].includes(req.query.status) ? req.query.status : undefined,
    page: Math.max(1, Number(req.query.page) || 1), limit: Math.min(50, Number(req.query.limit) || 20),
  }))),
  order: scoped(async (req, res, c) => res.json({ data: await portalService.order(req.user, c, req.params.id) })),
  placeOrder: scoped(async (req, res, c) => res.status(201).json({ data: await portalService.placeOrder(req.user, c, v.portalOrderSchema.parse(req.body)) })),
  cancelOrder: scoped(async (req, res, c) => res.json({ data: await portalService.cancelOrder(req.user, c, req.params.id) })),
  shipments: scoped(async (req, res, c) => res.json({ data: await portalService.shipments(req.user, c) })),
  invoices: scoped(async (req, res, c) => res.json({ data: await portalService.invoices(req.user, c) })),
  documents: scoped(async (req, res, c) => res.json({ data: await portalService.documents(req.user, c) })),
};
