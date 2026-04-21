import sys
import os

# Add the project root to the sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import execute_query

sql_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "add_images_table.sql")

def run_migration():
    with open(sql_file, "r") as f:
        sql = f.read()
    
    # Split by / to get distinct blocks
    blocks = sql.split("/")
    
    for block in blocks:
        stmt = block.strip()
        if not stmt:
            continue
        if stmt.startswith("--") and "\nBEGIN" not in stmt:
            continue
        
        # Strip leading comments before executing
        lines = stmt.split("\n")
        clean_lines = [line for line in lines if not line.strip().startswith("--")]
        clean_stmt = "\n".join(clean_lines).strip()
        
        if not clean_stmt or clean_stmt == "COMMIT;":
            continue
        
        try:
            execute_query(clean_stmt, fetch=False)
            print("Executed block successfully.")
        except Exception as e:
            print(f"Error executing block: {e}")
            print(f"Block: \n{clean_stmt}")

    print("Migration complete!")

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        run_migration()

