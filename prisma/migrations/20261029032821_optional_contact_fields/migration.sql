-- AlterTable
ALTER TABLE "ContactMessage" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuoteRequest" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;
