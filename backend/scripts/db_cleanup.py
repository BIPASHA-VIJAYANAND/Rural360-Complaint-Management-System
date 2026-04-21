import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

def cleanup():
    # Load config from env
    dsn = os.getenv("DB_DSN", "localhost:1521/ORCL")
    user = os.getenv("DB_USER", "system")
    password = os.getenv("DB_PASSWORD", "oracle")

    try:
        conn = oracledb.connect(user=user, password=password, dsn=dsn)
        cursor = conn.cursor()

        print("Cleaning up database (keeping only Admin)...")

        # 1. Feedback
        cursor.execute("DELETE FROM FEEDBACK")
        print(f"Removed {cursor.rowcount} feedback entries.")

        # 2. Status History
        cursor.execute("DELETE FROM STATUS_HISTORY")
        print(f"Removed {cursor.rowcount} history logs.")

        # 3. Assignments
        cursor.execute("DELETE FROM ASSIGNMENTS")
        print(f"Removed {cursor.rowcount} assignments.")

        # 4. Complaints
        cursor.execute("DELETE FROM COMPLAINTS")
        print(f"Removed {cursor.rowcount} complaints.")

        # 5. OTPs
        cursor.execute("DELETE FROM OTP_VERIFICATION")
        print(f"Removed {cursor.rowcount} OTP records.")

        # 6. Users (Except Admin)
        cursor.execute("DELETE FROM USERS WHERE role != 'Admin'")
        print(f"Removed {cursor.rowcount} non-admin users.")

        conn.commit()
        print("Database cleanup successful. Only Admin users remain.")

    except Exception as e:
        print(f"Error during cleanup: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    cleanup()
