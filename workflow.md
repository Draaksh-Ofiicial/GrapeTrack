##  GrapeTrack Backend Workflow (with Supabase, NextAuth & Dynamic RBAC)

---

### 1. **User Authentication & Role-Based Access**

```
[User logs in via NextAuth (Email/Google)]
       ↓
[JWT is generated and stored in session]
       ↓
[Each API request uses middleware to decode token]
       ↓
[Middleware fetches latest role from Supabase]
       ↓
[Permissions checked → access granted or denied]
       ↓
[User is redirected/rendered to their dashboard based on role]
```

---

### 2. **User Roles & Permissions (Dynamic RBAC)**

Roles are stored in Supabase and can be updated any time by Admin.

| Role      | Permissions                                                              |
| --------- | ------------------------------------------------------------------------ |
| Admin     | Invite users, assign roles, manage tasks, view all dashboards            |
| Team Lead | Create tasks, assign to members, review/close tasks, view team dashboard |
| Member    | View assigned tasks, update progress, mark complete, comment             |
| Viewer    | Read-only view of tasks, dashboards                                      |

---

### 3. **Admin Workflow**

```
1. Invite user → POST /api/users/invite
   → Email sent with secure sign-up link
2. Assign or update role → PATCH /api/users/:id/role
   → Role changes are effective immediately
3. View user list → GET /api/users
4. Monitor task distribution → GET /api/dashboard/admin
```

---

### 4. **Team Lead Workflow**

```
1. Create task → POST /api/tasks
   → Includes: title, description, deadline, priority

2. Assign task to member(s) → PATCH /api/tasks/:id/assign
   → Assignee notified via email

3. Track team tasks → GET /api/tasks?team=myteam

4. Review task completion → PATCH /api/tasks/:id/review
   → Mark as reviewed or closed
```

---

### 5. **Member Workflow (Assigned Task Handling)**

```
1. View assigned tasks → GET /api/tasks?assignedTo=me
2. Start working → PATCH /api/tasks/:id/status { status: 'in_progress' }
3. Optionally comment → POST /api/tasks/:id/comments
4. Mark task as done → PATCH /api/tasks/:id/status { status: 'done' }
5. Dashboard tracks deadlines & progress → GET /api/dashboard/member
```

---

### 6. **Task Lifecycle Workflow**

```
[Team Lead/Admin creates task]
       ↓
[Task is assigned to Member(s)]
       ↓
[Email notification sent to assignee(s)]
       ↓
[Task shows up on Member dashboard]
       ↓
[Member changes status to "In Progress"]
       ↓
[Member completes task and marks as "Done"]
       ↓
[Lead/Admin reviews task]
       ↓
[Task status set to "Reviewed" or "Closed"]
       ↓
[Activity log is updated (who did what, when)]
```

---

### 7. **Task Model (Supabase Schema Example)**

```sql
Table: tasks

id             UUID (Primary Key)
title          TEXT
description    TEXT
priority       ENUM('low', 'medium', 'high')
deadline       TIMESTAMP
assigned_to    UUID[] (array of user IDs)
status         ENUM('todo', 'in_progress', 'done', 'reviewed')
created_by     UUID (FK to users)
created_at     TIMESTAMP
updated_at     TIMESTAMP
```

---

### 8. **Email Notifications (via Nodemailer or Supabase)**

Triggers:

* On task assignment
* On task completion
* On user invitation
* (Optional) Daily summary report

Service:

* Use serverless API (e.g., `/api/notifications/email`) from backend.

---

### 9. **Activity Logs & Comments (Optional)**

```
- POST /api/tasks/:id/comments → Add comment with timestamp and user info
- Each task has an activity log array (Supabase `jsonb[]` or relational table)
  → Tracks: status changes, comments, assignments
```

---

### 10. **Dashboard APIs**

```
- /api/dashboard/admin
  → User & task analytics, role breakdown

- /api/dashboard/lead
  → Team progress, open tasks, upcoming deadlines

- /api/dashboard/member
  → Personal tasks, progress timeline

```

---

### 11. **Folder Structure (Next.js API Routes)**

```
/pages/api
  /auth           → login.ts, callback.ts (NextAuth)
  /users          → invite.ts, [id].ts
  /tasks          → index.ts, [id].ts, assign.ts, status.ts, review.ts
  /dashboard      → admin.ts, lead.ts, member.ts
  /comments       → [taskId].ts
  /notifications  → email.ts

/lib
  supabase.ts
  auth.ts
  roles.ts

/middleware
  verifyToken.ts
  checkRole.ts
```
