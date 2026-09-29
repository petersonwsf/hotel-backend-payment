-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "clientEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "clientName" TEXT NOT NULL DEFAULT '';
