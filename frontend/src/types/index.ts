export type Role = 'management' | 'goal_owner' | 'team_member' | 'coordinator' | 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  employee_id?: string;
  username?: string;
  department?: string;
  designation?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'archived';
  permissions_json?: string;
  phone?: string;
  job_title?: string;
  avatar_url?: string;
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
  last_login?: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  name: string;
  description?: string;
  target_date?: string;
  actual_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completion_percentage: number;
  sort_order: number;
  owner_id?: string;
}

export interface Goal {
  id: string;
  goal_code: string;
  name: string;
  description?: string;
  annual_target?: string;
  start_date?: string;
  target_completion_date?: string;
  owner_id?: string;
  owner?: User;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'archived';
  milestones?: GoalMilestone[];
  created_at: string;
  updated_at: string;
}

export type RAGStatus = 'green' | 'amber' | 'red' | 'grey';

export interface TaskAttachment {
  id: number;
  activity_id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_by?: number;
  created_at: string;
}

export interface Activity {
  id: string;
  activity_code?: string;
  goal_id?: string;
  name: string;
  description?: string;
  assigned_to?: string;
  assignee?: User;
  created_by?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  due_date?: string;
  target_frequency?: 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'milestone';
  target_quantity?: number;
  actual_quantity: number;
  last_completed_date?: string;
  next_due_date?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled' | 'assigned' | 'under_review' | 'on_hold';
  rag_status: RAGStatus;
  evidence_notes?: string;
  submission_notes?: string;
  admin_feedback?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: number;
  attachments?: TaskAttachment[];
  module?: 'hiring' | 'expansion' | 'product' | 'general';
  created_at: string;
  updated_at: string;
}

export interface ActivityUpdate {
  id: string;
  activity_id: string;
  updated_by?: string;
  previous_status?: string;
  new_status?: string;
  previous_quantity?: number;
  new_quantity?: number;
  notes?: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  weekly_review_id: string;
  description: string;
  responsible_id?: string;
  responsible?: User;
  due_date?: string;
  status: 'open' | 'in_progress' | 'completed';
}

export interface WeeklyReview {
  id: string;
  week_start_date: string;
  scheduled_date: string;
  actual_meeting_date?: string;
  status: 'scheduled' | 'completed' | 'pending_fallback' | 'red_alert';
  conducted: boolean;
  goals_reviewed?: string;
  major_challenges?: string;
  decisions?: string;
  meeting_notes?: string;
  next_review_date?: string;
  created_by?: string;
  created_at: string;
  action_items?: ActionItem[];
}

export interface HiringAgency {
  id: string;
  name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  position_assigned: 'Senior Analyst' | 'Senior BD' | 'CAT II Fund Manager';
  date_appointed?: string;
  target_cvs?: number;
  total_cvs_received: number;
  last_cv_received_date?: string;
  last_followup_date?: string;
  followup_owner_id?: string;
  reason_for_no_cv?: string;
  next_followup_date?: string;
  status: 'active' | 'inactive' | 'underperforming';
  remarks?: string;
  created_at: string;
}

export interface CandidateInterview {
  id: string;
  candidate_id: string;
  interview_date?: string;
  panel?: string;
  outcome?: string;
  feedback?: string;
  next_round?: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  position: string;
  source_type: 'agency' | 'network' | 'conference' | 'referral' | 'direct';
  source_agency_id?: string;
  current_stage: 'source' | 'cv_received' | 'screening' | 'interview_scheduled' | 'interview_completed' | 'selected' | 'offer_released' | 'joined' | 'rejected';
  expected_compensation?: string;
  offer_status?: string;
  joining_date?: string;
  assigned_recruiter_id?: string;
  remarks?: string;
  created_at: string;
  interviews?: CandidateInterview[];
}

export interface ProfessionalReference {
  id: string;
  contact_person: string;
  company_background?: string;
  reference_source?: string;
  potential_candidate_name?: string;
  role_fit?: string;
  date_of_contact?: string;
  followup_date?: string;
  outcome?: string;
  owner_id?: string;
  created_at: string;
}

export interface Conference {
  id: string;
  name: string;
  event_date?: string;
  location?: string;
  relevance_notes?: string;
  attendance_status: 'planned' | 'registered' | 'attended' | 'missed';
  people_met?: string;
  post_event_followups?: string;
  owner_id?: string;
  created_at: string;
}

export interface HiringSummary {
  total_agencies: number;
  active_agencies: number;
  underperforming_agencies: number;
  total_cvs_received: number;
  total_candidates: number;
  candidates_by_stage: Record<string, number>;
  candidates_by_position: Record<string, number>;
  reference_calls_this_week: number;
  reference_calls_target: number;
  conferences_this_month: number;
  conferences_target: number;
}

