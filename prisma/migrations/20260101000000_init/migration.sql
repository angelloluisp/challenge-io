-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VISA');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('PEN', 'USD');

-- CreateEnum
CREATE TYPE "CardRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'ISSUED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PUBLISHED');

-- CreateTable
CREATE TABLE "card_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "CardRequestStatus" NOT NULL DEFAULT 'PENDING',
    "forceError" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "customerDocument" TEXT NOT NULL,
    "maskedPan" TEXT NOT NULL,
    "expirationDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventSource" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_requests_requestId_key" ON "card_requests"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "card_requests_documentNumber_key" ON "card_requests"("documentNumber");

-- CreateIndex
CREATE INDEX "card_requests_status_idx" ON "card_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cards_requestId_key" ON "cards"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "cards_customerDocument_key" ON "cards"("customerDocument");

-- CreateIndex
CREATE INDEX "outbox_events_status_createdAt_idx" ON "outbox_events"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "processed_events_eventId_eventSource_key" ON "processed_events"("eventId", "eventSource");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "card_requests"("requestId") ON DELETE RESTRICT ON UPDATE CASCADE;
