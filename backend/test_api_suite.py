"""
ExecFlow Automated API Test Suite
Tests all endpoints using FastAPI TestClient & direct AsyncClient.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("========================================")
    print("   ExecFlow Automated API Test Suite   ")
    print("========================================")
    
    client = TestClient(app)
    
    # 1. Health & Root
    print("[1/13] Testing Health & Root Endpoints...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    assert r.json()["status"] == "healthy"
    
    r = client.get("/")
    assert r.status_code == 200
    assert len(r.json()["endpoints"]) >= 10
    print("  ✓ Health & Root endpoints verified.")
    
    # 2. Authentication
    print("[2/13] Testing Authentication & JWT Generation...")
    login_data = {"email": "ceo@mes.local", "password": "demo1234"}
    r = client.post("/api/v1/auth/login-json", json=login_data)
    assert r.status_code == 200, f"Login JSON failed: {r.text}"
    tokens = r.json()
    assert "access_token" in tokens
    token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Also verify form-encoded OAuth login
    r_form = client.post("/api/v1/auth/login", data={"username": "ceo@mes.local", "password": "demo1234"})
    assert r_form.status_code == 200, f"OAuth Form login failed: {r_form.text}"
    
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == "ceo@mes.local"
    assert me["role"] == "management"
    print(f"  ✓ Logged in as: {me['full_name']} ({me['role']})")
    
    # 3. Executive Dashboard
    print("[3/13] Testing Executive Dashboard & 7 Charts...")
    r = client.get("/api/v1/dashboard/", headers=headers)
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    dash = r.json()
    kpis = dash["kpis"]
    assert kpis["total_active_goals"] >= 3
    assert len(dash["goal_cards"]) >= 3
    charts = dash["charts"]
    assert "weekly_trend" in charts
    assert "goal_progress" in charts
    assert "team_performance" in charts
    assert "task_distribution" in charts
    assert "hiring_funnel" in charts
    assert "city_expansion" in charts
    assert "product_milestones" in charts
    print(f"  ✓ Dashboard loaded: {kpis['total_active_goals']} active goals, {len(dash['alerts'])} alerts, 7 charts.")
    
    # 4. Goals Master
    print("[4/13] Testing Goals Master (G01, G02, G03)...")
    r = client.get("/api/v1/goals/", headers=headers)
    assert r.status_code == 200
    goals = r.json()
    codes = [g["goal_code"] for g in goals]
    assert "G01" in codes and "G02" in codes and "G03" in codes
    print(f"  ✓ {len(goals)} goals verified: {codes}")
    
    # 5. Activity Tracker & Creation
    print("[5/13] Testing Activities & RAG Calculation...")
    r = client.get("/api/v1/activities/", headers=headers)
    assert r.status_code == 200
    acts = r.json()
    assert len(acts) >= 5
    first_act = acts[0]
    assert first_act["rag_status"] in ("green", "amber", "red", "grey")
    
    new_act = {
        "name": "Automated Test Task",
        "description": "Created by automated suite",
        "priority": "high",
        "target_frequency": "weekly",
        "target_quantity": 5,
        "module": "general"
    }
    r = client.post("/api/v1/activities/", json=new_act, headers=headers)
    assert r.status_code == 201
    created_act = r.json()
    print(f"  ✓ Created test activity: {created_act['name']} (ID: {created_act['id'][:8]})")
    
    # 6. Weekly Reviews
    print("[6/13] Testing Weekly Reviews & Saturday Cadence...")
    r = client.get("/api/v1/reviews/", headers=headers)
    assert r.status_code == 200
    reviews = r.json()
    assert len(reviews) >= 1
    print(f"  ✓ {len(reviews)} weekly review records retrieved.")
    
    # 7. Hiring Module
    print("[7/13] Testing Hiring Management...")
    r = client.get("/api/v1/hiring/summary", headers=headers)
    assert r.status_code == 200
    h_sum = r.json()
    assert h_sum["total_agencies"] >= 3
    assert h_sum["total_candidates"] >= 3
    
    r = client.get("/api/v1/hiring/agencies", headers=headers)
    assert r.status_code == 200
    r = client.get("/api/v1/hiring/candidates", headers=headers)
    assert r.status_code == 200
    r = client.get("/api/v1/hiring/references", headers=headers)
    assert r.status_code == 200
    r = client.get("/api/v1/hiring/conferences", headers=headers)
    assert r.status_code == 200
    print(f"  ✓ Hiring trackers operational: {h_sum['total_agencies']} agencies, {h_sum['total_candidates']} candidates.")
    
    # 8. Expansion Module
    print("[8/13] Testing Expansion (Ahmedabad & Bangalore)...")
    r = client.get("/api/v1/expansion/summary", headers=headers)
    assert r.status_code == 200
    exp_sum = r.json()
    cities = [loc["city"] for loc in exp_sum["locations"]]
    assert "Ahmedabad" in cities and "Bangalore" in cities
    print(f"  ✓ Expansion verified for: {cities} with {exp_sum['total_shortlisted_providers']} coworking providers.")
    
    # 9. Product Development
    print("[9/13] Testing Product Development (PMS / CAT II)...")
    r = client.get("/api/v1/products/", headers=headers)
    assert r.status_code == 200
    prods = r.json()
    assert len(prods) >= 2
    assert any(len(p["milestones"]) >= 5 for p in prods)
    print(f"  ✓ Products verified: {[p['name'] for p in prods]} with progress tracking.")
    
    # 10. Calendar Integration & Sync
    print("[10/13] Testing Calendar Events & Google Sync...")
    r = client.get("/api/v1/calendar/events", headers=headers)
    assert r.status_code == 200
    events = r.json()
    assert len(events) >= 5
    
    r = client.post("/api/v1/calendar/sync", headers=headers)
    assert r.status_code == 200
    sync_res = r.json()
    assert sync_res["synced_count"] >= 5
    print(f"  ✓ Calendar operational: {len(events)} events synced.")
    
    # 11. Notifications
    print("[11/13] Testing Notification Engine...")
    r = client.get("/api/v1/notifications/", headers=headers)
    assert r.status_code == 200
    notifs = r.json()
    r = client.get("/api/v1/notifications/count", headers=headers)
    assert r.status_code == 200
    print(f"  ✓ {len(notifs)} notifications retrieved for user.")
    
    # 12. Reports Export
    print("[12/13] Testing Reports Export (Excel, CSV, PDF)...")
    r = client.get("/api/v1/reports/export/excel", headers=headers)
    assert r.status_code == 200
    assert len(r.content) > 1000
    assert r.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    r = client.get("/api/v1/reports/export/csv?entity=activities", headers=headers)
    assert r.status_code == 200
    assert "Activity" in r.text
    
    r = client.get("/api/v1/reports/export/pdf", headers=headers)
    assert r.status_code == 200
    assert r.content.startswith(b"%PDF")
    print("  ✓ Excel, CSV, and PDF exports generated and verified successfully.")
    
    # 13. Audit Trail
    print("[13/13] Testing Audit Trail...")
    r = client.get("/api/v1/audit/", headers=headers)
    assert r.status_code == 200
    print("  ✓ Audit trail endpoint functional.")
    
    print("\n========================================")
    print("   ALL 13 BACKEND TEST SUITES PASSED!   ")
    print("========================================")

if __name__ == "__main__":
    run_tests()
