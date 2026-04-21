ALTER TABLE USERS ADD email VARCHAR2(150);
ALTER TABLE USERS ADD CONSTRAINT uq_email UNIQUE (email);
ALTER TABLE OTP_VERIFICATION ADD email VARCHAR2(150);
-- Modify phone_number to be nullable for email-only login (optional, but good for flexibility)
-- For now, let's keep it required unless specifically told to change it.
EXIT;
