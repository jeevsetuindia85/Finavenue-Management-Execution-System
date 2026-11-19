"""Automated Test Suite for Admin Control, RBAC, and Employee Data Isolation."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_rbac_tests():
    print("==================================================")
    print("   ExecFlow Admin RBAC & Data Isolation Test Suite")
    print("==================================================")

    # 1. Admin Login
    print("\n[1/8] Testing Admin Login...")
    r = client.post("/api/v1/auth/login-json", json={"email": "admin@mes.local", "password": "admin123"})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    admin_token = r.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  ✓ Admin logged in successfully with JWT token.")

    # 2. Admin creates Employee A and Employee B
    print("\n[2/8] Testing Admin Employee Account Creation...")
    emp_a_data = {
        "email": "employee.a@mes.local",
        "full_name": "Employee Alpha",
        "password": "Password123!",
        "employee_id": "FA-TEST-001",
        "username": "emp.alpha",
        "department": "Finance",
        "designation": "Financial Analyst",
        "role": "team_member"
    }
    # Clean if exists or create
    r_a = client.post("/api/v1/users/", json=emp_a_data, headers=admin_headers)
    if r_a.status_code == 400 and "already exists" in r_a.text:
        # User already created from previous run, let's login
        print("  ✓ Employee A already exists, proceeding.")
    else:
        assert r_a.status_code == 201, f"Failed to create Employee A: {r_a.text}"
        print(f"  ✓ Created Employee A: {r_a.json()['full_name']} ({r_a.json()['employee_id']})")

    emp_b_data = {
        "email": "employee.b@mes.local",
        "full_name": "Employee Beta",
        "password": "Password123!",
        "employee_id": "FA-TEST-002",
        "username": "emp.beta",
        "department": "Sales",
        "designation": "Sales Executive",
        "role": "team_member"
    }
    r_b = client.post("/api/v1/users/", json=emp_b_data, headers=admin_headers)
    if r_b.status_code == 400 and "already exists" in r_b.text:
        print("  ✓ Employee B already exists, proceeding.")
    else:
        assert r_b.status_code == 201, f"Failed to create Employee B: {r_b.text}"
        print(f"  ✓ Created Employee B: {r_b.json()['full_name']} ({r_b.json()['employee_id']})")

    # 3. Employee Logins (via Email and Employee ID)
    print("\n[3/8] Testing Employee Logins (Email & Employee ID)...")
    r = client.post("/api/v1/auth/login-json", json={"email": "employee.a@mes.local", "password": "Password123!"})
    assert r.status_code == 200, f"Employee A email login failed: {r.text}"
    emp_a_token = r.json()["access_token"]
    emp_a_headers = {"Authorization": f"Bearer {emp_a_token}"}
    print("  ✓ Employee A logged in via Email.")

    # Login by Employee ID
    r = client.post("/api/v1/auth/login-json", json={"email": "FA-TEST-002", "password": "Password123!"})
    assert r.status_code == 200, f"Employee B Employee ID login failed: {r.text}"
    emp_b_token = r.json()["access_token"]
    emp_b_headers = {"Authorization": f"Bearer {emp_b_token}"}
    print("  ✓ Employee B logged in via Employee ID (FA-TEST-002).")

    # Get their user IDs
    me_a = client.get("/api/v1/auth/me", headers=emp_a_headers).json()
    me_b = client.get("/api/v1/auth/me", headers=emp_b_headers).json()
    emp_a_id = me_a["id"]
    emp_b_id = me_b["id"]

    # 4. Non-Admin Registration & Privilege Escalation Blocked
    print("\n[4/8] Testing Blocked Privilege Escalation & Admin Endpoints...")
    # Employee cannot view all users
    r = client.get("/api/v1/users/", headers=emp_a_headers)
    assert r.status_code == 403, f"Security Violation! Employee was able to list all users: {r.status_code}"
    print("  ✓ Employee listing all users correctly blocked (HTTP 403).")

    # Employee cannot create new user accounts
    r = client.post("/api/v1/users/", json={"email": "hacker@test.com", "full_name": "Hacker", "password": "password123"}, headers=emp_a_headers)
    assert r.status_code == 403, f"Security Violation! Employee was able to create accounts: {r.status_code}"
    print("  ✓ Employee user creation correctly blocked (HTTP 403).")

    # Employee cannot access Audit Logs
    r = client.get("/api/v1/audit/", headers=emp_a_headers)
    assert r.status_code == 403, f"Security Violation! Employee accessed audit logs: {r.status_code}"
    print("  ✓ Employee audit log access correctly blocked (HTTP 403).")

    # 5. Admin Assigns Tasks to Employee A and Employee B
    print("\n[5/8] Testing Task Assignment...")
    task_a = client.post("/api/v1/activities/", json={
        "name": "Confidential Task for Alpha",
        "description": "Financial audit strictly for Alpha eyes only",
        "assigned_to": emp_a_id,
        "priority": "high",
        "due_date": "2026-12-01"
    }, headers=admin_headers).json()
    task_a_id = task_a["id"]
    print(f"  ✓ Admin assigned Task A ({task_a_id}) to Employee A.")

    task_b = client.post("/api/v1/activities/", json={
        "name": "Secret Task for Beta",
        "description": "Sales pipeline strictly for Beta eyes only",
        "assigned_to": emp_b_id,
        "priority": "medium",
        "due_date": "2026-12-05"
    }, headers=admin_headers).json()
    task_b_id = task_b["id"]
    print(f"  ✓ Admin assigned Task B ({task_b_id}) to Employee B.")

    # 6. Strict Data Isolation: A cannot see B, B cannot see A
    print("\n[6/8] Testing Strict Cross-Employee Data Isolation...")
    # Employee A lists tasks
    list_a = client.get("/api/v1/activities/", headers=emp_a_headers).json()
    a_task_ids = [t["id"] for t in list_a]
    assert task_a_id in a_task_ids, "Employee A should see their own task."
    assert task_b_id not in a_task_ids, "Security Violation! Employee A can see Employee B's task in task list!"
    print("  ✓ Employee A task list contains only Employee A tasks.")

    # Employee B lists tasks
    list_b = client.get("/api/v1/activities/", headers=emp_b_headers).json()
    b_task_ids = [t["id"] for t in list_b]
    assert task_b_id in b_task_ids, "Employee B should see their own task."
    assert task_a_id not in b_task_ids, "Security Violation! Employee B can see Employee A's task in task list!"
    print("  ✓ Employee B task list contains only Employee B tasks.")

    # Employee A tries direct access to Employee B's task by ID
    r = client.get(f"/api/v1/activities/{task_b_id}", headers=emp_a_headers)
    assert r.status_code == 403, f"Security Violation! Employee A accessed Task B directly: {r.status_code}"
    print("  ✓ Employee A direct access to Task B blocked (HTTP 403).")

    # Employee B tries direct access to Employee A's task by ID
    r = client.get(f"/api/v1/activities/{task_a_id}", headers=emp_b_headers)
    assert r.status_code == 403, f"Security Violation! Employee B accessed Task A directly: {r.status_code}"
    print("  ✓ Employee B direct access to Task A blocked (HTTP 403).")

    # Employee B tries to edit Employee A's task
    r = client.patch(f"/api/v1/activities/{task_a_id}", json={"name": "Hacked Name"}, headers=emp_b_headers)
    assert r.status_code == 403, f"Security Violation! Employee B modified Task A: {r.status_code}"
    print("  ✓ Employee B editing Task A blocked (HTTP 403).")

    # 7. Employee Workflow: Update Progress -> Submit for Review -> Admin Approve
    print("\n[7/8] Testing Workflow: Submit for Review & Admin Approval...")
    # Employee A updates own task
    r = client.patch(f"/api/v1/activities/{task_a_id}", json={
        "status": "in_progress",
        "evidence_notes": "Completed initial draft calculations"
    }, headers=emp_a_headers)
    assert r.status_code == 200, f"Employee A failed to update own task: {r.text}"
    print("  ✓ Employee A updated status to 'in_progress'.")

    # Employee A submits work for review
    r = client.post(f"/api/v1/activities/{task_a_id}/submit", json={
        "submission_notes": "All financial models audited and ready for review",
        "actual_quantity": 100
    }, headers=emp_a_headers)
    assert r.status_code == 200, f"Submission failed: {r.text}"
    assert r.json()["status"] == "under_review"
    print("  ✓ Employee A submitted work (status: 'under_review').")

    # Admin reviews and approves task
    r = client.post(f"/api/v1/activities/{task_a_id}/review", json={
        "action": "approve",
        "feedback": "Outstanding analysis! Approved."
    }, headers=admin_headers)
    assert r.status_code == 200, f"Admin approval failed: {r.text}"
    assert r.json()["status"] == "completed"
    print("  ✓ Admin approved task (status: 'completed').")

    # 8. Admin Reset Password & Toggle Status
    print("\n[8/8] Testing Admin Account Deactivation & Password Reset...")
    # Admin resets Employee B's password
    r = client.post(f"/api/v1/users/{emp_b_id}/reset-password", json={"new_password": "NewSecret123!"}, headers=admin_headers)
    assert r.status_code == 200, f"Password reset failed: {r.text}"
    print("  ✓ Admin reset Employee B's password.")

    # Employee B logs in with new password
    r = client.post("/api/v1/auth/login-json", json={"email": "employee.b@mes.local", "password": "NewSecret123!"})
    assert r.status_code == 200, f"Employee B login with new password failed: {r.text}"
    print("  ✓ Employee B successfully logged in with new password.")

    # Admin deactivates Employee B
    r = client.post(f"/api/v1/users/{emp_b_id}/toggle-status?status_val=suspended", headers=admin_headers)
    assert r.status_code == 200, f"Status toggle failed: {r.text}"
    print("  ✓ Admin suspended Employee B.")

    # Suspended Employee B login must be rejected
    r = client.post("/api/v1/auth/login-json", json={"email": "employee.b@mes.local", "password": "NewSecret123!"})
    assert r.status_code == 403, f"Security Violation! Suspended employee was able to login: {r.status_code}"
    print("  ✓ Suspended employee login blocked (HTTP 403).")

    # Reactivate Employee B
    client.post(f"/api/v1/users/{emp_b_id}/toggle-status?status_val=active", headers=admin_headers)

    print("\n==================================================")
    print("   ALL 8 RBAC & DATA ISOLATION TEST SUITES PASSED! ")
    print("==================================================")

if __name__ == "__main__":
    run_rbac_tests()
