-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EXPORT_MANAGER', 'SALES', 'LOGISTICS', 'DOCUMENTATION', 'CUSTOMER_SUPPORT');

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
    "sku" TEXT,
    "unit" TEXT,
    "price" DECIMAL(15,2),
    "currency" VARCHAR(10),
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
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "public"."ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "public"."ProductCategory"("slug");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "public"."Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "public"."Product"("categoryId");

-- CreateIndex
CREATE INDEX "File_companyId_idx" ON "public"."File"("companyId");

-- CreateIndex
CREATE INDEX "File_uploadedById_idx" ON "public"."File"("uploadedById");

-- CreateIndex
CREATE INDEX "File_productId_idx" ON "public"."File"("productId");

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

-- AddForeignKey
ALTER TABLE "public"."CRMContact" ADD CONSTRAINT "CRMContact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMContact" ADD CONSTRAINT "CRMContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMNote" ADD CONSTRAINT "CRMNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMNote" ADD CONSTRAINT "CRMNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMNote" ADD CONSTRAINT "CRMNote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMStatusHistory" ADD CONSTRAINT "CRMStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMStatusHistory" ADD CONSTRAINT "CRMStatusHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMStatusHistory" ADD CONSTRAINT "CRMStatusHistory_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CRMContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMImportBatch" ADD CONSTRAINT "CRMImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CRMImportBatch" ADD CONSTRAINT "CRMImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierApplication" ADD CONSTRAINT "SupplierApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierApplication" ADD CONSTRAINT "SupplierApplication_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierVerificationHistory" ADD CONSTRAINT "SupplierVerificationHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierVerificationHistory" ADD CONSTRAINT "SupplierVerificationHistory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
