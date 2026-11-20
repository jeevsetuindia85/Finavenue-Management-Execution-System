"""Safe migration script to add Admin/Employee fields without losing any data."""
import sqlite3
import os

def run_migration(db_path: str):
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}, skipping migration.")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def add_col_if_missing(table, col, col_type):
        cursor.execute(f"PRAGMA table_info({table})")
        cols = [row[1] for row in cursor.fetchall()]
        if col not in cols:
            print(f"Adding {col} to {table}...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            conn.commit()
        else:
            print(f"{col} already exists in {table}.")

    # 1. Enhance users table
    add_col_if_missing('users', 'employee_id', "VARCHAR(50)")
    add_col_if_missing('users', 'username', "VARCHAR(100)")
    add_col_if_missing('users', 'department', "VARCHAR(100)")
    add_col_if_missing('users', 'designation', "VARCHAR(100)")
    add_col_if_missing('users', 'job_title', "VARCHAR(100)")
    add_col_if_missing('users', 'status', "VARCHAR(30) DEFAULT 'active'")
    add_col_if_missing('users', 'permissions_json', "TEXT")
    add_col_if_missing('users', 'failed_login_attempts', "INTEGER DEFAULT 0")
    add_col_if_missing('users', 'locked_until', "DATETIME")
    add_col_if_missing('users', 'must_change_password', "BOOLEAN DEFAULT 0")

    # 2. Enhance activities (tasks) table
    add_col_if_missing('activities', 'admin_feedback', "TEXT")
    add_col_if_missing('activities', 'submission_notes', "TEXT")
    add_col_if_missing('activities', 'submitted_at', "DATETIME")
    add_col_if_missing('activities', 'approved_at', "DATETIME")
    add_col_if_missing('activities', 'approved_by', "VARCHAR(36)")

    # 3. Create task_attachments table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS task_attachments (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        created_at DATETIME,
        FOREIGN KEY (task_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
    """)

    # 4. Create login_sessions table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS login_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        ip_address VARCHAR(50),
        user_agent VARCHAR(255),
        login_at DATETIME,
        logout_at DATETIME,
        status VARCHAR(30) DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # 5. Populate employee IDs and designations ONLY if they are not yet set
    defaults = [
        ("admin@mes.local", "FA-ADM-001", "admin", "Management", "Platform Super Admin"),
        ("ceo@mes.local", "FA-EXEC-001", "rajesh.mehta", "Executive", "Chief Executive Officer"),
        ("hr@mes.local", "FA-HR-001", "priya.hr", "Human Resources", "Head of Talent Acquisition"),
        ("bd@mes.local", "FA-BD-001", "amit.bd", "Business Development", "Head of Geographic Expansion"),
        ("product@mes.local", "FA-PRD-001", "sneha.product", "Product Management", "Head of PMS & AIF Products"),
        ("maitwayi@mes.local", "FA-COORD-001", "maitwayi.desai", "Operations", "Execution Coordinator"),
        ("analyst1@mes.local", "FA-EMP-001", "vikram.analyst", "Finance", "Financial Analyst"),
        ("recruiter@mes.local", "FA-EMP-002", "ananya.recruiter", "Human Resources", "Talent Acquisition Specialist"),
    ]
    for email, emp_id, uname, dept, desig in defaults:
        cursor.execute("""
            UPDATE users 
            SET employee_id = COALESCE(NULLIF(employee_id, ''), ?),
                username = COALESCE(NULLIF(username, ''), ?),
                department = COALESCE(NULLIF(department, ''), ?),
                designation = COALESCE(NULLIF(designation, ''), ?),
                job_title = COALESCE(NULLIF(job_title, ''), ?)
            WHERE email = ? AND (employee_id IS NULL OR employee_id = '' OR designation IS NULL OR designation = '')
        """, (emp_id, uname, dept, desig, desig, email))

    conn.commit()
    conn.close()
    print("Migration finished successfully!")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(current_dir, "..", "mes.db")
    run_migration(db_file)
