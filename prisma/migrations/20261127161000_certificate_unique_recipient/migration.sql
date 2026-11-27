-- Prevent issuing the same certificate type twice to one recipient in an event.
CREATE UNIQUE INDEX "Certificate_eventId_recipientEmail_type_key" ON "Certificate"("eventId", "recipientEmail", "type");