export interface SiteVisit {
  id: string;
  coworking_provider_id: string;
  visit_date?: string;
  attendees?: string;
  observations?: string;
  next_action?: string;
  status: string;
  created_at: string;
}

export interface CoworkingProvider {
  id: string;
  office_location_id: string;
  provider_name: string;
  location_address?: string;
  contact_person?: string;
  contact_details?: string;
  monthly_rent?: number;
  security_deposit?: number;
  facilities?: string;
  capacity?: number;
  proposal_received_date?: string;
  comparison_notes?: string;
  is_selected: boolean;
  agreement_status: string;
  created_at: string;
  site_visits?: SiteVisit[];
}

export interface OfficeLocation {
  id: string;
  city: 'Ahmedabad' | 'Bangalore';
  target_operational_date?: string;
  actual_operational_date?: string;
  status: 'planning' | 'site_selection' | 'agreement' | 'operational';
  bd_target_headcount?: number;
  bd_current_headcount: number;
  providers?: CoworkingProvider[];
  created_at: string;
}

export interface ExpansionSummary {
  locations: OfficeLocation[];
  total_shortlisted_providers: number;
  total_site_visits_conducted: number;
  total_bd_headcount_target: number;
  total_bd_headcount_current: number;
}

export interface ProductMilestone {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  target_date?: string;
  actual_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  owner_id?: string;
  evidence?: string;
  completion_percentage: number;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'PMS' | 'CAT_II_AIF' | 'CAT_III_AIF' | 'Other';
  product_owner_id?: string;
  target_launch_date?: string;
  actual_launch_date?: string;
  status: 'concept' | 'research' | 'development' | 'compliance' | 'ready' | 'launched';
  description?: string;
  milestones?: ProductMilestone[];
  overall_progress_pct?: number;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  entity_type: 'activity' | 'review' | 'conference' | 'site_visit' | 'milestone';
  entity_id: string;
  google_event_id?: string;
  sync_status: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AlertItem {
  id: string;
  type: string;
  severity: 'green' | 'amber' | 'red';
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at?: string;
}

export interface GoalCard {
  id: string;
  goal_code: string;
  name: string;
  owner_name?: string;
  status: string;
  target_completion_date?: string;
  activities_completed: number;
  activities_pending: number;
  activities_overdue: number;
  milestone_completion_pct: number;
  last_updated?: string;
  next_review_date?: string;
}

export interface DashboardKPISummary {
  total_active_goals: number;
  completed_goals: number;
  goals_at_risk: number;
  overdue_activities: number;
  activities_due_this_week: number;
  activities_completed_this_week: number;
  pending_action_items: number;
  weekly_review_compliance: number;
}

export interface DashboardData {
  kpis: DashboardKPISummary;
  goal_cards: GoalCard[];
  alerts: AlertItem[];
  charts: {
    weekly_trend?: Array<{ week: string; planned: number; completed: number }>;
    goal_progress?: Array<{ goal: string; name: string; completion_pct: number; completed: number; pending: number; overdue: number }>;
    team_performance?: Array<{ name: string; assigned: number; completed: number; overdue: number }>;
    task_distribution?: Array<{ name: string; value: number; color: string }>;
    hiring_funnel?: Array<{ stage: string; candidates: number }>;
    city_expansion?: Array<{ city: string; target_bd: number; current_bd: number; providers_shortlisted: number }>;
    product_milestones?: Array<{ product: string; completed_milestones: number; total_milestones: number; progress_pct: number }>;
  };
}

export interface LoginSession {
  id: number;
  user_id: number;
  user_name?: string;
  employee_id?: string;
  ip_address?: string;
  user_agent?: string;
  login_at: string;
  logout_at?: string;
  status: 'active' | 'closed';
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_name?: string;
  employee_id?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  ip_address?: string;
  created_at: string;
  old_value?: string;
  new_value?: string;
}

export interface TeamMemberStats {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  status: string;
  assigned_count: number;
  completed_count: number;
  pending_count: number;
  under_review_count: number;
  overdue_count: number;
  productivity_pct: number;
}

export interface EmployeeDashboardData {
  user: {
    id: number;
    email: string;
    full_name: string;
    employee_id: string;
    department: string;
    designation: string;
    role: string;
    status: string;
  };
  total_assigned: number;
  today_tasks: number;
  pending_tasks: number;
  under_review_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  productivity_pct: number;
  upcoming_deadlines: Activity[];
  recent_submissions: Activity[];
}
