# ExecFlow — Management Execution System
## Relational Database Schema Specification

This document details the normalized relational database architecture supporting ExecFlow. It is implemented with **SQLAlchemy 2.0 async** and runs on **SQLite** for local development / testing, and is directly portable to **PostgreSQL** in production with Alembic migrations.

---

### Entity Relationship Diagram

```
                 ┌─────────────────────────────────────────────────────────────┐
                 │                            USERS                            │
                 │ id, email, hashed_password, full_name, role, job_title, etc.│
                 └──────┬──────────────┬──────────────┬──────────────┬─────────┘
                        │              │              │              │
       ┌────────────────┘              │              │              └────────────────┐
       ▼                               ▼              ▼                               ▼
┌──────────────┐               ┌──────────────┐ ┌──────────────┐               ┌──────────────┐
│    GOALS     │               │  ACTIVITIES  │ │WEEKLY REVIEWS│               │NOTIFICATIONS │
│ id, code,    │               │ id, goal_id, │ │ id, date,    │               │ id, user_id, │
│ owner_id...  │               │ assigned_to, │ │ status...    │               │ title, msg...│
└──────┬───────┘               │ due_date...  │ └──────┬───────┘               └──────────────┘
       │                       └──────┬───────┘        │
       ▼                              │                ▼
┌──────────────┐                      │         ┌──────────────┐
│GOALMILESTONES│                      │         │ ACTION ITEMS │
│ id, goal_id, │                      │         │ id, review_id│
│ target_date..│                      │         │ responsible..│
└──────────────┘                      │         └──────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
    ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
    │ACTIVITYUPDATE│           │   COMMENTS   │           │ ATTACHMENTS  │
    │ (Audit log)  │           │ entity_type, │           │ filename,    │
    │ prev/new val │           │ entity_id... │           │ path, size.. │
    └──────────────┘           └──────────────┘           └──────────────┘

 HIRING DOMAIN                          EXPANSION DOMAIN                PRODUCT DOMAIN
┌────────────────────────┐             ┌────────────────────────┐      ┌────────────────────────┐
│    HIRING AGENCIES     │             │    OFFICE LOCATIONS    │      │        PRODUCTS        │
│ id, name, target_cvs,  │             │ Ahmedabad / Bangalore  │      │ PMS / CAT II / CAT III │
│ followups, status...   │             │ operational_dates...   │      │ target_launch_date...  │
└──────────┬─────────────┘             └──────────┬─────────────┘      └──────────┬─────────────┘
           │                                      │                               │
           ▼                                      ▼                               ▼
┌────────────────────────┐             ┌────────────────────────┐      ┌────────────────────────┐
│       CANDIDATES       │             │  COWORKING PROVIDERS   │      │   PRODUCT MILESTONES   │
│ stage: source->joined  │             │ rent, deposit, capacity│      │ Concept -> Launch      │
│ agency_id, position... │             │ proposals, selected... │      │ status, evidence...    │
└──────────┬─────────────┘             └──────────┬─────────────┘      └────────────────────────┘
           │                                      │
           ▼                                      ▼
┌────────────────────────┐             ┌────────────────────────┐
│  CANDIDATE INTERVIEWS  │             │      SITE VISITS       │
│ date, panel, outcome...│             │ provider_id, attendee..│
└────────────────────────┘             └────────────────────────┘

 SUPPORTING TRACKERS:
 - PROFESSIONAL REFERENCES (target: 4/week, contact_person, candidate, outcome)
 - CONFERENCES (target: 1/15 days, event_name, attendance_status, people_met)
 - GOOGLE CALENDAR CONNECTIONS (oauth tokens, calendar_id, sync_token)
 - CALENDAR EVENT MAPPINGS (entity_type, entity_id, google_event_id, sync_status)
 - AUDIT LOGS (user_id, action, entity_type, old_value, new_value, ip)
```

---

### Detailed Table Definitions

#### 1. `users`
Represents system users and authentication credentials.
- `id` (String(36), PK): UUID.
- `email` (String(255), Unique, Indexed, Not Null): Login email.
- `hashed_password` (String(255), Not Null): Bcrypt hashed password.
- `full_name` (String(200), Not Null): Display name.
- `role` (String(50), Not Null): `management`, `goal_owner`, `team_member`, `coordinator`, `admin`.
- `job_title` (String(100), Nullable): Corporate title.
- `phone` (String(50), Nullable): Contact number.
- `avatar_url` (String(500), Nullable): Profile picture link.
- `is_active` (Boolean, Default True): Account active flag.
- `created_at`, `updated_at`, `last_login` (DateTime with timezone).

