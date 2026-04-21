from app import create_app
from app.utils.db import execute_query

app = create_app()
with app.app_context():
    # Check for tables
    tables = execute_query("SELECT table_name FROM user_tables")
    print("Tables in DB:", [t['table_name'] for t in tables])
    
    # Check COMPLAINT_IMAGES structure if it exists
    img_table = execute_query("SELECT table_name FROM user_tables WHERE table_name = 'COMPLAINT_IMAGES'")
    if img_table:
        print("\nCOMPLAINT_IMAGES Columns:")
        cols = execute_query("SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'COMPLAINT_IMAGES'")
        for c in cols:
            print(f"  {c['column_name']} ({c['data_type']})")
    else:
        print("\nCOMPLAINT_IMAGES table NOT FOUND!")
