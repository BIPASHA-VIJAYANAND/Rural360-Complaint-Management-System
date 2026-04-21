"""Oracle database connection utility using python-oracledb (thin mode)."""
import oracledb
from flask import current_app


def get_connection():
    """Return a new oracledb connection using app config."""
    cfg = current_app.config
    conn = oracledb.connect(
        user=cfg["DB_USER"],
        password=cfg["DB_PASSWORD"],
        dsn=cfg["DB_DSN"]
    )
    return conn


def execute_query(sql, params=None, fetch=True):
    """
    Execute a parameterized SQL statement.

    Args:
        sql    : SQL string with :param_name placeholders
        params : dict of bind variables
        fetch  : if True returns rows, else commits DML

    Returns:
        list of dicts (SELECT) or None (DML)
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params or {})
        if fetch:
            columns = [col[0].lower() for col in cursor.description]
            rows    = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return rows
        else:
            conn.commit()
            return None
    finally:
        cursor.close()
        conn.close()


def execute_one(sql, params=None):
    """Return first row dict or None."""
    results = execute_query(sql, params, fetch=True)
    return results[0] if results else None
