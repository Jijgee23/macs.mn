-- CreateTable
CREATE TABLE "ContractRequest" (
    "id" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "approverLastName" TEXT NOT NULL,
    "approverFirstName" TEXT NOT NULL,
    "approverPosition" TEXT NOT NULL,
    "repLastName" TEXT NOT NULL,
    "repFirstName" TEXT NOT NULL,
    "repPosition" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "products" TEXT[],
    "userCount" INTEGER NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "note" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'mn',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractRequest_status_createdAt_idx" ON "ContractRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContractRequest_ip_createdAt_idx" ON "ContractRequest"("ip", "createdAt");
