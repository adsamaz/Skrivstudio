-- Add email verification fields to User table
-- Existing rows get a placeholder email derived from username; they must verify on first login

ALTER TABLE "User"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationToken" TEXT;

-- Backfill placeholder emails for any existing rows so NOT NULL can be enforced
UPDATE "User" SET "email" = username || '@placeholder.invalid' WHERE "email" IS NULL;

-- Now enforce NOT NULL and unique
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