#### 2. `goals`
Master record for company annual goals.
- `id` (String(36), PK): UUID.
- `goal_code` (String(20), Unique, Indexed, Not Null): e.g. `G01`, `G02`, `G03`.
- `name` (String(300), Not Null): Goal title.
- `description` (Text, Nullable): Detailed scope and objectives.
- `annual_target` (Text, Nullable): Measurable end-of-year output target.
- `start_date` (Date, Nullable), `target_completion_date` (Date, Nullable).
- `owner_id` (String(36), FK `users.id`, Nullable): Assigned goal owner.
- `priority` (String(20), Default `medium`): `low`, `medium`, `high`, `critical`.
- `status` (String(30), Default `not_started`): `not_started`, `in_progress`, `at_risk`, `completed`, `archived`.
- `review_frequency` (String(30), Default `weekly`).
- `created_by` (String(36), FK `users.id`, Nullable).

#### 3. `goal_milestones`
High-level target gates under each goal.
- `id` (String(36), PK): UUID.
- `goal_id` (String(36), FK `goals.id`, Not Null).
- `name` (String(300), Not Null).
- `target_date` (Date, Nullable), `actual_date` (Date, Nullable).
- `status` (String(30), Default `pending`): `pending`, `in_progress`, `completed`.
- `completion_percentage` (Float, Default 0.0).
- `sort_order` (Integer, Default 0).

#### 4. `activities`
Central execution engine for recurring and milestone-based tasks.
- `id` (String(36), PK): UUID.
- `activity_code` (String(30), Nullable): Unique code.
- `goal_id` (String(36), FK `goals.id`, Nullable).
- `name` (String(400), Not Null).
- `description` (Text, Nullable).
- `assigned_to` (String(36), FK `users.id`, Nullable).
- `created_by` (String(36), FK `users.id`, Nullable).
- `priority` (String(20), Default `medium`).
- `start_date` (Date, Nullable), `due_date` (Date, Nullable).
- `target_frequency` (String(30), Nullable): `daily`, `weekly`, `fortnightly`, `monthly`, `milestone`.
- `target_quantity` (Integer, Nullable), `actual_quantity` (Integer, Default 0).
- `last_completed_date` (Date, Nullable), `next_due_date` (Date, Nullable).
- `status` (String(30), Default `todo`): `todo`, `in_progress`, `completed`, `blocked`, `cancelled`.
- `rag_status` (String(20), Default `grey`): Computed or stored (`green`, `amber`, `red`, `grey`).
- `evidence_notes` (Text, Nullable).
- `module` (String(50), Nullable): `hiring`, `expansion`, `product`, `general`.

#### 5. `activity_updates` (Audit Trail)
- `id` (String(36), PK): UUID.
- `activity_id` (String(36), FK `activities.id`, Not Null).
- `updated_by` (String(36), FK `users.id`, Nullable).
- `previous_status`, `new_status` (String(30), Nullable).
- `previous_quantity`, `new_quantity` (Integer, Nullable).
- `notes` (Text, Nullable).
- `created_at` (DateTime with timezone).

#### 6. `weekly_reviews`
Core management cadence records.
- `id` (String(36), PK): UUID.
- `week_start_date` (Date, Not Null, Indexed).
- `scheduled_date` (Date, Not Null): Primary is Saturday.
- `actual_meeting_date` (Date, Nullable).
- `status` (String(30), Default `scheduled`): `scheduled`, `completed`, `pending_fallback`, `red_alert`.
- `conducted` (Boolean, Default False).
- `goals_reviewed` (Text, Nullable): Summary or list of goals covered.
- `major_challenges` (Text, Nullable).
- `decisions` (Text, Nullable).
- `meeting_notes` (Text, Nullable).
- `next_review_date` (Date, Nullable).
- `created_by` (String(36), FK `users.id`, Nullable).

