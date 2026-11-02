-- CreateEnum
CREATE TYPE "public"."ExportOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('BOOKED', 'LOADING', 'AT_SEA', 'CUSTOMS', 'ARRIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('PROCUREMENT', 'LOGISTICS', 'SALARIES', 'UTILITIES', 'TAXES_DUTIES', 'MARKETING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ComplianceStatus" AS ENUM ('NOT_STARTED', 'DOCUMENTATION_PENDING', 'IN_REVIEW', 'COMPLIANT', 'ACTION_REQUIRED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ComplianceRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ComplianceDocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "hsCode" VARCHAR(20),
ADD COLUMN     "isNewListing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minimumOrderQuantity" DECIMAL(15,3),
ADD COLUMN     "originCountry" VARCHAR(100) DEFAULT 'Nigeria',
ADD COLUMN     "packaging" TEXT,
ADD COLUMN     "priceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "specifications" TEXT,
ADD COLUMN     "stockQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ALTER COLUMN "sku" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "unit" SET DEFAULT 'ton',
ALTER COLUMN "unit" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- CreateTable
CREATE TABLE "public"."ExportOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderNumber" VARCHAR(30) NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'ton',
    "totalValue" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "status" "public"."ExportOrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "shipmentNumber" VARCHAR(30) NOT NULL,
    "vesselName" TEXT NOT NULL,
    "voyageNumber" VARCHAR(50),
    "shippingLine" VARCHAR(100),
    "bookingNumber" VARCHAR(50),
    "billOfLadingNumber" VARCHAR(50),
    "originPort" TEXT NOT NULL,
    "destinationPort" TEXT NOT NULL,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "containerCount" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'BOOKED',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentOrder" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "exportOrderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromStatus" "public"."ShipmentStatus",
    "toStatus" "public"."ShipmentStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(20),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockLevel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'ton',
    "capacity" DECIMAL(15,3),
    "reorderLevel" DECIMAL(15,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stockLevelId" TEXT NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
    "quantityChange" DECIMAL(15,3) NOT NULL,
    "balanceAfter" DECIMAL(15,3) NOT NULL,
    "reference" VARCHAR(100),
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestNumber" VARCHAR(30) NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(15,3),
    "unit" VARCHAR(30),
    "estimatedCost" DECIMAL(15,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'NGN',
    "supplierId" TEXT,
    "supplierName" TEXT NOT NULL,
    "requiredByDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "public"."PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseRequestEvent" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromStatus" "public"."PurchaseRequestStatus",
    "toStatus" "public"."PurchaseRequestStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceNumber" VARCHAR(30) NOT NULL,
    "customerName" TEXT NOT NULL,
    "exportOrderId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(15,2) NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "reference" VARCHAR(100),
    "note" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "reference" VARCHAR(100),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceRequirement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "authority" TEXT,
    "description" TEXT,
    "status" "public"."ComplianceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "riskLevel" "public"."ComplianceRiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "completion" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceDocument" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "status" "public"."ComplianceDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "expiryDate" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceHistory" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "previousStatus" "public"."ComplianceStatus",
    "newStatus" "public"."ComplianceStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExportOrder_companyId_idx" ON "public"."ExportOrder"("companyId");

-- CreateIndex
CREATE INDEX "ExportOrder_companyId_status_idx" ON "public"."ExportOrder"("companyId", "status");

-- CreateIndex
CREATE INDEX "ExportOrder_companyId_createdAt_idx" ON "public"."ExportOrder"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "ExportOrder_contactId_idx" ON "public"."ExportOrder"("contactId");

-- CreateIndex
CREATE INDEX "ExportOrder_productId_idx" ON "public"."ExportOrder"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportOrder_companyId_orderNumber_key" ON "public"."ExportOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE INDEX "Shipment_companyId_idx" ON "public"."Shipment"("companyId");

-- CreateIndex
CREATE INDEX "Shipment_companyId_status_idx" ON "public"."Shipment"("companyId", "status");

-- CreateIndex
CREATE INDEX "Shipment_companyId_eta_idx" ON "public"."Shipment"("companyId", "eta");

-- CreateIndex
CREATE INDEX "Shipment_companyId_createdAt_idx" ON "public"."Shipment"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_companyId_shipmentNumber_key" ON "public"."Shipment"("companyId", "shipmentNumber");

-- CreateIndex
CREATE INDEX "ShipmentOrder_exportOrderId_idx" ON "public"."ShipmentOrder"("exportOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentOrder_shipmentId_exportOrderId_key" ON "public"."ShipmentOrder"("shipmentId", "exportOrderId");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_createdAt_idx" ON "public"."ShipmentEvent"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "ShipmentEvent_changedById_idx" ON "public"."ShipmentEvent"("changedById");

-- CreateIndex
CREATE INDEX "Warehouse_companyId_idx" ON "public"."Warehouse"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_companyId_name_key" ON "public"."Warehouse"("companyId", "name");

-- CreateIndex
CREATE INDEX "StockLevel_companyId_idx" ON "public"."StockLevel"("companyId");

-- CreateIndex
CREATE INDEX "StockLevel_companyId_warehouseId_idx" ON "public"."StockLevel"("companyId", "warehouseId");

-- CreateIndex
CREATE INDEX "StockLevel_productId_idx" ON "public"."StockLevel"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockLevel_warehouseId_productId_key" ON "public"."StockLevel"("warehouseId", "productId");

-- CreateIndex
CREATE INDEX "StockMovement_stockLevelId_createdAt_idx" ON "public"."StockMovement"("stockLevelId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_createdAt_idx" ON "public"."StockMovement"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_createdById_idx" ON "public"."StockMovement"("createdById");

-- CreateIndex
CREATE INDEX "PurchaseRequest_companyId_idx" ON "public"."PurchaseRequest"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_companyId_status_idx" ON "public"."PurchaseRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_companyId_createdAt_idx" ON "public"."PurchaseRequest"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequest_supplierId_idx" ON "public"."PurchaseRequest"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_companyId_requestNumber_key" ON "public"."PurchaseRequest"("companyId", "requestNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequestEvent_purchaseRequestId_createdAt_idx" ON "public"."PurchaseRequestEvent"("purchaseRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequestEvent_changedById_idx" ON "public"."PurchaseRequestEvent"("changedById");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "public"."Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_status_idx" ON "public"."Invoice"("companyId", "status");

-- CreateIndex
CREATE INDEX "Invoice_companyId_dueDate_idx" ON "public"."Invoice"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_companyId_issueDate_idx" ON "public"."Invoice"("companyId", "issueDate");

-- CreateIndex
CREATE INDEX "Invoice_exportOrderId_idx" ON "public"."Invoice"("exportOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "public"."Invoice"("companyId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_paidAt_idx" ON "public"."InvoicePayment"("invoiceId", "paidAt");

-- CreateIndex
CREATE INDEX "InvoicePayment_recordedById_idx" ON "public"."InvoicePayment"("recordedById");

-- CreateIndex
CREATE INDEX "Expense_companyId_expenseDate_idx" ON "public"."Expense"("companyId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_companyId_category_idx" ON "public"."Expense"("companyId", "category");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_idx" ON "public"."ComplianceRequirement"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_status_idx" ON "public"."ComplianceRequirement"("companyId", "status");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_assignedToId_idx" ON "public"."ComplianceRequirement"("assignedToId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_dueDate_idx" ON "public"."ComplianceRequirement"("dueDate");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_expiryDate_idx" ON "public"."ComplianceRequirement"("expiryDate");

-- CreateIndex
CREATE INDEX "ComplianceDocument_requirementId_idx" ON "public"."ComplianceDocument"("requirementId");

-- CreateIndex
CREATE INDEX "ComplianceDocument_fileId_idx" ON "public"."ComplianceDocument"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceDocument_requirementId_fileId_key" ON "public"."ComplianceDocument"("requirementId", "fileId");

-- CreateIndex
CREATE INDEX "ComplianceHistory_requirementId_idx" ON "public"."ComplianceHistory"("requirementId");

-- CreateIndex
CREATE INDEX "ComplianceHistory_userId_idx" ON "public"."ComplianceHistory"("userId");

-- CreateIndex
CREATE INDEX "ComplianceHistory_createdAt_idx" ON "public"."ComplianceHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Product_companyId_isActive_idx" ON "public"."Product"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "Product_companyId_name_idx" ON "public"."Product"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_sku_key" ON "public"."Product"("companyId", "sku");

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentOrder" ADD CONSTRAINT "ShipmentOrder_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentOrder" ADD CONSTRAINT "ShipmentOrder_exportOrderId_fkey" FOREIGN KEY ("exportOrderId") REFERENCES "public"."ExportOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Warehouse" ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLevel" ADD CONSTRAINT "StockLevel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLevel" ADD CONSTRAINT "StockLevel_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLevel" ADD CONSTRAINT "StockLevel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_stockLevelId_fkey" FOREIGN KEY ("stockLevelId") REFERENCES "public"."StockLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequestEvent" ADD CONSTRAINT "PurchaseRequestEvent_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "public"."PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequestEvent" ADD CONSTRAINT "PurchaseRequestEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_exportOrderId_fkey" FOREIGN KEY ("exportOrderId") REFERENCES "public"."ExportOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoicePayment" ADD CONSTRAINT "InvoicePayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "public"."ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceHistory" ADD CONSTRAINT "ComplianceHistory_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "public"."ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceHistory" ADD CONSTRAINT "ComplianceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
