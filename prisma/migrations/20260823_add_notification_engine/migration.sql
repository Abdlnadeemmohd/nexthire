-- AlterTable Notification with rich categorization, priority, CTA, deduplication and delivery tracking
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS "ctaText" TEXT,
ADD COLUMN IF NOT EXISTS "ctaUrl" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" TEXT,
ADD COLUMN IF NOT EXISTS "dedupKey" TEXT,
ADD COLUMN IF NOT EXISTS "emailStatus" TEXT NOT NULL DEFAULT 'NOT_QUEUED',
ADD COLUMN IF NOT EXISTS "emailError" TEXT,
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);

-- CreateTable NotificationPreference
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "digestFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_dedupKey_idx" ON "Notification"("dedupKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey NotificationPreference -> User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'NotificationPreference_userId_fkey'
    ) THEN
        ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
