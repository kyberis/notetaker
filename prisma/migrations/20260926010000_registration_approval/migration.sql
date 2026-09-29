ALTER TABLE "User" ADD COLUMN "registrationApprovedAt" TIMESTAMP(3);

UPDATE "User"
SET "registrationApprovedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "registrationApprovedAt" IS NULL;
