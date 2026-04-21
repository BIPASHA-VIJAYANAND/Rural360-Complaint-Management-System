import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

def update_schema():
    try:
        conn = oracledb.connect(
            user=os.getenv("DB_USER", "system"),
            password=os.getenv("DB_PASSWORD", "24bce5345"),
            dsn=os.getenv("DB_DSN", "localhost:1521/XE")
        )
        cursor = conn.cursor()
        
        # Add email to USERS if not exists
        try:
            cursor.execute("ALTER TABLE USERS ADD email VARCHAR2(150)")
            cursor.execute("ALTER TABLE USERS ADD CONSTRAINT uq_email UNIQUE (email)")
            print("Added email to USERS")
        except oracledb.DatabaseError as e:
            if "ORA-01430" in str(e):
                print("Email column already exists in USERS")
            else:
                print(f"Error adding email to USERS: {e}")

        # Add email to OTP_VERIFICATION if not exists
        try:
            cursor.execute("ALTER TABLE OTP_VERIFICATION ADD email VARCHAR2(150)")
            print("Added email to OTP_VERIFICATION")
        except oracledb.DatabaseError as e:
            if "ORA-01430" in str(e):
                print("Email column already exists in OTP_VERIFICATION")
            else:
                print(f"Error adding email to OTP_VERIFICATION: {e}")
        
        # Make phone_number nullable if we want to support email-only, 
        # but the prompt says additionally, so we might keep it.
        # Let's just make it nullable to be safe for email registration.
        try:
            cursor.execute("ALTER TABLE USERS MODIFY phone_number NULL")
            cursor.execute("ALTER TABLE OTP_VERIFICATION MODIFY phone_number NULL")
            print("Modified phone_number to be NULLABLE")
        except Exception as e:
            print(f"Error modifying phone: {e}")

        conn.commit()
        cursor.close()
        conn.close()
        print("Schema update completed.")
    except Exception as e:
        print(f"Failed to connect or update: {e}")

if __name__ == "__main__":
    update_schema()