#### 7. `action_items`
Deliverables arising from weekly reviews.
- `id` (String(36), PK): UUID.
- `weekly_review_id` (String(36), FK `weekly_reviews.id`, Not Null).
- `description` (Text, Not Null).
- `responsible_id` (String(36), FK `users.id`, Nullable).
- `due_date` (Date, Nullable).
- `status` (String(30), Default `open`): `open`, `in_progress`, `completed`.

#### 8. `hiring_agencies`
- `id` (String(36), PK): UUID.
- `name` (String(200), Not Null): Agency firm name.
- `contact_person`, `contact_email`, `contact_phone` (Nullable).
- `position_assigned` (String(100), Not Null): Senior Analyst / Senior BD / CAT II Fund Manager.
- `date_appointed` (Date, Nullable).
- `target_cvs` (Integer, Nullable), `total_cvs_received` (Integer, Default 0).
- `last_cv_received_date`, `last_followup_date`, `next_followup_date` (Date, Nullable).
- `followup_owner_id` (String(36), FK `users.id`, Nullable).
- `reason_for_no_cv` (Text, Nullable).
- `status` (String(30), Default `active`): `active`, `inactive`, `underperforming`.

#### 9. `candidates` & `candidate_interviews`
- `candidates`: `id`, `full_name`, `email`, `phone`, `position`, `source_type` (`agency`, `network`, `conference`, `referral`, `direct`), `source_agency_id`, `current_stage` (`source`, `cv_received`, `screening`, `interview_scheduled`, `interview_completed`, `selected`, `offer_released`, `joined`, `rejected`), `expected_compensation`, `offer_status`, `joining_date`, `assigned_recruiter_id`.
- `candidate_interviews`: `id`, `candidate_id`, `interview_date`, `panel`, `outcome`, `feedback`, `next_round`.

#### 10. `professional_references` & `conferences`
- `professional_references`: `id`, `contact_person`, `company_background`, `reference_source`, `potential_candidate_name`, `role_fit`, `date_of_contact`, `followup_date`, `outcome`, `owner_id`. Target = 4 calls/week.
- `conferences`: `id`, `name`, `event_date`, `location`, `relevance_notes`, `attendance_status` (`planned`, `registered`, `attended`, `missed`), `people_met` (JSON text), `post_event_followups`, `owner_id`. Target = 1 event / 15 days.

#### 11. `office_locations`, `coworking_providers`, `site_visits`
- `office_locations`: `id`, `city` (`Ahmedabad` / `Bangalore`), `target_operational_date`, `actual_operational_date`, `status` (`planning`, `site_selection`, `agreement`, `operational`), `bd_target_headcount`, `bd_current_headcount`.
- `coworking_providers`: `id`, `office_location_id`, `provider_name`, `location_address`, `contact_person`, `monthly_rent`, `security_deposit`, `capacity`, `proposal_received_date`, `comparison_notes`, `is_selected`, `agreement_status`.
- `site_visits`: `id`, `coworking_provider_id`, `visit_date`, `attendees`, `observations`, `next_action`, `status`.

#### 12. `products` & `product_milestones`
- `products`: `id`, `name`, `category` (`PMS`, `CAT_II_AIF`, `CAT_III_AIF`, `Other`), `product_owner_id`, `target_launch_date`, `actual_launch_date`, `status`.
- `product_milestones`: `id`, `product_id`, `name` (Concept finalization, Market research, Strategy/mandate, Regulatory & compliance, Internal approvals, Documentation, Marketing material, Launch readiness, Actual launch), `target_date`, `actual_date`, `status`, `owner_id`, `evidence`, `completion_percentage`, `sort_order`.

#### 13. Integrations & System
- `notifications`: `id`, `user_id`, `title`, `message`, `type`, `related_entity_type`, `related_entity_id`, `is_read`, `created_at`.
- `google_calendar_connections`: `id`, `user_id`, `access_token`, `refresh_token`, `token_expiry`, `calendar_id`, `sync_token`, `is_active`, `last_sync_at`.
- `calendar_event_mappings`: `id`, `entity_type`, `entity_id`, `google_event_id`, `user_id`, `last_synced_at`, `sync_status`, `conflict_log`.
- `audit_logs`: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `ip_address`, `created_at`.
- `comments` & `attachments`: Universal polymorphic storage by `entity_type` and `entity_id`.
