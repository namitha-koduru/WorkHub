# WorkHub – Team Workflow & Event Operations Management System

WorkHub is an enterprise-grade collaborative workflow, project organization, and event operations management platform built on the MERN stack.

---

## 🏛 System Architecture & Hierarchy

```
Organization (Vignan Operations Management)
    └── Workspaces (e.g. Vignan Mahotsav 2027, Technical Symposium)
            └── Rooms (e.g. Technical Team, Public Relations, Hospitality & Logistics)
                    ├── Tasks & Checkpoints (Kanban Drag & Drop with 5 Statuses)
                    ├── Schedules & Milestones (FullCalendar Multi-Scope Engine)
                    ├── Daily Work Standups (Today accomplishments, WIP, blockers & Tomorrow plan)
                    ├── Discussions & Suggestions (Forum thread, Accept/Reject review workflow)
                    ├── Review & Approval Pipeline (To Do → In Progress → Under Review → Completed)
                    └── Real-time Notifications & Audit Activity Trails (Socket.IO)
```

### 5-Tier RBAC Role Hierarchy:
1. **Organization Owner**: Complete governance, billing, workspace creation, member management.
2. **Organization Admin**: Workspace provisioning, administrative invitations, staff oversight.
3. **Workspace Manager**: Workspace scope management, room creation, aggregated workspace reports.
4. **Room Leader**: Department task assignment, approval reviews, room plans, calendar.
5. **Team Member**: Assigned task execution, review requests, daily plan submission.

---

## 📦 Project Structure

```
WorkHub/
├── client/                              # Frontend React application (Vite 6, Tailwind CSS)
│   ├── src/
│   │   ├── api/                         # Axios client with interceptors for all 14 modules
│   │   ├── components/                  # Reusable UI component library
│   │   │   ├── common/                  # Button, Modal, Badge, Avatar, EmptyState
│   │   │   ├── layout/                  # Sidebar, Header, NotificationDropdown
│   │   │   └── modals/                  # TaskModal, ScheduleModal, RoomModal, MemberModal, ApprovalModal
│   │   ├── context/                     # AuthContext, SocketContext
│   │   ├── layouts/                     # AppLayout, WorkspaceLayout, RoomLayout
│   │   └── pages/                       # 18 Integrated Production Pages
│   │       ├── auth/                    # Login (with 1-click Demo buttons), Register
│   │       ├── dashboard/               # PersonalDashboard with Recharts visualizers
│   │       ├── tasks/                   # MyTasksPage (Personal cross-workspace tasks)
│   │       ├── calendar/                # PersonalCalendarPage (FullCalendar)
│   │       ├── planner/                 # DailyPlannerPage (Today/Tomorrow plans & history)
│   │       ├── workspaces/              # Directory, Overview, Calendar, Reports, Members
│   │       ├── rooms/                   # 8 Dedicated Tabs (Overview, Board, List, Calendar, Milestones, Plans, Discussions, Activity)
│   │       └── settings/                # ProfileSettingsPage, OrgSettingsPage
│   ├── tailwind.config.js               # Indigo brand palette, statuses & priorities
│   └── vite.config.js                   # Proxy forwarding /api & /socket.io to :5000
│
├── server/                              # Backend REST API (Node.js, Express, Socket.IO)
│   ├── src/
│   │   ├── config/                      # MongoDB connection, Socket.IO, Env loader
│   │   ├── constants/                   # Roles, TaskStatuses, Priorities, ActivityTypes
│   │   ├── controllers/                 # 15 Modular REST controllers
│   │   ├── middleware/                  # Auth (JWT & HttpOnly), 5-Tier RBAC, Zod validation, ErrorHandler
│   │   ├── models/                      # 17 Normalized Mongoose collections
│   │   ├── routes/                      # Modular REST endpoints mounted under /api/v1
│   │   ├── services/                    # Socket, Notification, Activity logging services
│   │   ├── utils/                       # ApiResponse, ApiError, Seed dataset generator
│   │   └── index.js                     # HTTP Server entry & graceful shutdown
│   └── test/                            # Integration test suite (Node test runner)
│
└── package.json                         # Root orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB (Running locally on `127.0.0.1:27017` or configured via `MONGODB_URI` in `server/.env`)

### 2. Installation
```bash
# Install root, client, and server dependencies
npm run install:all
```

### 3. Database Seeding (Pre-populated Operational Demo)
```bash
# Seed rich demo data (Vignan Mahotsav 2027, Tech Team, PR, realistic tasks, schedules, plans)
npm --prefix server run seed
```

### 4. Running Development Servers
```bash
# Run both Backend API (:5000) and Vite Frontend (:5173) concurrently:
npm run dev

# Or run backend and frontend in separate terminals:
npm run dev:server     # Runs Express with nodemon
npm run dev:client     # Runs Vite React development server
```

### 5. Running Integration Tests
```bash
# Run automated backend test suite
node --test server/test/api.test.js
```

---

## 🔑 Pre-Configured Demo Credentials

The platform includes convenient **One-Click Demo Login** buttons on the `/login` page:

| Role | Name | Email | Password | Scope & Permissions |
|---|---|---|---|---|
| **Org Owner** | Dr. Ramesh Kumar | `admin@workhub.com` | `Password123!` | Full governance, org settings, all workspaces |
| **Workspace Manager** | Priya Sharma | `manager@workhub.com` | `Password123!` | Vignan Mahotsav 2027 manager, room provisioning |
| **Room Leader** | Aditya Verma | `leader@workhub.com` | `Password123!` | Technical Team Leader, task review & approvals |
| **Team Member** | Sneha Patel | `member1@workhub.com` | `Password123!` | Technical Team Engineer, assigned tasks & standups |
| **Team Member** | Vikram Singh | `member2@workhub.com` | `Password123!` | Hospitality Lead & Coordinator |

---

## 📡 REST API Specification Summary (`/api/v1`)

- `POST /api/v1/auth/login` – JWT authentication issuing HttpOnly cookie & token.
- `POST /api/v1/auth/register` – Registration with auto-provisioned organization.
- `GET  /api/v1/auth/me` – Current session, active organization, and roles.
- `GET  /api/v1/workspaces?orgId=...` – List accessible workspaces with progress metrics.
- `GET  /api/v1/rooms?workspaceId=...` – List room departments with leader and task counts.
- `GET  /api/v1/tasks?roomId=...` – Filterable room tasks with checkpoint status.
- `PATCH /api/v1/tasks/:id/status` – Drag-and-drop Kanban status update.
- `GET  /api/v1/schedules/personal` – Multi-scope FullCalendar aggregation (meetings + deadlines).
- `POST /api/v1/daily-plans` – Record today's work (planned, WIP, completed, blockers) and tomorrow's plan.
- `GET  /api/v1/daily-plans/room/:roomId` – Leader inspection of member daily standups.
- `POST /api/v1/approvals/submit` – Task review submission (To Do/In Progress → Under Review).
- `POST /api/v1/approvals/:id/decide` – Leader decision (Approve to Completed or Request Changes).
- `GET  /api/v1/reports/personal` – Personal analytics (Recharts status and priority distribution).
- `GET  /api/v1/reports/workspace/:id` – Workspace room comparative velocity and milestones.
- `GET  /api/v1/notifications` – Real-time notification stream with unread counter.
