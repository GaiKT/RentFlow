-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_PROFILE_UPDATE', 'USER_PASSWORD_CHANGE', 'ROOM_CREATE', 'ROOM_UPDATE', 'ROOM_DELETE', 'ROOM_STATUS_CHANGE', 'CONTRACT_CREATE', 'CONTRACT_UPDATE', 'CONTRACT_DELETE', 'CONTRACT_TERMINATE', 'CONTRACT_RENEW', 'CONTRACT_DOCUMENT_UPLOAD', 'CONTRACT_DOCUMENT_DOWNLOAD', 'CONTRACT_DOCUMENT_DELETE', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE', 'INVOICE_SEND', 'INVOICE_MARK_PAID', 'INVOICE_MARK_OVERDUE', 'INVOICE_PDF_GENERATE', 'INVOICE_PRINT', 'RECEIPT_CREATE', 'RECEIPT_UPDATE', 'RECEIPT_DELETE', 'RECEIPT_PDF_GENERATE', 'RECEIPT_PRINT', 'SYSTEM_BACKUP', 'SYSTEM_RESTORE', 'SYSTEM_MAINTENANCE', 'NOTIFICATION_CREATE', 'NOTIFICATION_READ', 'NOTIFICATION_DELETE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_TERMINATED';
ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE 'ROOM_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'MONTHLY_REPORT';

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
