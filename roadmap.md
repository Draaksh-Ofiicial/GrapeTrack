#  GrapeTrack Backend Roadmap

---

##  Phase 1: Setup & Architecture

- `Next.js API Routes`: More flexibility with Supabase & Drizzle

**Project Initialization:**
- [x] Initialize Firebase or setup Next.js
- [ ] Setup `.env.local` for secrets

**Role-based Constants & Types:**
- The roles and hierarchy will dynamic as admin's choice 
```ts
UserRoles = ['admin', 'teamLead', 'member', 'viewer', 'and many more']
```
- Create reusable type definitions/interfaces

---

##  Phase 2: Auth & Role Management

**Authentication Setup:**
- Own Auth System (Email/Password + Google OAuth)

**Backend Role Middleware:**
- Validate JWT  
- Fetch user from DB  
- Inject user + role into request  or store to session/cookie 
- Restrict access based on role and permission

---

##  Phase 3: User Management APIs

- **Invite User:** `POST /api/users/invite`  
  → Sends one-time join link to email

- **Assign/Update Roles:** `PATCH /api/users/:id/role`

- **List Users:** `GET /api/users?role=&taskCount=`

---

##  Phase 4: Task Lifecycle API

Each task includes:  
`title`, `description`, `deadline`, `priority`, `status`, `assignedTo`, etc.

**Task Endpoints:**
- `POST /api/tasks` → Create (Admin/Lead)  
- `PATCH /api/tasks/:id/assign` → Assign to user  
- `PATCH /api/tasks/:id/status` → Update progress  
- `GET /api/tasks` → List with filters  
- `GET /api/tasks/:id` → View single task  
- `DELETE /api/tasks/:id` → Delete (Admin only)

---

##  Phase 5: Email Notification Integration

**Tools:** Nodemailer

**Triggers:**
- New Task Assigned
- Task Completed  
- User Invited

**Optional:**  
Schedule daily summaries via Firebase Cron Functions

---

##  Phase 6: Dashboard API Routes

- **Admin:** `/api/dashboard/admin`  
  → User stats by role & task distribution

- **Team Lead:** `/api/dashboard/lead`  
  → Assigned team & their progress

- **Member:** `/api/dashboard/member`  
  → Assigned tasks & deadlines

---

##  Phase 7: Comments & Logs

- **Add Comments:** `POST /api/tasks/:id/comments`  
- **Activity Log:** Tracked in `task.activity[]`

---

##  Complete Backend Workflow Summary

1. User Signup/Login  
2. Role Determination  
3. Redirect to Dashboard  
4. View Task Panel  
5. Create Task (Admin/Lead)  
6. Assign Task  
7. Send Email Notification  
8. Member Starts Task  
9. Mark as Done  
10. Admin/Lead Reviews  
11. Close Task  
12. Add Comments / Log Activity  
13. Dashboard Stats

---

##  Suggested Folder Structure (Next.js)

```
/pages/api
    /auth
        login.ts
        register.ts
    /users
        invite.ts
        [id].ts
    /tasks
        index.ts
        [id].ts
        assign.ts
        status.ts
    /dashboard
        admin.ts
        lead.ts
        member.ts
    /notifications
        email.ts
/lib
    auth.ts
    db.ts
    roles.ts
/middleware
    verifyToken.ts
    checkRole.ts
```
