-- ============================================================
-- PANCHAYAT GRIEVANCE REDRESSAL SYSTEM
-- Oracle SQL Plus Schema Script
-- ============================================================

-- Drop existing tables (in dependency order)
BEGIN
    FOR t IN (
        SELECT table_name FROM user_tables
        WHERE table_name IN (
            'FEEDBACK','STATUS_HISTORY','ASSIGNMENTS',
            'COMPLAINTS','OTP_VERIFICATION','USERS'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
END;
/

-- Drop existing sequences
BEGIN
    FOR s IN (
        SELECT sequence_name FROM user_sequences
        WHERE sequence_name IN (
            'SEQ_USER_ID','SEQ_OTP_ID','SEQ_COMPLAINT_ID',
            'SEQ_ASSIGNMENT_ID','SEQ_HISTORY_ID','SEQ_FEEDBACK_ID'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
    END LOOP;
END;
/

-- ============================================================
-- SEQUENCES
-- ============================================================

CREATE SEQUENCE SEQ_USER_ID       START WITH 1001 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_OTP_ID        START WITH 1    INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_COMPLAINT_ID  START WITH 5001 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_ASSIGNMENT_ID START WITH 1    INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_HISTORY_ID    START WITH 1    INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_FEEDBACK_ID   START WITH 1    INCREMENT BY 1 NOCACHE NOCYCLE;

-- ============================================================
-- TABLE: USERS
-- ============================================================

CREATE TABLE USERS (
    user_id       NUMBER        PRIMARY KEY,
    full_name     VARCHAR2(150) NOT NULL,
    phone_number  VARCHAR2(10)  NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    role          VARCHAR2(20)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active     NUMBER(1)     DEFAULT 1 NOT NULL,
    CONSTRAINT uq_phone        UNIQUE (phone_number),
    CONSTRAINT chk_role        CHECK (role IN ('Citizen','Clerk','Admin','Staff')),
    CONSTRAINT chk_phone_len   CHECK (REGEXP_LIKE(phone_number, '^[6-9][0-9]{9}$')),
    CONSTRAINT chk_is_active   CHECK (is_active IN (0,1))
);

CREATE INDEX idx_users_phone ON USERS(phone_number);
CREATE INDEX idx_users_role  ON USERS(role);

-- ============================================================
-- TABLE: OTP_VERIFICATION
-- ============================================================

CREATE TABLE OTP_VERIFICATION (
    otp_id       NUMBER        PRIMARY KEY,
    phone_number VARCHAR2(10)  NOT NULL,
    otp_code     VARCHAR2(6)   NOT NULL,
    expires_at   TIMESTAMP     NOT NULL,
    is_used      NUMBER(1)     DEFAULT 0 NOT NULL,
    CONSTRAINT chk_otp_used CHECK (is_used IN (0,1))
);

CREATE INDEX idx_otp_phone ON OTP_VERIFICATION(phone_number);

-- ============================================================
-- TABLE: COMPLAINTS
-- ============================================================

CREATE TABLE COMPLAINTS (
    complaint_id   NUMBER         PRIMARY KEY,
    user_id        NUMBER         NOT NULL,
    category       VARCHAR2(100)  NOT NULL,
    description    VARCHAR2(2000) NOT NULL,
    location_text  VARCHAR2(300)  NOT NULL,
    status         VARCHAR2(30)   DEFAULT 'Submitted' NOT NULL,
    priority       VARCHAR2(10)   DEFAULT 'Normal' NOT NULL,
    created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_complaint_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT chk_status CHECK (status IN (
        'Submitted','Under Review','Pending Approval',
        'Approved','Assigned','In Progress','Completed','Closed'
    )),
    CONSTRAINT chk_priority CHECK (priority IN ('Low','Normal','High','Urgent')),
    CONSTRAINT chk_desc_len CHECK (LENGTH(description) >= 20)
);

CREATE INDEX idx_complaints_user   ON COMPLAINTS(user_id);
CREATE INDEX idx_complaints_status ON COMPLAINTS(status);
CREATE INDEX idx_complaints_cat    ON COMPLAINTS(category);

-- ============================================================
-- TABLE: ASSIGNMENTS
-- ============================================================

CREATE TABLE ASSIGNMENTS (
    assignment_id   NUMBER       PRIMARY KEY,
    complaint_id    NUMBER       NOT NULL,
    staff_id        NUMBER       NOT NULL,
    assigned_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deadline        DATE         NOT NULL,
    progress_status VARCHAR2(30) DEFAULT 'Assigned' NOT NULL,
    CONSTRAINT fk_assign_complaint FOREIGN KEY (complaint_id) REFERENCES COMPLAINTS(complaint_id),
    CONSTRAINT fk_assign_staff     FOREIGN KEY (staff_id)     REFERENCES USERS(user_id),
    CONSTRAINT chk_progress CHECK (progress_status IN ('Assigned','In Progress','Completed'))
);

CREATE INDEX idx_assign_complaint ON ASSIGNMENTS(complaint_id);
CREATE INDEX idx_assign_staff     ON ASSIGNMENTS(staff_id);

-- ============================================================
-- TABLE: STATUS_HISTORY
-- ============================================================

CREATE TABLE STATUS_HISTORY (
    history_id   NUMBER        PRIMARY KEY,
    complaint_id NUMBER        NOT NULL,
    old_status   VARCHAR2(30),
    new_status   VARCHAR2(30)  NOT NULL,
    changed_by   NUMBER        NOT NULL,
    changed_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks      VARCHAR2(500),
    CONSTRAINT fk_hist_complaint FOREIGN KEY (complaint_id) REFERENCES COMPLAINTS(complaint_id),
    CONSTRAINT fk_hist_user      FOREIGN KEY (changed_by)   REFERENCES USERS(user_id)
);

CREATE INDEX idx_hist_complaint ON STATUS_HISTORY(complaint_id);

-- ============================================================
-- TABLE: FEEDBACK
-- ============================================================

CREATE TABLE FEEDBACK (
    feedback_id  NUMBER        PRIMARY KEY,
    complaint_id NUMBER        NOT NULL,
    rating       NUMBER(1)     NOT NULL,
    comments     VARCHAR2(1000),
    submitted_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_feedback_complaint FOREIGN KEY (complaint_id) REFERENCES COMPLAINTS(complaint_id),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_feedback_complaint UNIQUE (complaint_id)
);

-- ============================================================
-- TRIGGER: Auto-update updated_at on COMPLAINTS
-- ============================================================

CREATE OR REPLACE TRIGGER trg_complaint_updated_at
BEFORE UPDATE ON COMPLAINTS
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================
-- VIEW: COMPLAINT_SUMMARY (helper for admin dashboard)
-- ============================================================

CREATE OR REPLACE VIEW COMPLAINT_SUMMARY AS
SELECT
    c.complaint_id,
    c.category,
    c.status,
    c.priority,
    c.created_at,
    c.updated_at,
    u.full_name    AS citizen_name,
    u.phone_number AS citizen_phone,
    c.location_text,
    su.full_name   AS assigned_staff,
    a.deadline
FROM
    COMPLAINTS c
    JOIN USERS u ON c.user_id = u.user_id
    LEFT JOIN ASSIGNMENTS a ON c.complaint_id = a.complaint_id
    LEFT JOIN USERS su ON a.staff_id = su.user_id;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Admin user (password: Admin@123 — pre-hashed placeholder)
INSERT INTO USERS (user_id, full_name, phone_number, password_hash, role)
VALUES (SEQ_USER_ID.NEXTVAL, 'System Administrator', '9000000001',
        'PLACEHOLDER_ADMIN_HASH', 'Admin');

-- Staff user
INSERT INTO USERS (user_id, full_name, phone_number, password_hash, role)
VALUES (SEQ_USER_ID.NEXTVAL, 'Ramesh Kumar', '9000000002',
        'PLACEHOLDER_STAFF_HASH', 'Staff');

-- Clerk user
INSERT INTO USERS (user_id, full_name, phone_number, password_hash, role)
VALUES (SEQ_USER_ID.NEXTVAL, 'Sunita Devi', '9000000003',
        'PLACEHOLDER_CLERK_HASH', 'Clerk');

COMMIT;

-- End of schema.sql
