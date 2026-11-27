-- Prisma treats NULLs as distinct, so the pair unique index does not cover event-less certificates.
CREATE UNIQUE INDEX "Certificate_recipientEmail_type_no_event_key"
ON "Certificate" ("recipientEmail", "type") WHERE "eventId" IS NULL;
