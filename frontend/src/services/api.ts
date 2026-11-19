import axios from 'axios';
import {
  User, Goal, Activity, WeeklyReview, HiringAgency, Candidate,
  ProfessionalReference, Conference, HiringSummary, OfficeLocation,
  CoworkingProvider, SiteVisit, ExpansionSummary, Product, ProductMilestone,
  CalendarEvent, Notification, DashboardData, TaskAttachment, LoginSession,
  AuditLogItem, TeamMemberStats, EmployeeDashboardData
} from '../types';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  async loginJson(email: string, password: string) {
    const res = await apiClient.post('/auth/login-json', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
    }
    return res.data;
  },
  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  },
  async changePassword(current_password: string, new_password: string) {
    const res = await apiClient.post('/auth/change-password', {
      current_password,
      new_password,
    });
    return res.data;
  },
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    const res = await apiClient.get<DashboardData>('/dashboard/');
    return res.data;
  },
  async getEmployeeMetrics(): Promise<EmployeeDashboardData> {
    const res = await apiClient.get<EmployeeDashboardData>('/dashboard/employee-metrics');
    return res.data;
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const res = await apiClient.get<Goal[]>('/goals/');
    return res.data;
  },
  async getGoal(id: string): Promise<Goal> {
    const res = await apiClient.get<Goal>(`/goals/${id}`);
    return res.data;
  },
  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const res = await apiClient.post<Goal>('/goals/', data);
    return res.data;
  },
  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    const res = await apiClient.patch<Goal>(`/goals/${id}`, data);
    return res.data;
  },

  // Activities
  async getActivities(params?: { goal_id?: string; assigned_to?: string; status?: string; due?: string; my_tasks?: boolean }): Promise<Activity[]> {
    const res = await apiClient.get<Activity[]>('/activities/', { params });
    return res.data;
  },
  async getActivity(id: string): Promise<Activity> {
    const res = await apiClient.get<Activity>(`/activities/${id}`);
    return res.data;
  },
  async createActivity(data: Partial<Activity>): Promise<Activity> {
    const res = await apiClient.post<Activity>('/activities/', data);
    return res.data;
  },
  async updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
    const res = await apiClient.patch<Activity>(`/activities/${id}`, data);
    return res.data;
  },
  async getActivityUpdates(id: string) {
    const res = await apiClient.get(`/activities/${id}/updates`);
    return res.data;
  },
  async addActivityComment(id: string, content: string) {
    const res = await apiClient.post(`/activities/${id}/comments`, { content });
    return res.data;
  },
  async submitTaskForReview(id: string, submission_notes: string, actual_quantity?: number): Promise<Activity> {
    const res = await apiClient.post<Activity>(`/activities/${id}/submit`, {
      submission_notes,
      actual_quantity: actual_quantity !== undefined ? actual_quantity : 1,
    });
    return res.data;
  },
  async adminReviewTask(
    id: string,
    action: 'approve' | 'reject' | 'request_changes',
    admin_feedback?: string
  ): Promise<Activity> {
    const res = await apiClient.post<Activity>(`/activities/${id}/review`, {
      action,
      admin_feedback: admin_feedback || '',
    });
    return res.data;
  },
  async uploadTaskAttachment(id: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<TaskAttachment>(`/activities/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Hiring
  async getHiringSummary(): Promise<HiringSummary> {
    const res = await apiClient.get<HiringSummary>('/hiring/summary');
    return res.data;
  },
  async getAgencies(params?: { position?: string; status?: string }): Promise<HiringAgency[]> {
    const res = await apiClient.get<HiringAgency[]>('/hiring/agencies', { params });
    return res.data;
  },
  async createAgency(data: Partial<HiringAgency>): Promise<HiringAgency> {
    const res = await apiClient.post<HiringAgency>('/hiring/agencies', data);
    return res.data;
  },
  async updateAgency(id: string, data: Partial<HiringAgency>): Promise<HiringAgency> {
    const res = await apiClient.patch<HiringAgency>(`/hiring/agencies/${id}`, data);
    return res.data;
  },
  async getCandidates(params?: { position?: string; stage?: string; source_type?: string }): Promise<Candidate[]> {
    const res = await apiClient.get<Candidate[]>('/hiring/candidates', { params });
    return res.data;
  },
  async createCandidate(data: Partial<Candidate>): Promise<Candidate> {
    const res = await apiClient.post<Candidate>('/hiring/candidates', data);
    return res.data;
  },
  async updateCandidate(id: string, data: Partial<Candidate>): Promise<Candidate> {
    const res = await apiClient.patch<Candidate>(`/hiring/candidates/${id}`, data);
    return res.data;
  },
  async addCandidateInterview(candidateId: string, data: any) {
    const res = await apiClient.post(`/hiring/candidates/${candidateId}/interviews`, data);
    return res.data;
  },
  async getReferences(): Promise<ProfessionalReference[]> {
    const res = await apiClient.get<ProfessionalReference[]>('/hiring/references');
    return res.data;
  },
  async createReference(data: Partial<ProfessionalReference>): Promise<ProfessionalReference> {
    const res = await apiClient.post<ProfessionalReference>('/hiring/references', data);
    return res.data;
  },
  async updateReference(id: string, data: Partial<ProfessionalReference>): Promise<ProfessionalReference> {
    const res = await apiClient.patch<ProfessionalReference>(`/hiring/references/${id}`, data);
    return res.data;
  },
  async getConferences(): Promise<Conference[]> {
    const res = await apiClient.get<Conference[]>('/hiring/conferences');
    return res.data;
  },
  async createConference(data: Partial<Conference>): Promise<Conference> {
    const res = await apiClient.post<Conference>('/hiring/conferences', data);
    return res.data;
  },
  async updateConference(id: string, data: Partial<Conference>): Promise<Conference> {
    const res = await apiClient.patch<Conference>(`/hiring/conferences/${id}`, data);
    return res.data;
  },

  // Expansion
  async getExpansionSummary(): Promise<ExpansionSummary> {
    const res = await apiClient.get<ExpansionSummary>('/expansion/summary');
    return res.data;
  },
  async getLocations(): Promise<OfficeLocation[]> {
    const res = await apiClient.get<OfficeLocation[]>('/expansion/locations');
    return res.data;
  },
  async updateLocation(id: string, data: Partial<OfficeLocation>): Promise<OfficeLocation> {
    const res = await apiClient.patch<OfficeLocation>(`/expansion/locations/${id}`, data);
    return res.data;
  },
  async getProviders(city?: string): Promise<CoworkingProvider[]> {
    const res = await apiClient.get<CoworkingProvider[]>('/expansion/providers', { params: { city } });
    return res.data;
  },
  async createProvider(data: any): Promise<CoworkingProvider> {
    const res = await apiClient.post<CoworkingProvider>('/expansion/providers', data);
    return res.data;
  },
  async updateProvider(id: string, data: Partial<CoworkingProvider>): Promise<CoworkingProvider> {
    const res = await apiClient.patch<CoworkingProvider>(`/expansion/providers/${id}`, data);
    return res.data;
  },
  async createSiteVisit(data: any): Promise<SiteVisit> {
    const res = await apiClient.post<SiteVisit>('/expansion/site-visits', data);
    return res.data;
  },

  // Products
  async getProducts(category?: string): Promise<Product[]> {
    const res = await apiClient.get<Product[]>('/products/', { params: { category } });
    return res.data;
  },
  async getProduct(id: string): Promise<Product> {
    const res = await apiClient.get<Product>(`/products/${id}`);
    return res.data;
  },
  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await apiClient.post<Product>('/products/', data);
    return res.data;
  },
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const res = await apiClient.patch<Product>(`/products/${id}`, data);
    return res.data;
  },
  async updateProductMilestone(milestoneId: string, data: Partial<ProductMilestone>): Promise<ProductMilestone> {
    const res = await apiClient.patch<ProductMilestone>(`/products/milestones/${milestoneId}`, data);
    return res.data;
  },

  // Weekly Reviews
  async getReviews(): Promise<WeeklyReview[]> {
    const res = await apiClient.get<WeeklyReview[]>('/reviews/');
    return res.data;
  },
  async createReview(data: any): Promise<WeeklyReview> {
    const res = await apiClient.post<WeeklyReview>('/reviews/', data);
    return res.data;
  },
  async updateReview(id: string, data: any): Promise<WeeklyReview> {
    const res = await apiClient.patch<WeeklyReview>(`/reviews/${id}`, data);
    return res.data;
  },

  // Calendar
  async getCalendarStatus() {
    const res = await apiClient.get('/calendar/status');
    return res.data;
  },
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const res = await apiClient.get<CalendarEvent[]>('/calendar/events');
    return res.data;
  },
  async syncCalendar() {
    const res = await apiClient.post('/calendar/sync');
    return res.data;
  },
  async getOAuthConnectUrl() {
    const res = await apiClient.get('/calendar/oauth/connect');
    return res.data;
  },
  async disconnectCalendar() {
    const res = await apiClient.post('/calendar/disconnect');
    return res.data;
  },

  // Notifications
  async getNotifications(unread_only = false): Promise<Notification[]> {
    const res = await apiClient.get<Notification[]>('/notifications/', { params: { unread_only } });
    return res.data;
  },
  async getNotificationCount() {
    const res = await apiClient.get('/notifications/count');
    return res.data;
  },
  async markNotificationRead(id: string) {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },
  async markAllNotificationsRead() {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },
  async triggerAlertRules() {
    const res = await apiClient.post('/notifications/trigger-rules');
    return res.data;
  },

  // Users & Admin Control
  async getUsers(): Promise<User[]> {
    const res = await apiClient.get<User[]>('/users/');
    return res.data;
  },
  async getTeamStats(): Promise<TeamMemberStats[]> {
    const res = await apiClient.get<any>('/users/team-stats');
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data && Array.isArray(res.data.employees)) {
      return res.data.employees;
    }
    return [];
  },
  async adminCreateEmployee(data: {
    email: string;
    full_name: string;
    password?: string;
    employee_id?: string;
    username?: string;
    department?: string;
    designation?: string;
    role?: string;
    permissions_json?: string;
  }): Promise<User> {
    const res = await apiClient.post<User>('/users/', data);
    return res.data;
  },
  async adminUpdateEmployee(id: string | number, data: Partial<User>): Promise<User> {
    const res = await apiClient.patch<User>(`/users/${id}`, data);
    return res.data;
  },
  async adminResetPassword(id: string | number, new_password: string) {
    const res = await apiClient.post(`/users/${id}/reset-password`, { new_password });
    return res.data;
  },
  async adminToggleStatus(id: string | number, status_val: 'active' | 'inactive' | 'suspended') {
    const res = await apiClient.post(`/users/${id}/toggle-status`, null, {
      params: { status_val },
    });
    return res.data;
  },
  async adminDeleteUser(id: string | number) {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
  async inviteUser(email: string, full_name: string, role: string, job_title?: string): Promise<User> {
    const res = await apiClient.post<User>('/users/invite', { email, full_name, role, job_title });
    return res.data;
  },

  // Audit Logs & Activity Monitoring
  async getAuditLogs(params?: { user_id?: number; entity_type?: string; limit?: number }): Promise<AuditLogItem[]> {
    const res = await apiClient.get<AuditLogItem[]>('/audit/', { params });
    return res.data;
  },
  async getLoginSessions(limit = 100): Promise<LoginSession[]> {
    const res = await apiClient.get<LoginSession[]>('/audit/sessions', { params: { limit } });
    return res.data;
  },

  // Reports download helpers
  getExcelExportUrl() {
    return `${API_BASE}/reports/export/excel`;
  },
  getPdfExportUrl() {
    return `${API_BASE}/reports/export/pdf`;
  },
  getCsvExportUrl(entity: string) {
    return `${API_BASE}/reports/export/csv?entity=${entity}`;
  },
};
