"""
Seed realistic demo data for the Management Execution System.
Run from backend/: python -m scripts.seed_demo_data
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta, datetime, timezone
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.goal import Goal, GoalMilestone
from app.models.activity import Activity
from app.models.review import WeeklyReview, ActionItem
from app.models.hiring import HiringAgency, Candidate, ProfessionalReference, Conference
from app.models.expansion import OfficeLocation, CoworkingProvider
from app.models.product import Product, ProductMilestone
from app.models.notification import Notification

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing = await db.execute(select(User).limit(1))
        if existing.scalar_one_or_none():
            print("Database already has data. Skipping seed.")
            return
        
        print("Seeding demo users...")
        users = [
            User(email="admin@mes.local", employee_id="FA-ADM-001", username="admin", department="Management", designation="Platform Super Admin", hashed_password=get_password_hash("admin123"), full_name="Mr. Aditya", role="admin", job_title="Platform Super Admin", status="active"),
            User(email="ceo@mes.local", employee_id="FA-EXEC-001", username="abhishek.ceo", department="Executive", designation="Fund Manager", hashed_password=get_password_hash("demo1234"), full_name="Mr. Abhishek", role="management", job_title="Fund Manager", status="active"),
            User(email="hr@mes.local", employee_id="FA-HR-001", username="vedahai.hr", department="Human Resources", designation="Head of Talent Acquisition", hashed_password=get_password_hash("demo1234"), full_name="Ms. Vedahai", role="goal_owner", job_title="Head of Talent Acquisition", status="active"),
            User(email="bd@mes.local", employee_id="FA-BD-001", username="gaurav.bd", department="Business Development", designation="Business Development Manager", hashed_password=get_password_hash("demo1234"), full_name="Mr. Gaurav", role="coordinator", job_title="Business Development Manager", status="active"),
            User(email="product@mes.local", employee_id="FA-PRD-001", username="mitwayayi.social", department="Social Media", designation="Social Media", hashed_password=get_password_hash("demo1234"), full_name="Ms. Mitwayayi", role="team_member", job_title="Social Media", status="active"),
            User(email="maitwayi@mes.local", employee_id="FA-COORD-001", username="maitwayi.desai", department="Operations", designation="Execution Coordinator", hashed_password=get_password_hash("demo1234"), full_name="Maitwayi Desai", role="coordinator", job_title="Execution Coordinator", status="active"),
            User(email="analyst1@mes.local", employee_id="FA-EMP-001", username="vikram.analyst", department="Finance", designation="Financial Analyst", hashed_password=get_password_hash("demo1234"), full_name="Vikram Joshi", role="team_member", job_title="Financial Analyst", status="active"),
            User(email="recruiter@mes.local", employee_id="FA-EMP-002", username="ananya.recruiter", department="Human Resources", designation="Talent Acquisition Specialist", hashed_password=get_password_hash("demo1234"), full_name="Ananya Iyer", role="team_member", job_title="Talent Acquisition Specialist", status="active"),
        ]
        for u in users:
            db.add(u)
        await db.flush()
        
        user_map = {u.email: u for u in users}
        
        print("Seeding goals...")
        goals_data = [
            {
                "goal_code": "G01",
                "name": "Hiring & Talent Acquisition",
                "description": "Build the required talent pipeline and complete priority hires for Senior Analyst, Senior BD and CAT II Fund Manager.",
                "annual_target": "Complete priority hiring for 3 key roles with strong pipeline.",
                "owner": "hr@mes.local",
                "priority": "critical",
                "status": "in_progress",
                "start": date(2026, 1, 1),
                "target": date(2026, 6, 30),
            },
            {
                "goal_code": "G02",
                "name": "Geographic Expansion — Ahmedabad & Bangalore",
                "description": "Establish offices in Ahmedabad and Bangalore and hire local BD teams.",
                "annual_target": "Both offices operational with BD headcount in place.",
                "owner": "bd@mes.local",
                "priority": "high",
                "status": "in_progress",
                "start": date(2026, 1, 15),
                "target": date(2026, 9, 30),
            },
            {
                "goal_code": "G03",
                "name": "Product Development (PMS / AIF / CAT II)",
                "description": "Progress PMS / AIF / CAT II or other approved product initiatives to launch readiness.",
                "annual_target": "At least one product launched; others at advanced stage.",
                "owner": "product@mes.local",
                "priority": "high",
                "status": "in_progress",
                "start": date(2026, 2, 1),
                "target": date(2026, 12, 15),
            },
        ]
        
        goal_objs = {}
        for g in goals_data:
            goal = Goal(
                goal_code=g["goal_code"],
                name=g["name"],
                description=g["description"],
                annual_target=g["annual_target"],
                owner_id=user_map[g["owner"]].id,
                priority=g["priority"],
                status=g["status"],
                start_date=g["start"],
                target_completion_date=g["target"],
                created_by=user_map["ceo@mes.local"].id,
            )
            db.add(goal)
            await db.flush()
            goal_objs[g["goal_code"]] = goal
        
        # Milestones for G01
        for i, name in enumerate(["Agency appointments complete", "Pipeline of 30+ CVs", "First offers released", "All priority roles filled"]):
            db.add(GoalMilestone(goal_id=goal_objs["G01"].id, name=name, sort_order=i, completion_percentage=25.0 if i < 2 else 0.0, status="completed" if i < 2 else "pending"))
        
        # Activities for G01
        today = date.today()
        activities = [
            Activity(goal_id=goal_objs["G01"].id, name="Weekly agency follow-ups (Senior Analyst)", assigned_to=user_map["recruiter@mes.local"].id, created_by=user_map["hr@mes.local"].id, due_date=today + timedelta(days=2), target_frequency="weekly", target_quantity=3, status="in_progress", module="hiring", priority="high"),
            Activity(goal_id=goal_objs["G01"].id, name="Reference calls this week", assigned_to=user_map["hr@mes.local"].id, created_by=user_map["hr@mes.local"].id, due_date=today + timedelta(days=1), target_frequency="weekly", target_quantity=4, actual_quantity=2, status="in_progress", module="hiring"),
            Activity(goal_id=goal_objs["G01"].id, name="Screen top 5 Senior BD CVs", assigned_to=user_map["recruiter@mes.local"].id, created_by=user_map["hr@mes.local"].id, due_date=today - timedelta(days=1), status="todo", module="hiring", priority="high"),
            Activity(goal_id=goal_objs["G02"].id, name="Site visit – WeWork Ahmedabad", assigned_to=user_map["bd@mes.local"].id, created_by=user_map["bd@mes.local"].id, due_date=today + timedelta(days=5), status="todo", module="expansion"),
            Activity(goal_id=goal_objs["G02"].id, name="Compare commercial proposals Bangalore", assigned_to=user_map["bd@mes.local"].id, created_by=user_map["bd@mes.local"].id, due_date=today + timedelta(days=3), status="in_progress", module="expansion"),
            Activity(goal_id=goal_objs["G03"].id, name="Finalize CAT II investment strategy document", assigned_to=user_map["product@mes.local"].id, created_by=user_map["product@mes.local"].id, due_date=today + timedelta(days=10), status="in_progress", module="product", priority="critical"),
            Activity(goal_id=goal_objs["G03"].id, name="Regulatory compliance checklist – PMS", assigned_to=user_map["product@mes.local"].id, created_by=user_map["product@mes.local"].id, due_date=today - timedelta(days=3), status="todo", module="product", priority="high"),
        ]
        for a in activities:
            db.add(a)
        
        # Hiring agencies
        agencies = [
            HiringAgency(name="TalentBridge India", contact_person="Ravi Kumar", contact_email="ravi@talentbridge.in", position_assigned="Senior Analyst", date_appointed=date(2026, 1, 10), target_cvs=10, total_cvs_received=7, last_cv_received_date=today - timedelta(days=4), next_followup_date=today + timedelta(days=2), status="active"),
            HiringAgency(name="ExecSearch Partners", contact_person="Meera Nair", contact_email="meera@execsearch.com", position_assigned="CAT II Fund Manager", date_appointed=date(2026, 1, 15), target_cvs=5, total_cvs_received=1, last_cv_received_date=today - timedelta(days=18), next_followup_date=today - timedelta(days=2), status="underperforming", reason_for_no_cv="Candidate market tight for CAT II experience"),
            HiringAgency(name="GrowthHire", contact_person="Sanjay Gupta", position_assigned="Senior BD", date_appointed=date(2026, 2, 1), target_cvs=8, total_cvs_received=4, last_cv_received_date=today - timedelta(days=6), next_followup_date=today + timedelta(days=1), status="active"),
        ]
        for ag in agencies:
            db.add(ag)
        await db.flush()
        
        # Candidates
        candidates = [
            Candidate(full_name="Arjun Kapoor", email="arjun.k@email.com", position="Senior Analyst", source_type="agency", source_agency_id=agencies[0].id, current_stage="interview_completed", assigned_recruiter_id=user_map["recruiter@mes.local"].id),
            Candidate(full_name="Neha Joshi", email="neha.j@email.com", position="Senior BD", source_type="network", current_stage="cv_received", assigned_recruiter_id=user_map["recruiter@mes.local"].id),
            Candidate(full_name="Rohit Malhotra", position="CAT II Fund Manager", source_type="agency", source_agency_id=agencies[1].id, current_stage="screening", assigned_recruiter_id=user_map["hr@mes.local"].id),
        ]
        for c in candidates:
            db.add(c)
        
        # Office locations
        amd = OfficeLocation(city="Ahmedabad", target_operational_date=date(2026, 5, 31), status="site_selection", bd_target_headcount=3)
        blr = OfficeLocation(city="Bangalore", target_operational_date=date(2026, 7, 31), status="planning", bd_target_headcount=4)
        db.add(amd)
        db.add(blr)
        await db.flush()
        
        db.add(CoworkingProvider(office_location_id=amd.id, provider_name="WeWork Ahmedabad", location_address="SG Highway", monthly_rent=85000, security_deposit=170000, capacity=12, is_selected=False, agreement_status="pending"))
        db.add(CoworkingProvider(office_location_id=amd.id, provider_name="91Springboard", location_address="Prahlad Nagar", monthly_rent=72000, security_deposit=144000, capacity=10, is_selected=False))
        db.add(CoworkingProvider(office_location_id=blr.id, provider_name="Innov8 Bangalore", monthly_rent=110000, capacity=15, agreement_status="pending"))
        
        # Products
        pms = Product(name="Discretionary PMS", category="PMS", product_owner_id=user_map["product@mes.local"].id, target_launch_date=date(2026, 8, 31), status="development")
        cat2 = Product(name="CAT II AIF – Growth Fund", category="CAT_II_AIF", product_owner_id=user_map["product@mes.local"].id, target_launch_date=date(2026, 11, 30), status="research")
        db.add(pms)
        db.add(cat2)
        await db.flush()
        
        for i, name in enumerate(["Concept finalization", "Market research", "Strategy / mandate", "Regulatory & compliance", "Internal approvals", "Documentation", "Marketing material", "Launch readiness"]):
            pct = 100.0 if i < 3 else (50.0 if i == 3 else 0.0)
            st = "completed" if i < 3 else ("in_progress" if i == 3 else "pending")
            db.add(ProductMilestone(product_id=pms.id, name=name, sort_order=i, completion_percentage=pct, status=st, owner_id=user_map["product@mes.local"].id))

        for i, name in enumerate(["Concept finalization", "Market research", "Strategy / mandate", "Regulatory & compliance", "Internal approvals", "Documentation", "Marketing material", "Launch readiness"]):
            pct = 100.0 if i < 1 else (40.0 if i == 1 else 0.0)
            st = "completed" if i < 1 else ("in_progress" if i == 1 else "pending")
            db.add(ProductMilestone(product_id=cat2.id, name=name, sort_order=i, completion_percentage=pct, status=st, owner_id=user_map["product@mes.local"].id))
        
        # Weekly reviews
        last_sat = today - timedelta(days=(today.weekday() + 2) % 7)
        review = WeeklyReview(
            week_start_date=last_sat - timedelta(days=5),
            scheduled_date=last_sat,
            actual_meeting_date=last_sat,
            status="completed",
            conducted=True,
            goals_reviewed="G01, G02, G03",
            decisions="Accelerate agency follow-ups for CAT II. Approve site visit budget for Ahmedabad.",
            meeting_notes="Good progress on hiring pipeline. Expansion slightly behind on Bangalore.",
            next_review_date=last_sat + timedelta(days=7),
            created_by=user_map["maitwayi@mes.local"].id,
        )
        db.add(review)
        await db.flush()
        db.add(ActionItem(weekly_review_id=review.id, description="Send formal follow-up email to ExecSearch Partners", responsible_id=user_map["hr@mes.local"].id, due_date=today + timedelta(days=2), status="open"))
        
        # Notifications
        db.add(Notification(user_id=user_map["hr@mes.local"].id, title="Agency follow-up overdue", message="ExecSearch Partners has not submitted CVs in 18 days.", type="agency_no_cv", related_entity_type="hiring_agency"))
        db.add(Notification(user_id=user_map["bd@mes.local"].id, title="Site visit pending", message="Ahmedabad WeWork site visit is scheduled this week.", type="site_visit", related_entity_type="activity"))
        db.add(Notification(user_id=user_map["maitwayi@mes.local"].id, title="Prepare weekly review agenda", message="Saturday review is approaching. Collect updates from owners.", type="review_pending"))
        
        await db.commit()
        print("Demo data seeded successfully.")
        print("\nLogin credentials (all passwords: demo1234 except admin):")
        print("  admin@mes.local / admin123  (Admin)")
        print("  ceo@mes.local / demo1234    (Management)")
        print("  hr@mes.local / demo1234     (Goal Owner – Hiring)")
        print("  bd@mes.local / demo1234     (Goal Owner – Expansion)")
        print("  product@mes.local / demo1234 (Goal Owner – Product)")
        print("  maitwayi@mes.local / demo1234 (Coordinator)")
        print("  recruiter@mes.local / demo1234 (Team Member)")

if __name__ == "__main__":
    asyncio.run(seed())
