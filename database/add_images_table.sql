-- ============================================================
-- COMPLAINT_IMAGES TABLE — Store multiple images per complaint
-- Run this migration on your Oracle DB
-- ============================================================

-- Create sequence for image IDs
BEGIN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE SEQ_IMAGE_ID START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN NULL;  -- already exists
        ELSE RAISE;
        END IF;
END;
/

-- Create COMPLAINT_IMAGES table
BEGIN
    EXECUTE IMMEDIATE '
    CREATE TABLE COMPLAINT_IMAGES (
        image_id      NUMBER         PRIMARY KEY,
        complaint_id  NUMBER         NOT NULL,
        file_name     VARCHAR2(255)  NOT NULL,
        original_name VARCHAR2(500)  NOT NULL,
        uploaded_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT fk_image_complaint FOREIGN KEY (complaint_id)
            REFERENCES COMPLAINTS(complaint_id) ON DELETE CASCADE
    )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN NULL;  -- table already exists
        ELSE RAISE;
        END IF;
END;
/

-- Create index for faster lookups
BEGIN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_images_complaint ON COMPLAINT_IMAGES(complaint_id)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN NULL;
        ELSE RAISE;
        END IF;
END;
/

-- Add email column to USERS table if not already present
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE USERS ADD email VARCHAR2(255)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -1430 THEN NULL;  -- column already exists
        ELSE RAISE;
        END IF;
END;
/

-- Add email column to OTP_VERIFICATION table if not already present
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE OTP_VERIFICATION ADD email VARCHAR2(255)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -1430 THEN NULL;  -- column already exists
        ELSE RAISE;
        END IF;
END;
/

COMMIT;

-- ============================================================
-- Verification: run these queries to confirm the migration
-- ============================================================
-- SELECT table_name FROM user_tables WHERE table_name = 'COMPLAINT_IMAGES';
-- SELECT sequence_name FROM user_sequences WHERE sequence_name = 'SEQ_IMAGE_ID';
-- SELECT column_name FROM user_tab_columns WHERE table_name = 'USERS' AND column_name = 'EMAIL';
