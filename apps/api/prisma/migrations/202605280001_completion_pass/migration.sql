-- Order lifecycle and payment state support
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded');

ALTER TABLE "Order"
  ADD COLUMN "deliveryStage" TEXT NOT NULL DEFAULT 'Confirmed',
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN "paymentReference" TEXT,
  ADD COLUMN "paymentFailureReason" TEXT,
  ADD COLUMN "trackingTimeline" JSONB;

-- Prescription OCR and validation support
ALTER TABLE "Prescription"
  ADD COLUMN "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "ocrProvider" TEXT,
  ADD COLUMN "dosageSummary" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "validationIssues" TEXT[] DEFAULT ARRAY[]::TEXT[];
