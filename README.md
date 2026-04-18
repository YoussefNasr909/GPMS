# 🎓 GPMS — Graduation Project Management System

A full-stack web platform designed to streamline the management of graduation projects in academic institutions. GPMS connects students, team leaders, teaching assistants (TAs), and doctors (supervisors) under one unified system — covering everything from team formation and task tracking to deliverable submissions and GitHub integration.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Roles](#system-roles)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Modules](#api-modules)
- [GitHub Integration](#github-integration)
- [License](#license)

---

## 🧭 Overview

GPMS is built to replace manual, fragmented graduation project workflows with a centralized, feature-rich platform. It supports the full SDLC lifecycle — from the Requirements phase all the way to Maintenance — and integrates directly with GitHub to automatically sync issues, pull requests, commits, and releases into the system.

---

## ✨ Features

### 👥 Team Management
- Create and discover teams with public/private visibility
- Invite students by user search or shareable invite codes
- Send and manage join requests
- Request supervisors (Doctor / TA) with project descriptions

### 📋 Task Board
- Kanban-style task management (Backlog → To Do → In Progress → Review → Approved → Done)
- Task types: Code, Documentation, Design, Research, Meeting, Presentation
- Priority levels: Low, Medium, High, Critical
- Assign tasks to team members with due dates
- Task review and approval workflow with feedback

### 🔗 GitHub Integration
- Connect a GitHub repository (personal or organization) to a team
- Automatically sync GitHub Issues → GPMS Tasks
- Sync GitHub Releases → GPMS Submissions
- Sync GitHub Activity → Weekly Reports
- Webhook-driven real-time updates
- OAuth-based GitHub user connection

### 📦 Submissions & Deliverables
- Submit project deliverables (SRS, UML, Prototype, Code, Test Plan, Final Report, Presentation)
- Support for manual uploads, GitHub Releases, and GitHub Artifacts
- Submission grading and feedback from supervisors
- Late submission tracking

### 📊 Dashboard & Analytics
- Per-team progress dashboards
- Weekly progress reports
- SDLC stage tracking (Requirements → Design → Implementation → Testing → Deployment → Maintenance)
- Analytics and reporting views

### 📁 Documents & Resources
- Upload and manage team documents (Deliverables, Documentation, Other)
- Share learning resources (Files, Videos, Links, GitHub repos)
- Tag-based organization

### 🗓️ Additional Features
- Calendar & meetings management
- Discussion boards
- Peer reviews & evaluations
- Notifications system
- Risk management view
- Time tracker
- Timeline view
- Gamification dashboard
- FAQ & Help center
- Admin panel for system-wide management
- Full-text search across teams, users, and tasks

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Prisma ORM** | Database access & migrations |
| **PostgreSQL** | Relational database |
| **JSON Web Tokens (JWT)** | Authentication & session management |
| **bcrypt** | Password hashing |
| **Nodemailer** | Email verification & notifications |
| **Octokit** | GitHub API & App integration |
| **Multer** | File uploads |
| **Zod** | Request validation |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **Morgan** | HTTP request logging |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16 (App Router)** | React framework with SSR/SSG |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI** | Accessible headless UI primitives |
| **Framer Motion** | Animations & transitions |
| **Zustand** | Global state management |
| **React Hook Form + Zod** | Form handling & validation |
| **Recharts** | Data visualization & charts |
| **Monaco Editor** | In-browser code editor |
| **next-themes** | Dark/light mode support |
| **Sonner / React Toastify** | Toast notifications |

---

## 👤 System Roles

| Role | Description |
|---|---|
| `STUDENT` | Regular team member; can join teams, work on tasks, submit deliverables |
| `LEADER` | Team creator; manages team settings, invitations, and requests |
| `TA` | Teaching Assistant; supervises teams, reviews submissions |
| `DOCTOR` | Primary supervisor; grades deliverables, oversees project progress |
| `ADMIN` | System administrator; manages all users, teams, and platform settings |

---

## 📁 Project Structure

```
GPMS/
├── GraduationProjectBackend/       # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema & models
│   │   ├── seed.js                 # Development seed data
│   │   ├── huge-seed.js            # Large-scale seed data
│   │   └── migrations/             # Prisma migration history
│   └── src/
│       ├── server.js               # Server entry point
│       ├── app.js                  # Express app configuration
│       ├── config/                 # Environment & app configuration
│       ├── common/                 # Shared utilities & helpers
│       ├── loaders/                # App bootstrapping
│       ├── middlewares/            # Auth, roles, validation, rate limiting
│       ├── routes/                 # Top-level API route registration
│       └── modules/                # Feature modules
│           ├── auth/               # Login, register, verify, OAuth
│           ├── users/              # User profiles & management
│           ├── teams/              # Team CRUD, invitations, join requests
│           ├── tasks/              # Task board & review workflow
│           ├── submissions/        # Deliverable submissions & grading
│           ├── documents/          # Team document management
│           ├── resources/          # Shared learning resources
│           └── github/             # GitHub App & OAuth integration
│
└── GraduationProjectFrontend/      # Next.js App Router frontend
    ├── app/
    │   ├── login/                  # Authentication pages
    │   ├── register/
    │   ├── complete-profile/
    │   ├── oauth/
    │   └── dashboard/              # Main application (protected)
    │       ├── tasks/              # Task management
    │       ├── teams/              # Team discovery & management
    │       ├── my-team/            # Current team overview
    │       ├── submissions/        # Deliverable submissions
    │       ├── github/             # GitHub integration
    │       ├── analytics/          # Analytics & reports
    │       ├── weekly-progress/    # Weekly reports
    │       ├── calendar/           # Calendar & meetings
    │       ├── discussions/        # Discussion boards
    │       ├── peer-reviews/       # Peer evaluation
    │       ├── evaluations/        # Supervisor evaluations
    │       ├── gamification/       # Gamification features
    │       ├── risk-management/    # Risk tracking
    │       ├── sdlc/               # SDLC phase view
    │       ├── timeline/           # Project timeline
    │       ├── time-tracker/       # Time tracking
    │       ├── files/              # File management
    │       ├── resources/          # Learning resources
    │       ├── notifications/      # Notifications
    │       ├── settings/           # User/team settings
    │       ├── profile/            # User profile
    │       ├── search/             # Global search
    │       ├── admin/              # Admin panel
    │       └── users/              # User management
    ├── components/                 # Reusable UI components
    ├── hooks/                      # Custom React hooks
    ├── lib/                        # API clients & utilities
    ├── types/                      # TypeScript type definitions
    ├── data/                       # Static/mock data
    └── styles/                     # Global styles
```

---

## 🗄️ Database Schema

The database is powered by **PostgreSQL** via **Prisma ORM**. Key models include:

| Model | Description |
|---|---|
| `User` | All platform users with roles, OAuth, and academic info |
| `Team` | Project teams with visibility, SDLC stage, and tech stack |
| `TeamMember` | Team membership records |
| `TeamInvitation` | Invitation lifecycle (Pending → Accepted/Declined/Expired) |
| `TeamJoinRequest` | Join request lifecycle (Pending → Approved/Rejected) |
| `TeamSupervisorRequest` | Supervisor assignment requests to Doctors/TAs |
| `Task` | Task board items with GitHub issue/PR sync fields |
| `WeeklyReport` | Weekly progress summaries with GitHub activity |
| `Submission` | Deliverable submissions with grading & review |
| `TeamDocument` | Uploaded team documents |
| `TeamResource` | Shared learning resources |
| `GitHubTeamRepository` | Connected GitHub repo per team |
| `GitHubUserConnection` | Per-user GitHub OAuth token storage |
| `GitHubWebhookDelivery` | Webhook event log for auditing |
| `GitHubSyncCursor` | Sync state cursors for incremental GitHub data fetching |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** ≥ 9
- A **GitHub App** (for GitHub integration features — optional for basic usage)

---

### Backend Setup

1. **Clone the repository and navigate to the backend:**
   ```bash
   cd GraduationProjectBackend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed the database (optional):**
   ```bash
   npm run db:seed
   # For large-scale test data:
   npm run db:huge-seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:4000`.

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd GraduationProjectFrontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your backend URL
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 🔐 Environment Variables

### Backend (`.env`)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: `4000`) | ✅ |
| `NODE_ENV` | Environment (`development` / `production`) | ✅ |
| `CORS_ORIGIN` | Allowed frontend origin | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (use a strong value) | ✅ |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g., `1d`) | ✅ |
| `JWT_REMEMBER_EXPIRES_IN` | "Remember me" token expiry (e.g., `30d`) | ✅ |
| `SMTP_HOST` | SMTP server host | ⚠️ Optional in dev |
| `SMTP_PORT` | SMTP server port | ⚠️ Optional in dev |
| `SMTP_USER` | SMTP sender email | ⚠️ Optional in dev |
| `SMTP_PASS` | SMTP app password | ⚠️ Optional in dev |
| `MAIL_FROM` | Sender name and email | ⚠️ Optional in dev |
| `FRONTEND_URL` | Frontend URL for email links | ✅ |
| `GITHUB_APP_ID` | GitHub App ID | ⚠️ For GitHub features |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App RSA private key | ⚠️ For GitHub features |
| `GITHUB_APP_CLIENT_ID` | GitHub App OAuth client ID | ⚠️ For GitHub features |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App OAuth client secret | ⚠️ For GitHub features |
| `GITHUB_APP_WEBHOOK_SECRET` | Webhook signature verification secret | ⚠️ For GitHub features |
| `GITHUB_TOKEN_ENCRYPTION_SECRET` | Secret for encrypting stored OAuth tokens | ⚠️ For GitHub features |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Public API base path (e.g., `/api/v1`) |
| `BACKEND_URL` | Internal backend URL for server-side requests |

---

## 📜 Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start server with hot-reload (nodemon) |
| `npm start` | Start server in production mode |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:huge-seed` | Seed with large-scale test data |
| `npm test` | Run unit tests |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

---

## 🔌 API Modules

The REST API is versioned under `/api/v1` and organized into the following modules:

| Module | Base Path | Description |
|---|---|---|
| Auth | `/api/v1/auth` | Registration, login, email verification, password reset, OAuth |
| Users | `/api/v1/users` | User profile management |
| Teams | `/api/v1/teams` | Team CRUD, invitations, join requests, supervisor requests |
| Tasks | `/api/v1/tasks` | Task board management and review workflow |
| Submissions | `/api/v1/submissions` | Deliverable submissions and grading |
| Documents | `/api/v1/documents` | Team document uploads |
| Resources | `/api/v1/resources` | Shared learning resources |
| GitHub | `/api/v1/github` | GitHub App installation, OAuth, webhooks, sync |

---

## 🐙 GitHub Integration

GPMS features a deep GitHub integration powered by a **GitHub App**:

1. **Repository Connection** — Teams can link a GitHub repository (user or org) to their GPMS team.
2. **Issue Sync** — GitHub Issues are automatically imported as GPMS Tasks and kept in sync via webhooks.
3. **Pull Request Tracking** — PRs are linked to tasks and their status is reflected in the task board.
4. **Release Sync** — GitHub Releases are imported as project Submissions.
5. **Activity → Weekly Reports** — Commit and PR activity is aggregated into weekly progress reports.
6. **User OAuth** — Individual users can connect their GitHub accounts for personalized activity tracking.

> **Setting up GitHub webhooks locally:**
> Use a webhook proxy like [smee.io](https://smee.io):
> ```bash
> npx smee-client --url https://smee.io/<your-channel> --path /api/v1/github/webhooks/receive --port 4000
> ```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](GraduationProjectFrontend/LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ as a Graduation Project — Faculty of Computers and Artificial Intelligence</sub>
</div>
