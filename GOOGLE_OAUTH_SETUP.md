# ExecFlow — Google Calendar API & OAuth 2.0 Integration Guide

## 1. Overview
ExecFlow features enterprise two-way synchronization between management execution milestones and Google Calendar. Each authorized user can link their corporate Google workspace account to automatically sync:
- **Assigned Activity Deadlines & Follow-ups**
- **Candidate Interviews & Feedback Reviews**
- **Mandatory Saturday Cadence Reviews & Tuesday Fallback Meetings**
- **Coworking Site Visits in Ahmedabad & Bangalore**
- **Bi-weekly Industry Conferences (15-day cadence)**
- **Product Development Gates & Regulatory Submissions**

---

## 2. Google Cloud Platform Setup

### Step 1: Create a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top and select **New Project**.
3. Name the project `ExecFlow-Calendar-Integration` and click **Create**.

### Step 2: Enable the Google Calendar API
1. In your project, go to **APIs & Services** &rarr; **Library**.
2. Search for `Google Calendar API`.
3. Click **Google Calendar API** and select **Enable**.

### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services** &rarr; **OAuth consent screen**.
2. Select **User Type**:
   - **Internal**: If only employees within your Google Workspace organization will use the application.
   - **External**: If testing with non-workspace Gmail accounts (requires adding test users).
3. Fill in the App details:
   - **App name**: `ExecFlow Management Execution System`
   - **User support email**: Your admin/IT email.
   - **Developer contact information**: Your IT email.
4. Click **Save and Continue**.
5. In the **Scopes** step, click **Add or Remove Scopes** and select:
   - `.../auth/calendar` (See, edit, share, and permanently delete all the calendars you can access using Google Calendar)
   - `.../auth/calendar.events` (View and edit events on all your calendars)
   - `.../auth/userinfo.email` (See your primary Google Account email address)
6. In the **Test users** step (if External), add the emails of the team members who will test the calendar integration.
7. Click **Save and Continue**.

### Step 4: Create OAuth 2.0 Client ID Credentials
1. Go to **APIs & Services** &rarr; **Credentials**.
2. Click **Create Credentials** &rarr; **OAuth client ID**.
3. Set **Application type** to `Web application`.
4. Set **Name** to `ExecFlow Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:8000`
   - `http://localhost:5173`
   - `https://your-production-domain.com` (for production)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:8000/api/v1/calendar/oauth/callback`
   - `https://your-production-domain.com/api/v1/calendar/oauth/callback`
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

---

## 3. Configuring ExecFlow Environment Variables

Open `backend/.env` (or set environment variables on your server) and update:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:8000/api/v1/calendar/oauth/callback"
```

---

## 4. How ExecFlow Handles Calendar Synchronization

### Two-Way Mapping & Prevention of Duplicates
- Every event synced to Google Calendar is mapped to a internal record in the `calendar_events` table.
- ExecFlow stores the returned `google_event_id` directly against the database record (`calendar_events.google_event_id`).
- When a task, interview, or review date is updated in ExecFlow, the backend performs an **upsert**:
  - If `google_event_id` exists: Calls `PATCH https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}`.
  - If `google_event_id` does not exist: Calls `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`.

### Token Expiration & Refresh Flow
1. Upon initial OAuth consent, Google issues an `access_token` (valid for 1 hour) and a `refresh_token` (long-lived).
2. Tokens are stored encrypted in the `calendar_credentials` table associated with the user's account.
3. Before every API sync operation, the backend verifies `token_expires_at`.
4. If expired, the backend automatically calls `https://oauth2.googleapis.com/token` with the `refresh_token` to renew access transparently.

### Revocation & Disconnect Handling
- Users can click **Disconnect Account** on the **Settings** or **Calendar** screen at any time.
- The backend sends a revocation request to Google's OAuth endpoint and removes the tokens from the local database.
- The UI status updates immediately to `Offline` and ceases synchronization requests.

### Sandbox / Offline Demo Mode
- If Google credentials are not yet configured or during development, ExecFlow's calendar module includes an automatic **Sandbox Provider**.
- When `GOOGLE_CLIENT_ID` is empty or during demo testing, clicking **Simulate Google Sync** performs full event mapping, conflict resolution, and status tracking locally without requiring network connectivity.
