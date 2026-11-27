import prisma from "../config/prisma.js";
import { notificationService } from "./notification.service.js";
import { appUrl } from "./mail.service.js";

const pretty = (s) => String(s || "").replace(/_/g, " ").toLowerCase();

// Tells a customer's portal users about changes to their orders and shipments.
export async function notifyCustomerUsers(companyId, customerIds, { title, message, link = "/portal" }) {
  const ids = [...new Set(customerIds.filter(Boolean))];
  if (!ids.length) return;
  const users = await prisma.user.findMany({
    where: { companyId, customerId: { in: ids }, role: "CUSTOMER", isActive: true, approvalStatus: "APPROVED" },
    select: { id: true, email: true, firstName: true },
  });
  await Promise.all(users.map((u) =>
    notificationService.notify({
      userId: u.id, companyId, title, message, type: "portal.update", link,
      email: { to: u.email, heading: title, paragraphs: [`Hello ${u.firstName},`, message], action: { label: "Open the Customer Portal", url: appUrl(link) } },
    })
  ));
}

export const orderStatusChanged = (order, from) =>
  order.customerId && from !== order.status
    ? notifyCustomerUsers(order.companyId, [order.customerId], {
        title: `Order ${order.orderNumber} is now ${pretty(order.status)}`,
        message: `Your export order ${order.orderNumber} (${order.productName}) moved from ${pretty(from)} to ${pretty(order.status)}.`,
      })
    : null;

export async function shipmentStatusChanged(companyId, shipmentId, from, to) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { orders: { include: { exportOrder: { select: { customerId: true, orderNumber: true } } } } },
  });
  if (!shipment) return;
  const customerIds = shipment.orders.map((o) => o.exportOrder.customerId);
  return notifyCustomerUsers(companyId, customerIds, {
    title: `Shipment ${shipment.shipmentNumber} is now ${pretty(to)}`,
    message: `Shipment ${shipment.shipmentNumber} on ${shipment.vesselName} (${shipment.originPort} to ${shipment.destinationPort}) changed from ${pretty(from)} to ${pretty(to)}.${shipment.eta ? ` Estimated arrival: ${new Date(shipment.eta).toDateString()}.` : ""}`,
  });
}
