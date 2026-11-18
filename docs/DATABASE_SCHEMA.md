# Database Schema – Management Execution System

Normalized relational design. SQLite for local/demo; switchable to PostgreSQL.

## Entity Relationship Overview

Users ──┬── Roles
        ├── Teams
        ├── Goals (owner)
        ├── Activities (assignee / creator)
        ├── WeeklyReviews (participants)
        ├── Notifications
        └── GoogleCalendarConnections

Goals ──┬── GoalMilestones
        ├── Activities
        └── OutputKPIs

Activities ──┬── ActivityUpdates (history)
             ├── Comments
             ├── Attachments
             └── CalendarEventMappings

Hiring-specific:
Agencies ── Candidates ── Interviews
ProfessionalReferences
Conferences ── ConferenceAttendees

Expansion:
OfficeLocations (city) ── CoworkingProviders ── SiteVisits
BDHiring (city-level)

Products ── ProductMilestones

## Core Tables

### users
- id (PK, UUID)
- email (unique)
- hashed_password
- full_name
- role (enum: management, goal_owner, team_member, coordinator, admin)
- is_active
- avatar_url
- phone
- created_at, updated_at
- last_login

### roles (optional normalized, or enum on user)
For flexibility: role_permissions table if needed later.

### goals
- id (PK)
- goal_id_code (e.g. "G01", unique)
- name
- description
- annual_target (text / JSON)
- start_date
- target_completion_date
- owner_id (FK users)
- priority (low/medium/high/critical)
- status (not_started / in_progress / at_risk / completed / archived)
- review_frequency (weekly)
- created_by
- created_at, updated_at

### goal_milestones
- id
- goal_id (FK)
- name
- description
- target_date
- actual_date
- status
- owner_id
- completion_percentage
- sort_order

### activities
- id
- activity_code (optional)
- goal_id (FK, nullable for standalone)
- name
- description
- assigned_to (FK users)
- created_by (FK)
- priority
- start_date
- due_date
- target_frequency (daily/weekly/fortnightly/monthly/milestone)
- target_quantity (int)
- actual_quantity (int)
- last_completed_date
- next_due_date
- status (todo / in_progress / completed / blocked / cancelled)
- rag_status (green/amber/red/grey) – computed or stored
- evidence_notes
- created_at, updated_at

### activity_updates (audit trail)
- id
- activity_id
- updated_by
- previous_status
- new_status
- previous_quantity
- new_quantity
- notes
- created_at

### comments
- id
- entity_type (activity / goal / review / candidate ...)
- entity_id
- user_id
- content
- created_at

### attachments
- id
- entity_type
- entity_id
- filename
- file_path / storage_key
- mime_type
- size
- uploaded_by
- created_at

### weekly_reviews
- id
- week_start_date
- scheduled_date
- actual_meeting_date
- status (scheduled / completed / missed_saturday / missed_fallback / red_alert)
- conducted (bool)
- goals_reviewed (JSON or M2M)
- major_challenges
- decisions
- meeting_notes
- next_review_date
- created_by
- created_at, updated_at

### meeting_participants
- id
- weekly_review_id
- user_id
- attended (bool)

### action_items
- id
- weekly_review_id
- description
- responsible_id (FK users)
- due_date
- status
- created_at

### notifications
- id
- user_id
- title
- message
- type (task_assigned / overdue / review_pending / agency_no_cv / ...)
- related_entity_type
- related_entity_id
- is_read
- created_at

### google_calendar_connections
- id
- user_id (unique)
- access_token (encrypted)
- refresh_token (encrypted)
- token_expiry
- calendar_id (selected)
- sync_token
- is_active
- last_sync_at
- created_at, updated_at

### calendar_event_mappings
- id
- activity_id / review_id / interview_id / etc. (polymorphic or specific FKs)
- google_event_id
- user_id
- last_synced_at
- sync_status
- conflict_log

## Hiring Module Tables

### hiring_agencies
- id
- name
- contact_person
- contact_email / phone
- position_assigned (Senior Analyst / Senior BD / CAT II Fund Manager)
- date_appointed
- target_cvs
- total_cvs_received
- last_cv_received_date
- last_followup_date
- followup_owner_id
- reason_for_no_cv
- next_followup_date
- status (active / inactive / underperforming)
- remarks
- created_at, updated_at

### candidates
- id
- full_name
- email / phone
- position
- source_type (agency / network / conference / referral / direct)
- source_agency_id (nullable)
- source_reference_id (nullable)
- current_stage (source / cv_received / screening / interview_scheduled / interview_completed / selected / offer_released / joined / rejected)
- cv_file_id
- expected_compensation
- offer_status
- joining_date
- assigned_recruiter_id
- remarks
- created_at, updated_at

### candidate_interviews
- id
- candidate_id
- interview_date
- panel (JSON or text)
- outcome
- feedback
- next_round
- interviewer_ids

### professional_references
- id
- contact_person
- company_background
- reference_source
- potential_candidate_name
- role_fit
- date_of_contact
- followup_date
- outcome
- owner_id
- created_at

### conferences
- id
- name
- date
- location
- relevance_notes
- attendance_status (planned / registered / attended / missed)
- people_met (JSON)
- post_event_followups
- owner_id
- created_at

## Expansion Module

### office_locations
- id
- city (Ahmedabad / Bangalore)
- target_operational_date
- actual_operational_date
- status
- created_at

### coworking_providers
- id
- office_location_id
- provider_name
- location_address
- contact_person
- contact_details
- monthly_rent
- security_deposit
- facilities (JSON / text)
- capacity
- proposal_received_date
- comparison_notes
- is_selected
- agreement_status
- created_at

### site_visits
- id
- coworking_provider_id
- visit_date
- attendees (JSON)
- observations
- next_action
- status

### bd_hiring (city level summary + individual candidates can reuse candidates table with city flag)

## Product Module

### products
- id
- name
- category (PMS / CAT_II_AIF / CAT_III_AIF / Other)
- product_owner_id
- target_launch_date
- actual_launch_date
- status
- created_at

### product_milestones
- id
- product_id
- name (Concept finalization / Market research / Strategy / Regulatory / Internal approvals / Documentation / Marketing material / Launch readiness / Actual launch)
- description
- target_date
- actual_date
- status
- owner_id
- evidence
- sort_order

## Supporting

### audit_logs
- id
- user_id
- action
- entity_type
- entity_id
- old_value (JSON)
- new_value (JSON)
- ip_address
- created_at

### teams (optional grouping)
- id
- name
- description

### team_members
- team_id
- user_id

## Indexes (key ones)
- activities(assigned_to, due_date, status)
- activities(goal_id, status)
- candidates(current_stage, position)
- weekly_reviews(week_start_date, status)
- notifications(user_id, is_read)
- hiring_agencies(next_followup_date, status)

## Notes
- All monetary / sensitive fields validated.
- Soft deletes where historical integrity needed (status = archived).
- RAG status can be computed on read or maintained via triggers / application logic for performance.
