-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EXPORT_MANAGER', 'SALES', 'LOGISTICS', 'DOCUMENTATION', 'CUSTOMER_SUPPORT', 'FINANCE', 'PROCUREMENT', 'WAREHOUSE', 'VIEWER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."UserApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."FaceStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."UserTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'INVITE');

-- CreateEnum
CREATE TYPE "public"."AccessLevel" AS ENUM ('NONE', 'VIEW', 'EDIT', 'FULL');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TicketCategory" AS ENUM ('GENERAL', 'ORDER', 'SHIPMENT', 'DOCUMENT', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "public"."TicketMessageKind" AS ENUM ('REPLY', 'NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."KnowledgeArticleType" AS ENUM ('ARTICLE', 'FAQ', 'GUIDE', 'TUTORIAL');

-- CreateEnum
CREATE TYPE "public"."KnowledgeArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."KnowledgeAudience" AS ENUM ('INTERNAL', 'ALL');

-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('DIRECT', 'GROUP', 'COMPANY');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."CRMContactSource" AS ENUM ('WHATSAPP', 'EMAIL', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "public"."CRMContactStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."CRMNoteType" AS ENUM ('GENERAL', 'FOLLOW_UP', 'CALL', 'MEETING', 'INTERNAL');

-- CreateEnum
CREATE TYPE "public"."ConversationChannel" AS ENUM ('INTERNAL', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MessageSenderType" AS ENUM ('USER', 'CONTACT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."SupplierBusinessType" AS ENUM ('FARMER', 'COOPERATIVE', 'AGGREGATOR', 'PROCESSOR', 'MANUFACTURER', 'EXPORTER', 'WHOLESALER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BusinessRegistrationStatus" AS ENUM ('REGISTERED', 'NOT_REGISTERED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "public"."SupplierStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'MORE_INFO_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."SupplierProductForm" AS ENUM ('FRESH', 'DRIED', 'RAW', 'PROCESSED', 'FROZEN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExportOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('BOOKED', 'LOADING', 'AT_SEA', 'CUSTOMS', 'ARRIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."QaInspectionStatus" AS ENUM ('DRAFT', 'PASSED', 'FAILED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "public"."PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ComplianceType" AS ENUM ('CERTIFICATE', 'REGULATION', 'PERMIT', 'STANDARD', 'COMPLIANCE_BODY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('PROCUREMENT', 'LOGISTICS', 'SALARIES', 'UTILITIES', 'TAXES_DUTIES', 'MARKETING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ComplianceStatus" AS ENUM ('NOT_STARTED', 'DOCUMENTATION_PENDING', 'IN_REVIEW', 'COMPLIANT', 'ACTION_REQUIRED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ComplianceEventType" AS ENUM ('CREATED', 'DETAILS_UPDATED', 'STATUS_CHANGED', 'OFFICER_CHANGED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'DOCUMENT_DELETED');

-- CreateEnum
CREATE TYPE "public"."ComplianceRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ComplianceDocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ComplianceDocumentKind" AS ENUM ('REFERENCE', 'SUPPORTING');

-- CreateTable
CREATE TABLE "public"."CRMContact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" "public"."CRMContactSource" NOT NULL DEFAULT 'MANUAL',
    "status" "public"."CRMContactStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CRMNote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "public"."CRMNoteType" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CRMStatusHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromStatus" "public"."CRMContactStatus",
    "toStatus" "public"."CRMContactStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CRMStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" VARCHAR(40),
    "organization" VARCHAR(191),
    "emailVerifiedAt" TIMESTAMP(3),
    "approvalStatus" "public"."UserApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "requestedRole" "public"."UserRole",
    "customerId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" VARCHAR(255),
    "faceStatus" "public"."FaceStatus" NOT NULL DEFAULT 'NONE',
    "faceImagePath" VARCHAR(255),
    "faceEnrolledAt" TIMESTAMP(3),
    "faceReviewedAt" TIMESTAMP(3),
    "faceReviewedById" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" VARCHAR(50),
    "unit" VARCHAR(30) DEFAULT 'ton',
    "price" DECIMAL(15,2),
    "priceUpdatedAt" TIMESTAMP(3),
    "currency" VARCHAR(10) DEFAULT 'USD',
    "stockQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "minimumOrderQuantity" DECIMAL(15,3),
    "hsCode" VARCHAR(20),
    "originCountry" VARCHAR(100) DEFAULT 'Nigeria',
    "packaging" TEXT,
    "specifications" TEXT,
    "isNewListing" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."File" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "uploadedById" TEXT,
    "productId" TEXT,
    "customerId" TEXT,
    "exportOrderId" TEXT,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "type" "public"."ConversationType" NOT NULL DEFAULT 'DIRECT',
    "channel" "public"."ConversationChannel" NOT NULL DEFAULT 'INTERNAL',
    "title" TEXT,
    "externalThreadKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "direction" "public"."MessageDirection" NOT NULL DEFAULT 'OUTBOUND',
    "senderType" "public"."MessageSenderType" NOT NULL DEFAULT 'USER',
    "externalKey" TEXT,
    "content" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(40),
    "link" VARCHAR(255),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CRMImportBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "importedById" TEXT,
    "source" "public"."CRMContactSource" NOT NULL,
    "fileName" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CRMImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradingName" TEXT,
    "businessType" "public"."SupplierBusinessType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "establishedDate" TIMESTAMP(3),
    "registrationStatus" "public"."BusinessRegistrationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "registrationNumber" TEXT,
    "registrationCountry" TEXT,
    "taxIdentificationNumber" TEXT,
    "registrationAuthority" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternativePhone" TEXT,
    "website" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactJobTitle" TEXT,
    "country" TEXT NOT NULL,
    "stateOrRegion" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "warehouseAddress" TEXT,
    "hasExportedBefore" BOOLEAN,
    "exportExperienceYears" INTEGER,
    "previousExportCountries" TEXT,
    "exportDestinations" TEXT,
    "logisticsCapabilities" TEXT,
    "leadTimeDays" INTEGER,
    "qualityControlDescription" TEXT,
    "traceabilityAvailable" BOOLEAN,
    "preferredPaymentTerms" TEXT,
    "quotationCurrency" VARCHAR(10),
    "tradeReferences" TEXT,
    "status" "public"."SupplierStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verificationNotes" TEXT,
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierApplication" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "privacyNoticeAccepted" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "SupplierApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variety" TEXT,
    "description" TEXT,
    "productForm" "public"."SupplierProductForm" NOT NULL DEFAULT 'OTHER',
    "supplyCapacity" DECIMAL(15,3),
    "capacityUnit" TEXT,
    "minimumOrder" DECIMAL(15,3),
    "harvestSeasons" TEXT,
    "packagingOptions" TEXT,
    "indicativePrice" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierDocument" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "documentNumber" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierVerificationHistory" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "changedById" TEXT,
    "previousStatus" "public"."SupplierStatus",
    "newStatus" "public"."SupplierStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierVerificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExportOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderNumber" VARCHAR(30) NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactId" TEXT,
    "customerId" TEXT,
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
CREATE TABLE "public"."ComplianceRequiredDocument" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceRequiredDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceRequirement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."ComplianceType" NOT NULL DEFAULT 'CERTIFICATE',
    "region" TEXT NOT NULL,
    "authority" TEXT,
    "description" TEXT,
    "status" "public"."ComplianceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "riskLevel" "public"."ComplianceRiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "completion" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "assignedDepartment" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "outstandingActions" TEXT,
    "destinationMarkets" TEXT,
    "referenceNumber" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceDocument" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "requiredDocumentId" TEXT,
    "fileId" TEXT,
    "title" TEXT,
    "kind" "public"."ComplianceDocumentKind" NOT NULL DEFAULT 'SUPPORTING',
    "originalName" TEXT,
    "storedName" TEXT,
    "path" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "documentNumber" VARCHAR(100),
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "public"."ComplianceDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "public"."DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceEvent" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "public"."ComplianceEventType" NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceEvent_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "name" TEXT NOT NULL,
    "email" VARCHAR(191),
    "phone" VARCHAR(40),
    "country" VARCHAR(100),
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."UserTokenType" NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "module" VARCHAR(40) NOT NULL,
    "access" "public"."AccessLevel" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportTicket" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ticketNumber" VARCHAR(30) NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "public"."TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdById" TEXT,
    "assignedToId" TEXT,
    "customerId" TEXT,
    "exportOrderId" TEXT,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "kind" "public"."TicketMessageKind" NOT NULL DEFAULT 'REPLY',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "authorId" TEXT,
    "title" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "type" "public"."KnowledgeArticleType" NOT NULL DEFAULT 'ARTICLE',
    "status" "public"."KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "public"."KnowledgeAudience" NOT NULL DEFAULT 'ALL',
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "tags" VARCHAR(500),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileBlob" (
    "fileId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileBlob_pkey" PRIMARY KEY ("fileId")
);

-- CreateTable
CREATE TABLE "public"."FaceImage" (
    "userId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaceImage_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."QaTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "commodity" VARCHAR(100) NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "parameters" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QaInspection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inspectionNumber" VARCHAR(30) NOT NULL,
    "templateId" TEXT,
    "templateName" VARCHAR(150) NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "commodity" VARCHAR(100) NOT NULL,
    "purchaseRequestId" TEXT,
    "shipmentId" TEXT,
    "supplierId" TEXT,
    "cropYear" VARCHAR(20),
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "containerNumber" VARCHAR(40),
    "parameters" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "results" JSONB,
    "generalComment" TEXT,
    "inspectorName" VARCHAR(150),
    "signedAt" TIMESTAMP(3),
    "status" "public"."QaInspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "failureSummary" TEXT,
    "submittedAt" TIMESTAMP(3),
    "overriddenById" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "overrideReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CRMContact_companyId_idx" ON "public"."CRMContact"("companyId");

-- CreateIndex
CREATE INDEX "CRMContact_companyId_status_idx" ON "public"."CRMContact"("companyId", "status");

-- CreateIndex
CREATE INDEX "CRMContact_companyId_source_idx" ON "public"."CRMContact"("companyId", "source");

-- CreateIndex
CREATE INDEX "CRMContact_companyId_assignedToId_idx" ON "public"."CRMContact"("companyId", "assignedToId");

-- CreateIndex
CREATE INDEX "CRMContact_companyId_phone_idx" ON "public"."CRMContact"("companyId", "phone");

-- CreateIndex
CREATE INDEX "CRMContact_companyId_email_idx" ON "public"."CRMContact"("companyId", "email");

-- CreateIndex
CREATE INDEX "CRMContact_companyId_updatedAt_idx" ON "public"."CRMContact"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "CRMNote_companyId_idx" ON "public"."CRMNote"("companyId");

-- CreateIndex
CREATE INDEX "CRMNote_contactId_idx" ON "public"."CRMNote"("contactId");

-- CreateIndex
CREATE INDEX "CRMNote_authorId_idx" ON "public"."CRMNote"("authorId");

-- CreateIndex
CREATE INDEX "CRMNote_createdAt_idx" ON "public"."CRMNote"("createdAt");

-- CreateIndex
CREATE INDEX "CRMStatusHistory_companyId_idx" ON "public"."CRMStatusHistory"("companyId");

-- CreateIndex
CREATE INDEX "CRMStatusHistory_contactId_idx" ON "public"."CRMStatusHistory"("contactId");

-- CreateIndex
CREATE INDEX "CRMStatusHistory_changedById_idx" ON "public"."CRMStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "CRMStatusHistory_createdAt_idx" ON "public"."CRMStatusHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "public"."Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "public"."User"("companyId");

-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "public"."User"("customerId");

-- CreateIndex
CREATE INDEX "User_faceReviewedById_idx" ON "public"."User"("faceReviewedById");

-- CreateIndex
CREATE INDEX "User_companyId_approvalStatus_idx" ON "public"."User"("companyId", "approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "public"."ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "public"."ProductCategory"("slug");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "public"."Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "public"."Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_companyId_isActive_idx" ON "public"."Product"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "Product_companyId_name_idx" ON "public"."Product"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_sku_key" ON "public"."Product"("companyId", "sku");

-- CreateIndex
CREATE INDEX "File_companyId_idx" ON "public"."File"("companyId");

-- CreateIndex
CREATE INDEX "File_uploadedById_idx" ON "public"."File"("uploadedById");

-- CreateIndex
CREATE INDEX "File_productId_idx" ON "public"."File"("productId");

-- CreateIndex
CREATE INDEX "File_customerId_idx" ON "public"."File"("customerId");

-- CreateIndex
CREATE INDEX "File_exportOrderId_idx" ON "public"."File"("exportOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_externalThreadKey_key" ON "public"."Conversation"("externalThreadKey");

-- CreateIndex
CREATE INDEX "Conversation_companyId_idx" ON "public"."Conversation"("companyId");

-- CreateIndex
CREATE INDEX "Conversation_contactId_idx" ON "public"."Conversation"("contactId");

-- CreateIndex
CREATE INDEX "Conversation_companyId_channel_idx" ON "public"."Conversation"("companyId", "channel");

-- CreateIndex
CREATE INDEX "Conversation_companyId_updatedAt_idx" ON "public"."Conversation"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationMember_userId_idx" ON "public"."ConversationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "public"."ConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalKey_key" ON "public"."Message"("externalKey");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "public"."Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "public"."Message"("createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_fileId_idx" ON "public"."MessageAttachment"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageAttachment_messageId_fileId_key" ON "public"."MessageAttachment"("messageId", "fileId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "public"."Notification"("companyId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "public"."Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "CRMImportBatch_companyId_idx" ON "public"."CRMImportBatch"("companyId");

-- CreateIndex
CREATE INDEX "CRMImportBatch_createdAt_idx" ON "public"."CRMImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "public"."AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "public"."Supplier"("companyId");

-- CreateIndex
CREATE INDEX "Supplier_companyId_status_idx" ON "public"."Supplier"("companyId", "status");

-- CreateIndex
CREATE INDEX "Supplier_companyId_country_city_idx" ON "public"."Supplier"("companyId", "country", "city");

-- CreateIndex
CREATE INDEX "Supplier_companyId_updatedAt_idx" ON "public"."Supplier"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "Supplier_email_idx" ON "public"."Supplier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierApplication_supplierId_key" ON "public"."SupplierApplication"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierApplication_submittedAt_idx" ON "public"."SupplierApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "SupplierApplication_reviewedById_idx" ON "public"."SupplierApplication"("reviewedById");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_idx" ON "public"."SupplierProduct"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_isActive_idx" ON "public"."SupplierProduct"("supplierId", "isActive");

-- CreateIndex
CREATE INDEX "SupplierProduct_category_idx" ON "public"."SupplierProduct"("category");

-- CreateIndex
CREATE INDEX "SupplierDocument_supplierId_idx" ON "public"."SupplierDocument"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierDocument_documentType_idx" ON "public"."SupplierDocument"("documentType");

-- CreateIndex
CREATE INDEX "SupplierVerificationHistory_supplierId_createdAt_idx" ON "public"."SupplierVerificationHistory"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierVerificationHistory_changedById_idx" ON "public"."SupplierVerificationHistory"("changedById");

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
CREATE INDEX "ExportOrder_customerId_idx" ON "public"."ExportOrder"("customerId");

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
CREATE INDEX "ComplianceRequiredDocument_requirementId_idx" ON "public"."ComplianceRequiredDocument"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRequiredDocument_requirementId_name_key" ON "public"."ComplianceRequiredDocument"("requirementId", "name");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_idx" ON "public"."ComplianceRequirement"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_status_idx" ON "public"."ComplianceRequirement"("companyId", "status");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_region_idx" ON "public"."ComplianceRequirement"("companyId", "region");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_authority_idx" ON "public"."ComplianceRequirement"("companyId", "authority");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_companyId_expiryDate_idx" ON "public"."ComplianceRequirement"("companyId", "expiryDate");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_assignedToId_idx" ON "public"."ComplianceRequirement"("assignedToId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_dueDate_idx" ON "public"."ComplianceRequirement"("dueDate");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_expiryDate_idx" ON "public"."ComplianceRequirement"("expiryDate");

-- CreateIndex
CREATE INDEX "ComplianceDocument_requirementId_idx" ON "public"."ComplianceDocument"("requirementId");

-- CreateIndex
CREATE INDEX "ComplianceDocument_requirementId_kind_idx" ON "public"."ComplianceDocument"("requirementId", "kind");

-- CreateIndex
CREATE INDEX "ComplianceDocument_requiredDocumentId_idx" ON "public"."ComplianceDocument"("requiredDocumentId");

-- CreateIndex
CREATE INDEX "ComplianceDocument_fileId_idx" ON "public"."ComplianceDocument"("fileId");

-- CreateIndex
CREATE INDEX "ComplianceDocument_expiresAt_idx" ON "public"."ComplianceDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "ComplianceDocument_uploadedById_idx" ON "public"."ComplianceDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ComplianceDocument_verifiedById_idx" ON "public"."ComplianceDocument"("verifiedById");

-- CreateIndex
CREATE INDEX "ComplianceEvent_requirementId_createdAt_idx" ON "public"."ComplianceEvent"("requirementId", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceEvent_actorId_idx" ON "public"."ComplianceEvent"("actorId");

-- CreateIndex
CREATE INDEX "ComplianceHistory_requirementId_idx" ON "public"."ComplianceHistory"("requirementId");

-- CreateIndex
CREATE INDEX "ComplianceHistory_userId_idx" ON "public"."ComplianceHistory"("userId");

-- CreateIndex
CREATE INDEX "ComplianceHistory_createdAt_idx" ON "public"."ComplianceHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "public"."Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_companyId_name_idx" ON "public"."Customer"("companyId", "name");

-- CreateIndex
CREATE INDEX "Customer_contactId_idx" ON "public"."Customer"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_tokenHash_key" ON "public"."UserToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_idx" ON "public"."UserToken"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_companyId_role_module_key" ON "public"."RolePermission"("companyId", "role", "module");

-- CreateIndex
CREATE INDEX "SupportTicket_companyId_status_idx" ON "public"."SupportTicket"("companyId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_companyId_createdAt_idx" ON "public"."SupportTicket"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_createdById_idx" ON "public"."SupportTicket"("createdById");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "public"."SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicket_customerId_idx" ON "public"."SupportTicket"("customerId");

-- CreateIndex
CREATE INDEX "SupportTicket_exportOrderId_idx" ON "public"."SupportTicket"("exportOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_companyId_ticketNumber_key" ON "public"."SupportTicket"("companyId", "ticketNumber");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "public"."TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_authorId_idx" ON "public"."TicketMessage"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_companyId_slug_key" ON "public"."KnowledgeCategory"("companyId", "slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_companyId_status_idx" ON "public"."KnowledgeArticle"("companyId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_categoryId_idx" ON "public"."KnowledgeArticle"("categoryId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_authorId_idx" ON "public"."KnowledgeArticle"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_companyId_slug_key" ON "public"."KnowledgeArticle"("companyId", "slug");

-- CreateIndex
CREATE INDEX "QaTemplate_companyId_isActive_idx" ON "public"."QaTemplate"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "QaTemplate_companyId_name_key" ON "public"."QaTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "QaInspection_companyId_status_idx" ON "public"."QaInspection"("companyId", "status");

-- CreateIndex
CREATE INDEX "QaInspection_companyId_createdAt_idx" ON "public"."QaInspection"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "QaInspection_purchaseRequestId_idx" ON "public"."QaInspection"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "QaInspection_shipmentId_idx" ON "public"."QaInspection"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "QaInspection_companyId_inspectionNumber_key" ON "public"."QaInspection"("companyId", "inspectionNumber");

-- AddForeignKey
ALTER TABLE "public"."CRMContact" ADD CONSTRAINT "CRMContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMContact" ADD CONSTRAINT "CRMContact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMNote" ADD CONSTRAINT "CRMNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMNote" ADD CONSTRAINT "CRMNote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMNote" ADD CONSTRAINT "CRMNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMStatusHistory" ADD CONSTRAINT "CRMStatusHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMStatusHistory" ADD CONSTRAINT "CRMStatusHistory_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMStatusHistory" ADD CONSTRAINT "CRMStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_faceReviewedById_fkey" FOREIGN KEY ("faceReviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_exportOrderId_fkey" FOREIGN KEY ("exportOrderId") REFERENCES "public"."ExportOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMImportBatch" ADD CONSTRAINT "CRMImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMImportBatch" ADD CONSTRAINT "CRMImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierApplication" ADD CONSTRAINT "SupplierApplication_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierApplication" ADD CONSTRAINT "SupplierApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierVerificationHistory" ADD CONSTRAINT "SupplierVerificationHistory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierVerificationHistory" ADD CONSTRAINT "SupplierVerificationHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExportOrder" ADD CONSTRAINT "ExportOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "public"."ComplianceRequiredDocument" ADD CONSTRAINT "ComplianceRequiredDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "public"."ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "public"."ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_requiredDocumentId_fkey" FOREIGN KEY ("requiredDocumentId") REFERENCES "public"."ComplianceRequiredDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceEvent" ADD CONSTRAINT "ComplianceEvent_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "public"."ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceEvent" ADD CONSTRAINT "ComplianceEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceHistory" ADD CONSTRAINT "ComplianceHistory_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "public"."ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceHistory" ADD CONSTRAINT "ComplianceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_exportOrderId_fkey" FOREIGN KEY ("exportOrderId") REFERENCES "public"."ExportOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketMessage" ADD CONSTRAINT "TicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeCategory" ADD CONSTRAINT "KnowledgeCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."KnowledgeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileBlob" ADD CONSTRAINT "FileBlob_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FaceImage" ADD CONSTRAINT "FaceImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaTemplate" ADD CONSTRAINT "QaTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaTemplate" ADD CONSTRAINT "QaTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaTemplate" ADD CONSTRAINT "QaTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."QaTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "public"."PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QaInspection" ADD CONSTRAINT "QaInspection_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

