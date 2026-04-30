# Complete Backend Documentation - MERN Stack
## Graduation Project Management System

**Version:** 2.0  
**Last Updated:** December 2024  
**Tech Stack:** MongoDB, Express.js, React/Next.js, Node.js  
**Purpose:** Comprehensive backend specification for MERN stack implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Architecture (MongoDB)](#database-architecture)
3. [Complete API Specifications](#complete-api-specifications)
4. [Authentication & Authorization](#authentication--authorization)
5. [Business Logic Rules](#business-logic-rules)
6. [Real-time Features](#real-time-features)
7. [File Storage & Management](#file-storage--management)
8. [Gamification System](#gamification-system)
9. [Notification System](#notification-system)
10. [Search & Filtering](#search--filtering)
11. [Analytics & Reporting](#analytics--reporting)
12. [Data Validation Rules](#data-validation-rules)
13. [Performance Requirements](#performance-requirements)
14. [Security Requirements](#security-requirements)
15. [Integration Points](#integration-points)
16. [Testing Strategy](#testing-strategy)
17. [Deployment Specifications](#deployment-specifications)

---

## 1. System Overview

### 1.1 MERN Stack Architecture

\`\`\`
┌─────────────────┐
│   Frontend      │
│   (Next.js 16)  │
│   React 19.2    │
└────────┬────────┘
         │ HTTPS/REST API
┌────────▼────────┐
│  Backend API    │
│  Express.js     │
│  Node.js        │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────┐
    │         │            │          │
┌───▼───┐ ┌──▼──┐ ┌───────▼─┐  ┌────▼────┐
│ Auth  │ │ API │ │WebSocket│  │  Cache  │
│ JWT   │ │Route│ │Socket.io│  │ (Redis) │
└───┬───┘ └──┬──┘ └─────────┘  └─────────┘
    │        │
┌───▼────────▼───────┐
│   MongoDB Atlas    │
│   (NoSQL Database) │
└────────────────────┘
         │
    ┌────┴────┬────────────┐
┌───▼───┐ ┌──▼──┐    ┌────▼────┐
│ AWS   │ │Email│    │Analytics│
│  S3   │ │SMTP │    │ Service │
└───────┘ └─────┘    └─────────┘
\`\`\`

### 1.2 MERN Tech Stack

**Frontend:**
- Next.js 16 (React Framework)
- React 19.2
- TypeScript
- Tailwind CSS v4
- Zustand (State Management)
- SWR (Data Fetching)

**Backend:**
- Node.js 20+ (Runtime)
- Express.js 4+ (Web Framework)
- TypeScript
- Mongoose (MongoDB ODM)

**Database:**
- MongoDB Atlas (Cloud) or Local MongoDB
- Redis (Caching & Sessions)

**Authentication:**
- JWT (Access + Refresh tokens)
- bcryptjs for password hashing
- Passport.js (Optional)

**File Storage:**
- AWS S3 or GridFS (MongoDB file storage)
- Multer for file uploads

**Real-time:**
- Socket.io for WebSocket connections
- Redis Pub/Sub for scaling

**Email:**
- Nodemailer with SMTP
- SendGrid or AWS SES

---

## 2. Database Architecture (MongoDB)

### 2.1 MongoDB Collections Overview

MongoDB uses collections (equivalent to tables) with flexible schemas. Here are all collections:

1. **users** - All system users
2. **teams** - Project teams
3. **tasks** - Task management
4. **proposals** - Project proposals
5. **submissions** - Assignment submissions
6. **meetings** - Meeting records
7. **notifications** - User notifications
8. **activities** - Activity logs
9. **files** - File metadata
10. **discussions** - Discussion threads
11. **comments** - Discussion comments
12. **evaluations** - Project evaluations
13. **reviews** - Peer reviews
14. **achievements** - Gamification achievements
15. **leaderboard** - User rankings
16. **calendar_events** - Calendar events
17. **github_integrations** - GitHub data
18. **analytics** - Analytics data
19. **sessions** - User sessions

---

### 2.2 MongoDB Schema Definitions

#### 2.2.1 Users Collection

\`\`\`javascript
// Mongoose Schema
const userSchema = new mongoose.Schema({
  // Basic Info
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    select: false // Don't return in queries by default
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String, default: null },
  
  // Role & Status
  role: { 
    type: String, 
    enum: ['admin', 'supervisor', 'student', 'teaching_assistant'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'],
    default: 'active' 
  },
  
  // Academic Info
  studentId: { type: String, sparse: true, unique: true },
  department: { type: String },
  major: { type: String },
  year: { type: Number },
  gpa: { type: Number, min: 0, max: 4 },
  
  // Team Association
  teamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team',
    default: null 
  },
  teamRole: { 
    type: String, 
    enum: ['leader', 'member', null],
    default: null 
  },
  
  // Gamification
  gamification: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    achievements: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Achievement' 
    }]
  },
  
  // Preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    customizations: {
      primaryColor: { type: String, default: '#3b82f6' },
      dashboardLayout: { type: String, default: 'default' }
    }
  },
  
  // Security
  refreshToken: { type: String, select: false },
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ teamId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
\`\`\`

#### 2.2.2 Teams Collection

\`\`\`javascript
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  description: { type: String },
  
  // Members
  members: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    role: { 
      type: String, 
      enum: ['leader', 'member'],
      required: true 
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  maxMembers: { type: Number, default: 5 },
  
  // Supervisor
  supervisorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  
  // Project Info
  projectTitle: { type: String },
  projectDescription: { type: String },
  projectType: { 
    type: String, 
    enum: ['web', 'mobile', 'ai', 'data', 'iot', 'other'] 
  },
  techStack: [{ type: String }],
  
  // Status & Progress
  status: { 
    type: String, 
    enum: ['forming', 'active', 'completed', 'archived'],
    default: 'forming' 
  },
  currentPhase: { 
    type: String, 
    enum: ['planning', 'analysis', 'design', 'implementation', 'testing', 'deployment'],
    default: 'planning' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  // GitHub Integration
  githubRepo: { type: String },
  githubStats: {
    commits: { type: Number, default: 0 },
    pullRequests: { type: Number, default: 0 },
    issues: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    lastSync: { type: Date }
  },
  
  // Gamification
  gamification: {
    teamLevel: { type: Number, default: 1 },
    teamXP: { type: Number, default: 0 },
    teamCoins: { type: Number, default: 0 },
    achievements: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Achievement' 
    }]
  },
  
  // Metadata
  semester: { type: String },
  year: { type: Number },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
teamSchema.index({ code: 1 });
teamSchema.index({ supervisorId: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ 'members.userId': 1 });
\`\`\`

---

## 3. Complete API Specifications

### 3.1 Authentication APIs

#### POST /api/auth/register
Register a new user account.

**Request:**
\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "role": "student",
  "studentId": "2021001234",
  "department": "Computer Science",
  "major": "Software Engineering",
  "year": 3
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id_generated",
      "firstName": "John",
      "lastName": "Doe",
      "email": "student@university.edu",
      "role": "student",
      "studentId": "2021001234",
      "avatar": null
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
\`\`\`

**Business Rules:**
- Email must be unique.
- Password complexity: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
- Student ID unique for 'student' role.
- Default values: level=1, xp=0, coins=0, streak=0.
- Welcome email sent.

**Validation:**
\`\`\`typescript
// Example using Joi or similar
const userRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
  role: Joi.string().valid('admin', 'supervisor', 'student', 'teaching_assistant').required(),
  studentId: Joi.string().pattern(/^\d{10}$/).when('role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() }),
  department: Joi.string().optional(),
  major: Joi.string().optional(),
  year: Joi.number().integer().min(1).max(5).optional(),
  // Add more validation as needed
});
\`\`\`

#### POST /api/auth/login
Authenticate user and get tokens.

**Request:**
\`\`\`json
{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id_generated",
      "firstName": "John",
      "lastName": "Doe",
      "email": "student@university.edu",
      "role": "student",
      "avatar": "url_to_avatar.jpg",
      "gamification": {
        "level": 5,
        "xp": 2500,
        "coins": 1200,
        "streak": 7
      }
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
\`\`\`

**Business Rules:**
- Max 5 failed login attempts per user within 15 minutes. Account locked for 15 minutes.
- Update `lastLogin` timestamp.
- Record login event in `analytics` collection.
- Check `status` is 'active'.
- Update `streak` if logging in on consecutive days.

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
\`\`\`json
{
  "refreshToken": "jwt_refresh_token"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 3600
  }
}
\`\`\`

**Business Rules:**
- Verify refresh token validity and ownership.
- Generate and return new access token.
- Optionally, rotate refresh token for enhanced security.

#### POST /api/auth/logout
Invalidate refresh token.

**Request Headers:**
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
**Request Body:**
\`\`\`json
{
  "refreshToken": "jwt_refresh_token"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Logged out successfully"
}
\`\`\`

**Business Rules:**
- Remove or mark refresh token as invalid in storage/database.

#### POST /api/auth/forgot-password
Request password reset email.

**Request:**
\`\`\`json
{
  "email": "student@university.edu"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Password reset email sent if account exists"
}
\`\`\`

**Business Rules:**
- Generate a secure, time-limited password reset token.
- Store token and expiry in user document (e.g., `passwordResetToken`, `passwordResetExpires`).
- Send email with a link containing the token.
- Rate limit: 3 requests per hour per email.

#### POST /api/auth/reset-password
Reset password using token from email.

**Request:**
\`\`\`json
{
  "token": "password_reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Password reset successful"
}
\`\`\`

**Business Rules:**
- Validate token, check expiry, and ensure it matches user.
- Hash and update the user's password.
- Clear password reset token and expiry.
- Update `passwordChangedAt`.

#### POST /api/auth/change-password
Change password for authenticated user.

**Request:**
\`\`\`json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Password changed successfully"
}
\`\`\`

**Business Rules:**
- Verify `currentPassword`.
- Hash and update the user's password.
- Update `passwordChangedAt`.

---

### 3.2 User APIs

#### GET /api/users/me
Get current authenticated user profile.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "student@university.edu",
    "role": "student",
    "avatar": "https://...",
    "studentId": "2021001234",
    "department": "Computer Science",
    "major": "Software Engineering",
    "year": 3,
    "gpa": 3.8,
    "teamId": "team_id", // ObjectId
    "teamRole": "leader",
    "gamification": {
      "level": 5,
      "xp": 2500,
      "coins": 1200,
      "streak": 7,
      "lastActive": "2025-02-14T10:00:00Z",
      "achievements": ["ach_id_1", "ach_id_2"]
    },
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": { ... },
      "customizations": { ... }
    },
    "createdAt": "2024-09-01T10:00:00Z"
  }
}
\`\`\`

#### PUT /api/users/me
Update current user profile.

**Request:**
\`\`\`json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "avatar": "https://new_avatar.jpg",
  "department": "Computer Science",
  "major": "Software Engineering",
  "year": 4,
  "gpa": 3.9,
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "customizations": {
      "primaryColor": "#007bff",
      "dashboardLayout": "compact"
    }
  }
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "avatar": "https://new_avatar.jpg",
    "department": "Computer Science",
    "major": "Software Engineering",
    "year": 4,
    "gpa": 3.9,
    "preferences": { ... }
  }
}
\`\`\`

#### GET /api/users
Get list of users (with filters and pagination).

**Query Parameters:**
\`\`\`
?role=student&department=Computer Science&year=3&page=1&limit=20&search=john&teamId=team_id
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@university.edu",
        "role": "student",
        "avatar": "https://...",
        "department": "Computer Science",
        "major": "Software Engineering",
        "year": 3,
        "teamId": "team_id",
        "teamRole": "member"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalUsers": 100,
      "limit": 20
    }
  }
}
\`\`\`

**Filters:**
- role: Filter by user role
- department: Filter by department
- major: Filter by major
- year: Filter by academic year
- search: Search in firstName, lastName, email, studentId
- teamId: Get users in a specific team
- supervisorId: Get students supervised by a supervisor

#### GET /api/users/:id
Get specific user profile.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "student@university.edu",
    "role": "student",
    "avatar": "https://...",
    "studentId": "2021001234",
    "department": "Computer Science",
    "major": "Software Engineering",
    "year": 3,
    "gpa": 3.8,
    "teamId": "team_id", // ObjectId
    "teamRole": "leader",
    "gamification": {
      "level": 5,
      "xp": 2500,
      "coins": 1200,
      "streak": 7,
      "achievements": [
        {
          "id": "ach1",
          "name": "Task Master",
          "icon": "trophy",
          "unlockedAt": "2025-01-15T10:00:00Z"
        }
      ]
    },
    "createdAt": "2024-09-01T10:00:00Z"
  }
}
\`\`\`

**Authorization:**
- Public profile info (name, avatar, role, team info) visible to all authenticated users.
- Full profile visible to:
  - The user themselves.
  - Their team leader and members (if in the same team).
  - Their supervisor.
  - Admins.

#### GET /api/users/:id/statistics
Get user statistics and analytics.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 45,
      "completed": 38,
      "inProgress": 5,
      "completionRate": 84.4
    },
    "submissions": {
      "total": 8,
      "onTime": 7,
      "late": 1,
      "averageGrade": 87.5
    },
    "meetings": {
      "attended": 18,
      "totalScheduled": 20,
      "attendanceRate": 90
    },
    "gamification": {
      "level": 5,
      "xp": 2500,
      "coins": 1200,
      "streak": 7,
      "achievementsUnlocked": 12,
      "rank": 23 // Global or team-specific rank
    },
    "teamContributions": { // If user is in a team
      "tasksAssigned": 30,
      "tasksCompleted": 25,
      "codeCommits": 156,
      "pullRequests": 23
    }
  }
}
\`\`\`

---

### 3.3 Team APIs

#### POST /api/teams
Create a new team.

**Request:**
\`\`\`json
{
  "name": "Smart Campus IoT",
  "description": "IoT-based campus management system",
  "projectType": "iot",
  "techStack": ["React", "Node.js", "MongoDB", "MQTT"],
  "maxMembers": 6,
  "supervisorId": "supervisor_user_id",
  "semester": "Fall 2024",
  "year": 2024
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "team_id_generated",
    "name": "Smart Campus IoT",
    "code": "SCI456", // Auto-generated unique code
    "description": "IoT-based campus management system",
    "members": [
      {
        "userId": "requesting_user_id", // Leader
        "role": "leader",
        "joinedAt": "timestamp"
      }
    ],
    "maxMembers": 6,
    "supervisorId": "supervisor_user_id",
    "projectType": "iot",
    "techStack": ["React", "Node.js", "MongoDB", "MQTT"],
    "status": "forming",
    "currentPhase": "planning",
    "progress": 0,
    "semester": "Fall 2024",
    "year": 2024,
    "createdAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Creator automatically becomes team leader and is added as the first member.
- Generate a unique, short team code (e.g., "SCI456").
- Default status: "forming".
- Default phase: "planning".
- Default progress: 0.
- Team name must be unique per semester/year.
- Validate `maxMembers` is within allowed range (e.g., 3-6).
- `supervisorId` must be a valid supervisor user.

#### GET /api/teams
Get list of teams with filters.

**Query Parameters:**
\`\`\`
?status=active&projectType=iot&supervisorId=supervisor_id&page=1&limit=20&search=smart&available=true
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "team_id_1",
        "name": "Smart Campus IoT",
        "code": "SCI456",
        "memberCount": 4,
        "maxMembers": 6,
        "supervisor": {
          "id": "supervisor_id",
          "fullName": "Dr. Jane Smith"
        },
        "projectType": "iot",
        "currentPhase": "implementation",
        "progress": 65,
        "semester": "Fall 2024",
        "leader": {
          "id": "leader_user_id",
          "fullName": "John Doe"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTeams": 50,
      "limit": 20
    }
  }
}
\`\`\`

**Filters:**
- status: Filter by team status (forming, active, completed, archived).
- projectType: Filter by project type.
- supervisorId: Filter teams supervised by a specific user.
- available: Show teams with open spots (`memberCount < maxMembers`).
- semester, year: Filter by academic term.
- search: Search in team name, project title, description.

#### GET /api/teams/:id
Get detailed team information.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "team_id",
    "name": "Smart Campus IoT",
    "code": "SCI456",
    "description": "IoT-based campus management system for smart buildings.",
    "members": [
      {
        "userId": { "id": "user_id", "fullName": "John Doe", "avatar": "...", "role": "student", "teamRole": "leader" },
        "joinedAt": "timestamp"
      },
      {
        "userId": { "id": "user_id", "fullName": "Jane Smith", "avatar": "...", "role": "student", "teamRole": "member" },
        "joinedAt": "timestamp"
      }
      // ... other members
    ],
    "maxMembers": 6,
    "supervisor": { "id": "supervisor_id", "fullName": "Dr. Jane Smith", "email": "supervisor@university.edu" },
    "projectTitle": "IoT Smart Campus Monitoring",
    "projectDescription": "Develop an IoT system...",
    "projectType": "iot",
    "techStack": ["React", "Node.js", "MongoDB", "MQTT"],
    "status": "active",
    "currentPhase": "implementation",
    "progress": 65,
    "githubRepo": "https://github.com/org/repo",
    "githubStats": { ... },
    "gamification": { ... },
    "semester": "Fall 2024",
    "year": 2024,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Public teams: Visible to all authenticated users.
- Private/Restricted teams (if implemented): Only visible to members, supervisors, and admins.

#### PUT /api/teams/:id
Update team information.

**Request:**
\`\`\`json
{
  "name": "Smart Campus IoT System",
  "description": "Updated description for the IoT system.",
  "projectType": "iot",
  "techStack": ["React", "Node.js", "MongoDB", "MQTT", "Docker"],
  "currentPhase": "testing",
  "progress": 75,
  "githubRepo": "https://github.com/org/new-repo"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "team_id",
    "name": "Smart Campus IoT System",
    "description": "Updated description for the IoT system.",
    "techStack": ["React", "Node.js", "MongoDB", "MQTT", "Docker"],
    "currentPhase": "testing",
    "progress": 75,
    "githubRepo": "https://github.com/org/new-repo",
    "updatedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Leader: Can update `name`, `description`, `projectType`, `techStack`, `maxMembers`, `githubRepo`.
- Supervisor: Can update `currentPhase`, `progress`.
- Admin: Can update all fields, including `status`, `supervisorId`.

**Business Rules:**
- Changing `currentPhase` should trigger notifications to team members.
- `progress` must be between 0 and 100.
- `status` changes (e.g., to 'completed') should have specific workflows.

#### POST /api/teams/:id/members
Add member to team.

**Request:**
\`\`\`json
{
  "userId": "new_member_user_id",
  "role": "member" // 'leader' role only for transfers
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "teamId": "team_id",
    "userId": "new_member_user_id",
    "role": "member",
    "joinedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Leader of the team only.

**Business Rules:**
- Check if the team has reached `maxMembers`.
- Ensure the `userId` is valid and not already in the team.
- Ensure the user's `teamId` is null or matches the current team.
- Create a notification for the new member.
- Update the user's `teamId` and `teamRole` in the `users` collection.
- Award XP to the leader for team expansion.

#### DELETE /api/teams/:id/members/:userId
Remove member from team.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Member removed successfully"
}
\`\`\`

**Authorization:**
- Leader can remove any member.
- A member can remove themselves (leave team).
- Cannot remove the leader (must transfer leadership first).
- Cannot remove if it's the last member.

**Business Rules:**
- Update `teamId` and `teamRole` for the removed user to null.
- Remove the member from the `members` array in the `teams` collection.
- Create a notification for the removed member.
- Create an activity log entry.

#### POST /api/teams/:id/transfer-leadership
Transfer team leadership to another member.

**Request:**
\`\`\`json
{
  "newLeaderId": "existing_member_user_id"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "teamId": "team_id",
    "oldLeaderId": "current_leader_user_id",
    "newLeaderId": "existing_member_user_id",
    "transferredAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Current leader only.
- Admin can do this for any team.

**Business Rules:**
- The `newLeaderId` must belong to an existing member of the team.
- Update the `role` of the old leader to 'member' and the new leader to 'leader' in the `teams` collection.
- Update the `teamRole` in the `users` collection for both users.
- Send notifications to both users about the leadership change.

#### POST /api/teams/:id/assign-supervisor
Assign supervisor (user with role 'supervisor') to team.

**Request:**
\`\`\`json
{
  "supervisorId": "new_supervisor_user_id"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "teamId": "team_id",
    "oldSupervisorId": "current_supervisor_user_id",
    "newSupervisorId": "new_supervisor_user_id",
    "assignedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Admin only.
- Current supervisor might be able to reassign if rules allow.

**Business Rules:**
- Validate `supervisorId` refers to a user with the 'supervisor' role.
- Check supervisor's capacity if applicable (e.g., max number of teams).
- Update `supervisorId` in the `teams` collection.
- Send notifications to the team and the new supervisor.

#### POST /api/teams/join
Join a team using a unique invite code.

**Request:**
\`\`\`json
{
  "inviteCode": "SCI456"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "teamId": "team_id",
    "userId": "joining_user_id",
    "role": "member",
    "joinedAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Find the team by `inviteCode`.
- Check if the team has available slots (`memberCount < maxMembers`).
- Ensure the user is not already in a team or has left their previous one.
- Add the user as a 'member' to the team's `members` array.
- Update the user's `teamId` and `teamRole` in the `users` collection.
- Create a notification for the team leader about the new member.
- Award XP to the joining member.

#### POST /api/teams/:id/join-requests
Create a join request for a team.

**Request:**
\`\`\`json
{
  "message": "I have 3 years of experience with React and Node.js and am eager to contribute."
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "join_request_id",
    "teamId": "team_id",
    "userId": "requesting_user_id",
    "message": "I have 3 years of experience...",
    "status": "pending",
    "createdAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Users can only request to join a team if they are not already in one.
- Check if the team has available slots.
- Create a new entry in a dedicated `join_requests` collection.
- Notify the team leader and supervisor about the new request.

#### GET /api/teams/:id/join-requests
Get pending join requests for a team.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "join_request_id",
      "user": {
        "id": "requesting_user_id",
        "fullName": "Alice Johnson",
        "avatar": "https://...",
        "role": "student",
        "major": "Frontend Development",
        "year": 3
      },
      "message": "I have 3 years experience with React and Node.js",
      "status": "pending",
      "createdAt": "timestamp"
    }
  ]
}
\`\`\`

**Authorization:**
- Team leader and supervisor of the team only.

#### PUT /api/teams/:id/join-requests/:requestId
Approve or reject a join request.

**Request:**
\`\`\`json
{
  "status": "approved" // or "rejected"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "join_request_id",
    "status": "approved",
    "reviewedBy": "team_leader_user_id",
    "reviewedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Team leader only.

**Business Rules:**
- If 'approved':
  - Add the user to the team as a 'member'.
  - Update the user's `teamId` and `teamRole` in the `users` collection.
  - Check team capacity (`maxMembers`).
  - Send a notification to the requester.
  - Award XP for joining.
- If 'rejected':
  - Update the request status.
  - Send a notification to the requester.

#### DELETE /api/teams/:id
Delete/archive a team.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Team archived successfully"
}
\`\`\`

**Authorization:**
- Team leader or admin only.

**Business Rules:**
- Soft delete: Mark the team as 'archived' by setting a timestamp in `archivedAt` field or updating `status`.
- Cannot archive if active submissions or critical ongoing tasks exist (or require specific handling).
- Notify all team members about the archiving.
- Consider implications for associated data (tasks, proposals, etc.).

---

### 3.4 Task APIs

#### POST /api/tasks
Create a new task.

**Request:**
\`\`\`json
{
  "title": "Implement user authentication",
  "description": "Build JWT-based authentication with refresh tokens using Node.js and Express.js.",
  "teamId": "team_id",
  "assigneeId": "user_id", // Optional
  "priority": "high",
  "estimatedHours": 8,
  "dueDate": "2025-02-20T23:59:59Z",
  "tags": ["backend", "authentication", "jwt"]
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "task_id_generated",
    "title": "Implement user authentication",
    "description": "Build JWT-based authentication...",
    "teamId": "team_id",
    "assigneeId": "user_id",
    "creatorId": "requesting_user_id",
    "status": "todo",
    "priority": "high",
    "estimatedHours": 8,
    "dueDate": "2025-02-20T23:59:59Z",
    "tags": ["backend", "authentication", "jwt"],
    "createdAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Team members can create tasks for their team.
- Supervisors can create tasks for supervised teams.

**Business Rules:**
- Task `status` defaults to 'todo'.
- Assignee must be a member of the team.
- Award XP to the creator.
- Send notification to the assignee if specified.
- Create an activity log entry.

#### GET /api/tasks
Get tasks with filters.

**Query Parameters:**
\`\`\`
?teamId=team_id&status=in-progress,review&assigneeId=user_id&priority=high&tags=backend&sortBy=dueDate&sortOrder=asc&page=1&limit=20
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_id",
        "title": "Implement user authentication",
        "teamId": "team_id",
        "teamName": "Smart Campus IoT", // Populated via join
        "assignee": {
          "id": "user_id",
          "fullName": "Jane Smith",
          "avatar": "https://..."
        },
        "status": "in-progress",
        "priority": "high",
        "estimatedHours": 8,
        "dueDate": "2025-02-20T23:59:59Z",
        "tags": ["backend", "authentication"],
        "createdAt": "timestamp"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTasks": 45,
      "limit": 20
    }
  }
}
\`\`\`

**Filters:**
- teamId: Tasks for a specific team.
- assigneeId: Tasks assigned to a user.
- creatorId: Tasks created by a user.
- status: Filter by one or more statuses (e.g., `in-progress,review`).
- priority: Filter by one or more priorities.
- tags: Filter by one or more tags.
- overdue: Boolean, filter for tasks where `dueDate` is past and `status` is not 'done'.
- search: Search in title and description.
- sortBy, sortOrder: e.g., `dueDate`, `priority`, `createdAt`; `asc`, `desc`.

#### GET /api/tasks/:id
Get task details.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "task_id",
    "title": "Implement user authentication",
    "description": "Build JWT-based authentication with refresh tokens using Node.js and Express.js.",
    "teamId": "team_id",
    "team": {
      "id": "team_id",
      "name": "Smart Campus IoT"
    },
    "assignee": {
      "id": "user_id",
      "fullName": "Jane Smith",
      "avatar": "https://...",
      "role": "student",
      "teamRole": "member"
    },
    "creator": {
      "id": "creator_user_id",
      "fullName": "John Doe"
    },
    "status": "in-progress",
    "priority": "high",
    "estimatedHours": 8,
    "actualHours": 5, // Time spent
    "dueDate": "2025-02-20T23:59:59Z",
    "tags": ["backend", "authentication", "jwt"],
    "dependencies": ["task_id_of_dependency"], // Array of task IDs
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
\`\`\`

#### PUT /api/tasks/:id
Update task.

**Request:**
\`\`\`json
{
  "title": "Implement user authentication (Updated)",
  "description": "Updated description...",
  "assigneeId": "new_assignee_user_id",
  "status": "review",
  "priority": "critical",
  "estimatedHours": 10,
  "actualHours": 6,
  "dueDate": "2025-02-22T23:59:59Z",
  "tags": ["backend", "authentication", "jwt", "oauth"]
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "task_id",
    "title": "Implement user authentication (Updated)",
    "status": "review",
    "updatedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Assignee: Can update `status`, `actualHours`.
- Creator, Team Leader, Supervisor: Can update all fields.

**Business Rules:**
- If `status` changes to 'done':
  - Award XP to the assignee.
  - Check if any tasks depend on this one and update their status or notify.
  - Potentially update team progress.
  - Create a notification for the creator/leader.
- If `assigneeId` changes:
  - Notify the old and new assignee.
- If `status` changes to 'review':
  - Notify the creator or leader for review.
- Create an activity log entry for any significant change.

#### DELETE /api/tasks/:id
Delete task (soft delete).

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Task archived successfully"
}
\`\`\`

**Authorization:**
- Creator, Team Leader, or Admin only.

**Business Rules:**
- Mark the task as deleted or archived (e.g., add `deletedAt` timestamp or change `status` to 'archived').
- Remove this task from the `dependencies` of other tasks.
- If the task was assigned, notify the assignee.

#### GET /api/tasks/:id/history
Get task change history.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "history_id",
      "field": "status",
      "oldValue": "todo",
      "newValue": "in-progress",
      "changedBy": {
        "id": "user_id",
        "fullName": "Jane Smith"
      },
      "timestamp": "2025-02-15T14:30:00Z"
    },
    {
      "id": "history_id",
      "field": "assigneeId",
      "oldValue": null,
      "newValue": "user_id",
      "changedBy": {
        "id": "user_id",
        "fullName": "John Doe"
      },
      "timestamp": "2025-02-14T10:00:00Z"
    }
  ]
}
\`\`\`

---

### 3.5 Proposal APIs

#### POST /api/proposals
Create or update a team's project proposal.

**Request:**
\`\`\`json
{
  "teamId": "team_id",
  "projectTitle": "IoT Smart Campus Monitoring System",
  "problemStatement": "Current campus facility management relies on manual checks, leading to inefficiencies and slow response times.",
  "objectives": [
    "Develop an IoT-based system for real-time monitoring of campus utilities.",
    "Provide a web dashboard for visualizing sensor data and system status.",
    "Implement alerts for anomalies and maintenance needs."
  ],
  "scope": "The system will initially cover the main administrative building and the student dormitory, collecting data from temperature, humidity, and occupancy sensors.",
  "techStack": ["React", "Node.js", "MongoDB", "MQTT", "Arduino"],
  "risks": [
    {
      "risk": "Sensor data accuracy and calibration issues.",
      "mitigation": "Use redundant sensors and implement data validation algorithms.",
      "severity": "medium"
    },
    {
      "risk": "Network connectivity for IoT devices in all areas.",
      "mitigation": "Conduct site surveys and deploy Wi-Fi extenders if necessary.",
      "severity": "high"
    }
  ],
  "milestones": [
    {
      "title": "Requirements Finalization",
      "targetDate": "2025-01-15T23:59:59Z"
    },
    {
      "title": "System Architecture Design",
      "targetDate": "2025-02-01T23:59:59Z"
    },
    {
      "title": "Core Feature Implementation",
      "targetDate": "2025-03-15T23:59:59Z"
    }
  ]
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "proposal_id_generated",
    "teamId": "team_id",
    "version": 1,
    "status": "draft",
    "projectTitle": "IoT Smart Campus Monitoring System",
    "problemStatement": "Current campus facility management...",
    "objectives": [...],
    "scope": "The system will initially cover...",
    "techStack": ["React", "Node.js", "MongoDB", "MQTT", "Arduino"],
    "risks": [...],
    "milestones": [
      {
        "title": "Requirements Finalization",
        "targetDate": "2025-01-15T23:59:59Z",
        "completed": false
      },
      // ... other milestones
    ],
    "submittedAt": null,
    "approvedAt": null,
    "approvedBy": null,
    "createdAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Team leader and members can create/update proposals in 'draft' status.
- Only the team leader can submit a proposal.

**Business Rules:**
- Each team has one active proposal.
- Versioning is handled implicitly; updates create a new revision.
- Submitting locks the proposal for editing until feedback is given or it's approved/rejected.
- Award XP for proposal submission.
- Notify supervisors upon submission.

#### GET /api/proposals
Get proposals with filters.

**Query Parameters:**
\`\`\`
?teamId=team_id&status=approved&supervisorId=supervisor_id&page=1&limit=20
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "proposal_id",
        "team": {
          "id": "team_id",
          "name": "Smart Campus IoT",
          "leader": { "id": "leader_id", "fullName": "John Doe" }
        },
        "version": 2,
        "status": "approved",
        "projectTitle": "IoT Smart Campus Monitoring System",
        "submittedAt": "2025-01-20T10:00:00Z",
        "approvedAt": "2025-01-25T14:30:00Z",
        "approvedBy": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" }
      }
    ],
    "pagination": { ... }
  }
}
\`\`\`

**Filters:**
- teamId: Proposals for a specific team.
- status: Filter by proposal status (draft, submitted, feedback-requested, revised, approved, rejected).
- supervisorId: Proposals supervised by a specific user.
- year, semester: Filter by academic term.

#### GET /api/proposals/:id
Get detailed proposal.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "proposal_id",
    "team": {
      "id": "team_id",
      "name": "Smart Campus IoT",
      "leader": { "id": "leader_id", "fullName": "John Doe" }
    },
    "version": 2,
    "status": "approved",
    "projectTitle": "IoT Smart Campus Monitoring System",
    "problemStatement": "Current campus facility management...",
    "objectives": [...],
    "scope": "The system will initially cover...",
    "techStack": ["React", "Node.js", "MongoDB", "MQTT", "Arduino"],
    "risks": [
      { "risk": "Sensor data accuracy...", "mitigation": "Use redundant sensors...", "severity": "medium" }
      // ... other risks
    ],
    "milestones": [
      {
        "title": "Requirements Finalization",
        "targetDate": "2025-01-15T23:59:59Z",
        "completed": true,
        "completedAt": "2025-01-14T16:00:00Z" // Timestamp when marked complete
      }
      // ... other milestones
    ],
    "reviewComments": [ // Comments from supervisors
      {
        "id": "comment_id",
        "author": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" },
        "content": "Excellent problem statement. Please clarify the expected data throughput.",
        "resolved": true,
        "resolvedBy": "leader_id",
        "createdAt": "2025-01-21T14:30:00Z"
      }
    ],
    "submittedAt": "2025-01-20T10:00:00Z",
    "approvedAt": "2025-01-25T14:30:00Z",
    "approvedBy": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" }
  }
}
\`\`\`

#### PUT /api/proposals/:id/status
Update proposal status (submit, request feedback, approve, reject).

**Request:**
\`\`\`json
{
  "status": "submitted" // or "feedback-requested", "approved", "rejected"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "proposal_id",
    "status": "submitted",
    "submittedAt": "timestamp" // Set only when status becomes 'submitted'
  }
}
\`\`\`

**Authorization:**
- Leader: Can change status from 'draft' to 'submitted'.
- Supervisor: Can change status from 'submitted' to 'feedback-requested', 'approved', or 'rejected'.
- If 'feedback-requested', team leader can respond and change status back to 'revised'.
- If 'revised', it can be resubmitted ('submitted').

**Business Rules:**
- Strict status transition workflow.
- Approval of proposal might trigger updates to team's `currentPhase` or other related fields.
- Award XP for proposal approval.
- Send notifications to team members and supervisor upon status changes.

#### POST /api/proposals/:id/comments
Add a review comment to a proposal.

**Request:**
\`\`\`json
{
  "content": "Please elaborate on the security measures for IoT devices."
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "comment_id_generated",
    "proposalId": "proposal_id",
    "author": { "id": "user_id", "fullName": "Dr. Jane Smith" },
    "content": "Please elaborate on the security measures...",
    "resolved": false,
    "createdAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Supervisors can add comments.
- Team members can potentially reply to supervisor comments.

#### PUT /api/proposals/:id/comments/:commentId
Update a comment (e.g., mark as resolved).

**Request:**
\`\`\`json
{
  "resolved": true
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "comment_id",
    "resolved": true,
    "resolvedBy": "user_id", // The user who resolved it (e.g., team leader)
    "resolvedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Comment author or team leader/supervisor.

---

### 3.6 Submission APIs

#### POST /api/submissions
Create a new submission for a deliverable.

**Request (multipart/form-data):**
\`\`\`
teamId: team_id
deliverableType: srs // e.g., 'srs', 'prototype', 'code', 'final-report'
deadline: 2025-02-20T23:59:59Z
file: [file upload] // The actual file
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "submission_id_generated",
    "teamId": "team_id",
    "deliverableType": "srs",
    "version": 1,
    "fileUrl": "https://s3-bucket/submissions/team_id/submission_id_generated.pdf",
    "fileSize": 2048576, // in bytes
    "fileType": "pdf",
    "submittedAt": "2025-02-18T15:30:00Z",
    "deadline": "2025-02-20T23:59:59Z",
    "late": false,
    "grade": null,
    "feedback": null,
    "gradedAt": null,
    "gradedBy": null // Reference to supervisor user ID
  }
}
\`\`\`

**Authorization:**
- Team members (leader or regular member) can submit.

**Business Rules:**
- Check if a submission of this `deliverableType` already exists for the team. If so, consider it a resubmission and increment `version`.
- Determine if `late` is true based on `submittedAt` vs `deadline`.
- Award XP (potentially reduced if late).
- Create a notification for the supervisor(s).
- Create an activity log entry.
- Store file in S3 or GridFS.

#### GET /api/submissions
Get submissions with filters.

**Query Parameters:**
\`\`\`
?teamId=team_id&deliverableType=srs&late=false&graded=true&page=1&limit=20
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "submission_id",
        "team": { "id": "team_id", "name": "Smart Campus IoT" },
        "deliverableType": "srs",
        "version": 1,
        "submittedAt": "2025-02-18T15:30:00Z",
        "deadline": "2025-02-20T23:59:59Z",
        "late": false,
        "grade": 95.5,
        "feedback": "Comprehensive requirements document. Well-structured.",
        "gradedAt": "2025-02-22T10:00:00Z",
        "gradedBy": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" }
      }
    ],
    "pagination": { ... }
  }
}
\`\`\`

**Filters:**
- teamId: Submissions by team.
- deliverableType: Filter by deliverable type.
- late: Boolean, filter for late or on-time submissions.
- graded: Boolean, filter for graded or ungraded submissions.
- supervisorId: Filter submissions overseen by a specific supervisor.
- dateFrom, dateTo: Date range for submission or grading.

#### GET /api/submissions/:id
Get submission details.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "submission_id",
    "team": {
      "id": "team_id",
      "name": "Smart Campus IoT",
      "leader": { "id": "leader_id", "fullName": "John Doe" }
    },
    "deliverableType": "srs",
    "version": 1,
    "fileUrl": "https://s3-bucket/submissions/...",
    "fileSize": 2048576,
    "fileType": "pdf",
    "submittedAt": "2025-02-18T15:30:00Z",
    "deadline": "2025-02-20T23:59:59Z",
    "late": false,
    "grade": 95.5,
    "feedback": "Comprehensive requirements document. Well-structured.",
    "gradedAt": "2025-02-22T10:00:00Z",
    "gradedBy": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" },
    "evaluations": [ // Associated evaluations if any
      {
        "id": "eval_id",
        "evaluator": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" },
        "finalGrade": 95.5,
        "status": "finalized",
        "rubric": { "id": "rubric_id", "name": "SRS Rubric" }
      }
    ]
  }
}
\`\`\`

#### PUT /api/submissions/:id/grade
Grade a submission.

**Request:**
\`\`\`json
{
  "grade": 95.5,
  "feedback": "Comprehensive requirements document. Well-structured. Consider adding more detail on scalability."
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "submission_id",
    "grade": 95.5,
    "feedback": "Comprehensive requirements document...",
    "gradedAt": "2025-02-22T10:00:00Z",
    "gradedBy": "supervisor_id" // Reference to the supervisor user ID
  }
}
\`\`\`

**Authorization:**
- Supervisors only.

**Business Rules:**
- `grade` must be between 0 and 100.
- Award XP based on the grade received (e.g., `XP = baseXP * (grade / 100)`).
- Create a notification for the team about the graded submission.
- Potentially update team progress.
- Cannot change grade after it's finalized or after a certain period (unless admin).

#### DELETE /api/submissions/:id
Delete a submission.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Submission deleted successfully"
}
\`\`\`

**Authorization:**
- Team leader before the deadline.
- Supervisor or Admin anytime.

---

### 3.7 Evaluation & Rubric APIs

#### POST /api/rubrics
Create an evaluation rubric.

**Request:**
\`\`\`json
{
  "name": "Project Proposal Rubric 2024",
  "type": "proposal", // e.g., 'proposal', 'midterm', 'final', 'presentation'
  "description": "Criteria for evaluating project proposals.",
  "criteria": [
    {
      "name": "Problem Statement Clarity",
      "description": "How well the problem is defined and its relevance.",
      "weight": 20,
      "maxScore": 20
    },
    {
      "name": "Technical Approach Viability",
      "description": "Appropriateness and feasibility of the chosen technologies and methodology.",
      "weight": 25,
      "maxScore": 25
    },
    {
      "name": "Project Scope and Objectives",
      "description": "Clarity, achievability, and alignment of project goals.",
      "weight": 15,
      "maxScore": 15
    },
    {
      "name": "Risk Assessment and Mitigation",
      "description": "Identification of potential risks and proposed mitigation strategies.",
      "weight": 10,
      "maxScore": 10
    },
    {
      "name": "Milestone Planning",
      "description": "Realism and completeness of the project timeline.",
      "weight": 10,
      "maxScore": 10
    },
    {
      "name": "Team Composition and Roles",
      "description": "Adequacy of team skills and defined roles.",
      "weight": 10,
      "maxScore": 10
    },
    {
      "name": "Overall Presentation and Clarity",
      "description": "Quality of written and oral presentation.",
      "weight": 10,
      "maxScore": 10
    }
  ]
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "rubric_id_generated",
    "name": "Project Proposal Rubric 2024",
    "type": "proposal",
    "description": "Criteria for evaluating project proposals.",
    "criteria": [
      { "id": "criterion_id_1", "name": "Problem Statement Clarity", ... },
      // ... other criteria objects
    ],
    "totalWeight": 100,
    "isActive": true,
    "createdBy": "supervisor_user_id",
    "createdAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Supervisors and Admins only.

**Business Rules:**
- `totalWeight` is calculated from the sum of `weight` of all criteria. It should ideally sum to 100 but can be flexible.
- `maxScore` defines the maximum points for each criterion.
- `isActive` flag to enable/disable rubrics.

#### GET /api/rubrics
Get list of rubrics.

**Query Parameters:**
\`\`\`
?type=proposal&isActive=true
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "rubric_id",
      "name": "Project Proposal Rubric 2024",
      "type": "proposal",
      "isActive": true,
      "criteriaCount": 7,
      "createdAt": "timestamp"
    }
  ]
}
\`\`\`

#### POST /api/evaluations
Create an evaluation for a submission using a rubric.

**Request:**
\`\`\`json
{
  "submissionId": "submission_id",
  "rubricId": "rubric_id",
  "scores": [ // Array of scores for each criterion
    {
      "criterionId": "criterion_id_1", // From the selected rubric
      "score": 18,
      "comment": "Problem statement is clear and relevant."
    },
    {
      "criterionId": "criterion_id_2",
      "score": 22,
      "comment": "Good choice of technologies."
    }
    // ... scores for all criteria
  ],
  "status": "finalized" // or "draft"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "evaluation_id_generated",
    "submissionId": "submission_id",
    "rubricId": "rubric_id",
    "evaluatorId": "supervisor_user_id", // The user creating the evaluation
    "scores": [
      { "criterionId": "criterion_id_1", "score": 18, "comment": "..." },
      // ...
    ],
    "finalGrade": 92.5, // Calculated based on scores and rubric weights
    "status": "finalized",
    "createdAt": "timestamp",
    "finalizedAt": "timestamp" // Set if status is 'finalized'
  }
}
\`\`\`

**Authorization:**
- Supervisors only.

**Business Rules:**
- `finalGrade` is calculated based on `scores` and the `weight` and `maxScore` defined in the `rubric`.
- If `status` is 'finalized', the evaluation is locked.
- Update the corresponding `submission` document with `grade`, `feedback`, `gradedAt`, and `gradedBy`.
- Award XP to the evaluator based on the finalized grade.
- Create a notification for the team.

#### GET /api/evaluations
Get evaluations with filters.

**Query Parameters:**
\`\`\`
?submissionId=submission_id&evaluatorId=supervisor_id&status=finalized
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "evaluation_id",
      "submission": { "id": "submission_id", "deliverableType": "srs", "team": { "id": "team_id", "name": "Smart Campus IoT" } },
      "rubric": { "id": "rubric_id", "name": "SRS Rubric" },
      "evaluator": { "id": "supervisor_id", "fullName": "Dr. Jane Smith" },
      "finalGrade": 92.5,
      "status": "finalized",
      "createdAt": "timestamp"
    }
  ]
}
\`\`\`

---

### 3.8 Meeting APIs

#### POST /api/meetings
Create a meeting.

**Request:**
\`\`\`json
{
  "teamId": "team_id",
  "title": "Sprint Planning Meeting",
  "agenda": "Plan tasks for sprint X. Review progress on feature Y.",
  "startTime": "2025-02-20T14:00:00Z",
  "durationMinutes": 60,
  "location": "Room 301",
  "meetingLink": "https://zoom.us/j/123456789",
  "attendees": ["user_id_1", "user_id_2", "supervisor_id"], // Array of user IDs
  "isRecurring": true,
  "recurrencePattern": "weekly", // e.g., 'weekly', 'biweekly', 'monthly'
  "recurrenceEndDate": "2025-04-30T23:59:59Z" // Optional end date for recurring meetings
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "meeting_id_generated",
    "teamId": "team_id",
    "title": "Sprint Planning Meeting",
    "agenda": "Plan tasks for sprint X...",
    "startTime": "2025-02-20T14:00:00Z",
    "durationMinutes": 60,
    "location": "Room 301",
    "meetingLink": "https://zoom.us/j/123456789",
    "isRecurring": true,
    "recurrencePattern": "weekly",
    "createdBy": "requesting_user_id",
    "createdAt": "timestamp"
    // Attendees list might be populated via a separate attendee sub-document or embedded
  }
}
\`\`\`

**Authorization:**
- Team members and supervisors can create meetings.

**Business Rules:**
- For recurring meetings, generate instances based on the pattern and end date.
- Create notifications for all attendees (except the organizer).
- Add event to attendees' calendars (via integration or internal calendar system).
- Award XP to the meeting organizer.

#### GET /api/meetings
Get meetings with filters.

**Query Parameters:**
\`\`\`
?teamId=team_id&userId=user_id&startTimeFrom=2025-02-14&startTimeTo=2025-02-28&upcoming=true
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "meeting_id",
      "team": { "id": "team_id", "name": "Smart Campus IoT" },
      "title": "Sprint Planning Meeting",
      "startTime": "2025-02-20T14:00:00Z",
      "durationMinutes": 60,
      "location": "Room 301",
      "attendeeCount": 4,
      "myStatus": "accepted", // Status for the requesting user
      "hasNotes": true,
      "isRecurring": true
    }
  ]
}
\`\`\`

**Filters:**
- teamId: Meetings for a specific team.
- userId: Meetings the user is attending or organized.
- startTimeFrom, startTimeTo: Date range for meetings.
- upcoming: Boolean, filter for future meetings.
- past: Boolean, filter for past meetings.

#### GET /api/meetings/:id
Get meeting details.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "meeting_id",
    "team": { "id": "team_id", "name": "Smart Campus IoT" },
    "title": "Sprint Planning Meeting",
    "agenda": "Plan tasks for sprint X. Review progress on feature Y.",
    "startTime": "2025-02-20T14:00:00Z",
    "durationMinutes": 60,
    "location": "Room 301",
    "meetingLink": "https://zoom.us/j/123456789",
    "attendees": [
      {
        "userId": { "id": "user_id", "fullName": "John Doe", "avatar": "..." },
        "status": "accepted", // invited, accepted, declined, attended
        "respondedAt": "timestamp"
      }
      // ... other attendees
    ],
    "notes": "Discussed requirements for Feature Y. Decision to use React hooks for state management.",
    "decisions": ["Use React hooks for state management."],
    "actionItems": [
      {
        "id": "action_item_id",
        "description": "Implement Feature Y UI components.",
        "assignee": { "id": "user_id", "fullName": "Jane Smith" },
        "completed": false,
        "dueDate": "2025-02-25T23:59:59Z"
      }
    ],
    "recordingUrl": "https://...", // Optional link to recording
    "isRecurring": true,
    "recurrencePattern": "weekly",
    "createdBy": { "id": "requesting_user_id", "fullName": "John Doe" },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
\`\`\`

#### PUT /api/meetings/:id
Update meeting.

**Request:**
\`\`\`json
{
  "title": "Sprint Planning Meeting (Revised)",
  "startTime": "2025-02-20T15:00:00Z", // Changed time
  "notes": "Meeting notes: Discussed requirements for Feature Y. Decision to use React hooks for state management.",
  "decisions": ["Use React hooks for state management."],
  "actionItems": [
    {
      "description": "Implement Feature Y UI components.",
      "assigneeId": "user_id",
      "dueDate": "2025-02-25T23:59:59Z"
    }
  ]
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "meeting_id",
    "title": "Sprint Planning Meeting (Revised)",
    "startTime": "2025-02-20T15:00:00Z",
    "notes": "Meeting notes: ...",
    "updatedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Meeting creator, team leader, or supervisor.

**Business Rules:**
- Notify attendees of significant changes (time, date, agenda).
- Update related action items or decisions if modified.

#### PUT /api/meetings/:id/attendance
Update attendance status for a meeting.

**Request:**
\`\`\`json
{
  "status": "accepted" // or "declined", "attended"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "meetingId": "meeting_id",
    "userId": "user_id", // The user whose status is updated
    "status": "accepted",
    "respondedAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Update the attendance status for the specified user.
- If status is 'attended', award XP.
- This is typically done by the user themselves or by an admin/organizer.

#### DELETE /api/meetings/:id
Cancel a meeting.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Meeting cancelled successfully"
}
\`\`\`

**Authorization:**
- Meeting creator, team leader, or supervisor.

**Business Rules:**
- Soft delete: Mark the meeting as cancelled (e.g., `cancelledAt` timestamp or update `status`).
- Notify all attendees about the cancellation.
- Remove from calendars if possible.

---

### 3.9 Notification APIs

#### GET /api/notifications
Get user notifications.

**Query Parameters:**
\`\`\`
?read=false&type=task&page=1&limit=20&sortBy=createdAt&sortOrder=desc
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "userId": "user_id",
        "type": "task_assigned",
        "title": "New task assigned",
        "content": "John Doe assigned you: Implement user authentication",
        "message": null, // Additional detailed message if needed
        "read": false,
        "actionUrl": "/dashboard/tasks/task_id", // Deep link to relevant content
        "relatedEntityType": "task",
        "relatedEntityId": "task_id",
        "createdAt": "timestamp"
      }
    ],
    "pagination": { ... },
    "unreadCount": 5
  }
}
\`\`\`

**Filters:**
- read: Filter by read status (true/false).
- type: Filter by notification type (e.g., 'task_assigned', 'submission_graded').
- dateFrom, dateTo: Filter by date range.

#### PUT /api/notifications/:id/read
Mark a notification as read.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "notification_id",
    "read": true
  }
}
\`\`\`

#### PUT /api/notifications/read-all
Mark all notifications as read for the current user.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "All notifications marked as read"
}
\`\`\`

#### DELETE /api/notifications/:id
Delete a notification.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Notification deleted"
}
\`\`\`

---

### 3.10 Chat/Messaging APIs

#### POST /api/messages
Send a message (real-time via WebSocket, but API endpoint needed for history/initialization).

**Request:**
\`\`\`json
{
  "channelId": "team_team_id", // e.g., "team_team_id", "direct_user_id"
  "content": "Hey, can you review my PR for the authentication module?",
  "messageType": "text", // 'text', 'file', 'image', 'system'
  "replyToId": "message_id_to_reply_to" // Optional
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "message_id_generated",
    "channelId": "team_team_id",
    "senderId": "sender_user_id",
    "content": "Hey, can you review my PR...",
    "messageType": "text",
    "replyToId": "message_id_to_reply_to",
    "timestamp": "timestamp",
    "edited": false,
    "deleted": false
  }
}
\`\`\`

**Business Rules:**
- Primarily handled via WebSocket (`socket.emit('sendMessage', payload)`).
- API endpoint might be used for initial message history retrieval or sending when WebSocket is unavailable.
- Create notification if recipient is offline.
- Award XP for communication (e.g., sending messages).

#### GET /api/messages
Get messages for a channel or direct conversation.

**Query Parameters:**
\`\`\`
?channelId=team_team_id&limit=50&beforeMessageId=message_id_to_fetch_before
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message_id",
        "channelId": "team_team_id",
        "sender": {
          "id": "sender_user_id",
          "fullName": "John Doe",
          "avatar": "https://..."
        },
        "content": "Hey, can you review my PR?",
        "messageType": "text",
        "replyTo": { // If it's a reply
          "id": "message_id_to_reply_to",
          "content": "Sure, I'll look at it after lunch.",
          "sender": { "id": "other_user_id", "fullName": "Jane Smith" }
        },
        "reactions": [ // Aggregate reactions
          { "emoji": "👍", "users": ["user_id_1", "user_id_2"] }
        ],
        "timestamp": "timestamp",
        "edited": false,
        "readBy": ["user_id_1"], // List of user IDs who have read this message
        "isOwnMessage": true // Helper flag for the client
      }
    ],
    "hasMore": true // Indicates if there are older messages
  }
}
\`\`\`

**Pagination:**
- Use `beforeMessageId` to fetch messages preceding a specific message (for scrolling back).
- Use `afterMessageId` for fetching newer messages (less common, usually WebSocket handles real-time).

#### PUT /api/messages/:id
Edit a message.

**Request:**
\`\`\`json
{
  "content": "Updated message content."
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "message_id",
    "content": "Updated message content.",
    "edited": true,
    "updatedAt": "timestamp"
  }
}
\`\`\`

**Authorization:**
- Sender only.
- Typically limited to a time window (e.g., within 5-15 minutes of sending).

#### DELETE /api/messages/:id
Delete a message.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Message deleted successfully"
}
\`\`\`

**Authorization:**
- Sender can delete their own messages.
- Team leader or supervisor might be able to delete messages in team channels.

**Business Rules:**
- Soft delete: Mark the message as deleted (`deleted: true`) and potentially replace content with `[Deleted]`. Do not physically remove from DB unless necessary and compliant with policies.

#### POST /api/messages/:id/reactions
Add a reaction to a message.

**Request:**
\`\`\`json
{
  "emoji": "👍"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "messageId": "message_id",
    "emoji": "👍",
    "userId": "reactor_user_id",
    "timestamp": "timestamp"
  }
}
\`\`\`

#### DELETE /api/messages/:id/reactions/:emoji
Remove a reaction from a message.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Reaction removed"
}
\`\`\`

#### POST /api/messages/:id/read
Mark a message (or all messages up to a point) as read.

**Request:**
\`\`\`json
{
  "channelId": "team_team_id",
  "readUpToMessageId": "message_id" // Optional: Marks all messages up to this ID as read
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "channelId": "team_team_id",
    "userId": "user_id",
    "lastReadMessageId": "message_id" // The ID of the last message marked as read in this channel for this user
  }
}
\`\`\`

---

### 3.11 File Management APIs

#### POST /api/files/upload
Initiate file upload process.

**Request:**
\`\`\`json
{
  "fileName": "requirements.pdf",
  "fileSize": 2048576, // bytes
  "mimeType": "application/pdf",
  "teamId": "team_id", // Optional: associate with a team
  "category": "document", // Optional: 'document', 'code', 'design', 'presentation', 'other'
  "description": "Project requirements document for Phase 1.", // Optional
  "tags": ["requirements", "documentation", "phase1"] // Optional
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3-bucket.s3.amazonaws.com/presigned-post-url?...", // Presigned URL for direct upload to S3
    "fileId": "file_id_generated", // ID for the file record in DB
    "fileUrl": "https://s3-bucket.s3.amazonaws.com/files/file_id_generated/requirements.pdf", // Final URL after upload confirmation
    "expiresIn": 300 // Seconds until presigned URL expires
  }
}
\`\`\`

**Business Rules:**
- Server generates a presigned URL for direct client-to-S3 upload.
- `fileId` is created in the database immediately to reserve the ID.
- After upload to S3, client must call a confirmation endpoint (`POST /api/files/:id/confirm-upload`).

#### POST /api/files/:id/confirm-upload
Confirm successful file upload to S3.

**Request:**
\`\`\`json
{
  "fileId": "file_id_generated",
  "finalFileName": "requirements_v1_abc123.pdf", // The actual name used in S3
  "storagePath": "files/file_id_generated/requirements_v1_abc123.pdf", // Path within the S3 bucket
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "category": "document",
  "description": "Project requirements document for Phase 1.",
  "tags": ["requirements", "documentation", "phase1"]
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "file_id_generated",
    "fileName": "requirements_v1_abc123.pdf",
    "url": "https://s3-bucket.s3.amazonaws.com/files/file_id_generated/requirements_v1_abc123.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "category": "document",
    "description": "Project requirements document for Phase 1.",
    "tags": ["requirements", "documentation", "phase1"],
    "uploadedBy": "requesting_user_id",
    "createdAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Updates the initial file record with actual file details.
- Associates the file with the user and potentially a team.
- Award XP for file uploads.
- Scan for viruses after confirmation.

#### GET /api/files
Get files with filters.

**Query Parameters:**
\`\`\`
?teamId=team_id&category=document&tags=requirements&uploadedBy=user_id&search=project&page=1&limit=20
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_id",
        "fileName": "requirements_v1_abc123.pdf",
        "fileType": "pdf",
        "fileSize": 2048576,
        "url": "https://s3-bucket.s3.amazonaws.com/files/...",
        "category": "document",
        "tags": ["requirements", "documentation"],
        "description": "Project requirements document for Phase 1.",
        "downloads": 15,
        "uploadedBy": { "id": "user_id", "fullName": "John Doe" },
        "createdAt": "timestamp"
      }
    ],
    "pagination": { ... }
  }
}
\`\`\`

**Filters:**
- teamId: Files associated with a team.
- category: Filter by file category.
- tags: Filter by tags (comma-separated).
- uploadedBy: Filter by uploader.
- search: Search in `fileName`, `description`, `tags`.

#### GET /api/files/:id/download
Download a file.

**Response:**
- Returns the file content with appropriate `Content-Type` and `Content-Disposition` headers.
- Increments the `downloads` counter for the file.

**Authorization:**
- Users must be authenticated and have permission to access the file (e.g., be part of the team it belongs to, or have public access).

#### PUT /api/files/:id
Update file metadata.

**Request:**
\`\`\`json
{
  "description": "Updated description for the Phase 1 requirements.",
  "tags": ["requirements", "documentation", "phase1", "v2"],
  "category": "document"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "file_id",
    "description": "Updated description...",
    "tags": ["requirements", "documentation", "phase1", "v2"],
    "updatedAt": "timestamp"
  }
}
\`\`\`

#### POST /api/files/:id/new-version
Upload a new version of an existing file.

**Request (multipart/form-data):**
\`\`\`
file: [file upload] // The new version of the file
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "newFileId": "new_file_id_generated", // ID for the new file record
    "parentFileId": "original_file_id",
    "version": 2, // Incremented version number
    "url": "https://s3-bucket.s3.amazonaws.com/files/new_file_id_generated/requirements_v2_xyz456.pdf",
    "createdAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Creates a new file record in the database, linking it to the `parentFileId`.
- Increments the `version` number.
- The old version remains accessible via its URL and history.

#### DELETE /api/files/:id
Delete a file.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "File deleted successfully"
}
\`\`\`

**Authorization:**
- File uploader, team leader, or admin.

**Business Rules:**
- Soft delete: Mark the file record as deleted (`deletedAt` timestamp).
- Optionally, delete the file from S3 storage after a grace period or immediately.
- Handle implications for version history.

---

### 3.12 Gamification APIs

#### GET /api/gamification/leaderboard
Get leaderboard data.

**Query Parameters:**
\`\`\`
?type=global&period=monthly&limit=100
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user_id",
          "fullName": "John Doe",
          "avatar": "https://...",
          "role": "student",
          "year": 4
        },
        "xp": 8500,
        "coins": 3200,
        "streak": 45,
        "achievementsCount": 28
      }
      // ... top users
    ],
    "currentUser": { // Information for the logged-in user
      "rank": 23,
      "xp": 2500,
      "coins": 1200,
      "streak": 7
    }
  }
}
\`\`\`

**Types:**
- `global`: All users in the system.
- `team`: Leaderboard within a specific team (requires `teamId` query param).
- `cohort`: Users from the same academic year/semester.

**Periods:**
- `weekly`, `monthly`, `yearly`, `all-time`.

#### GET /api/gamification/achievements
Get available achievements and user's status.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "ach_id",
      "name": "Task Master",
      "description": "Complete 50 tasks.",
      "icon": "trophy.png",
      "category": "tasks",
      "rarity": "rare",
      "points": 100,
      "coinsReward": 50,
      "unlocked": true,
      "progress": 50, // Current progress towards unlocking
      "target": 50,
      "unlockedAt": "2025-01-15T10:00:00Z" // Null if not unlocked
    },
    {
      "id": "ach_id_2",
      "name": "Code Warrior",
      "description": "Complete 100 tasks.",
      "icon": "star.png",
      "category": "tasks",
      "rarity": "epic",
      "points": 250,
      "coinsReward": 100,
      "unlocked": false,
      "progress": 50,
      "target": 100,
      "unlockedAt": null
    }
    // ... other achievements
  ]
}
\`\`\`

**Filters:**
- `category`: Filter by achievement category.
- `unlocked`: Filter by unlocked status (true/false).
- `rarity`: Filter by rarity level.

#### GET /api/gamification/quests
Get active quests for the current user.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "daily": [
      {
        "id": "quest_id",
        "title": "Daily Task Completion",
        "description": "Complete 3 tasks today.",
        "type": "daily",
        "status": "active", // 'active', 'completed', 'expired'
        "requirements": [
          { "description": "Tasks completed", "current": 2, "target": 3 }
        ],
        "rewards": { "xp": 50, "coins": 10 },
        "expiresAt": "2025-02-14T23:59:59Z"
      }
      // ... other daily quests
    ],
    "weekly": [...], // Quests active for the week
    "seasonal": [...] // Quests active for the current season
  }
}
\`\`\`

#### POST /api/gamification/quests/:id/complete
Manually trigger quest completion check (usually system-triggered).

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "questId": "quest_id",
    "status": "completed",
    "rewards": { "xp": 50, "coins": 10 },
    "completedAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- The system automatically checks quest completion based on user actions.
- This endpoint might be used for manual checks or specific edge cases.
- Award rewards, create notifications, update user stats.

#### GET /api/gamification/challenges
Get active challenges.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "challenge_id",
      "title": "February Coding Sprint",
      "description": "Score points by completing tasks this month.",
      "type": "global", // 'team', 'individual', 'global'
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2025-02-28T23:59:59Z",
      "status": "active", // 'upcoming', 'active', 'completed'
      "myScore": 85, // Score for the logged-in user
      "myRank": 12, // Rank for the logged-in user
      "participantsCount": 150,
      "leaderboardPreview": [ // Top participants
        { "rank": 1, "user": { "id": "user_id", "fullName": "Alice", "avatar": "..." }, "score": 245 },
        { "rank": 2, "user": { "id": "user_id", "fullName": "Bob", "avatar": "..." }, "score": 210 }
      ],
      "prizes": [ // Prizes for top positions
        { "position": 1, "description": "1000 Coins + Exclusive 'Sprint Master' Badge" },
        { "position": 2, "description": "500 Coins" }
      ]
    }
    // ... other challenges
  ]
}
\`\`\`

#### POST /api/gamification/challenges/:id/join
Join a challenge.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "challengeId": "challenge_id",
    "userId": "user_id",
    "participantStatus": "joined", // e.g., 'joined', 'active', 'completed'
    "joinedAt": "timestamp"
  }
}
\`\`\`

**Business Rules:**
- Check if user is eligible to join.
- Create an entry in a `challenge_participants` collection.
- Initialize score and other participant-specific data.

#### GET /api/gamification/badges
Get user's skill badges.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "badge_id",
      "name": "React Expert",
      "category": "Frontend Development",
      "level": 3,
      "maxLevel": 5,
      "description": "Demonstrated mastery in React development.",
      "icon": "react-expert-icon.png",
      "earnedAt": "2025-01-20T10:00:00Z"
    }
    // ... other badges
  ]
}
\`\`\`

#### GET /api/gamification/store
Get reward store items.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "item_id",
      "name": "Dark Theme Pro",
      "description": "A premium dark theme with custom animations.",
      "type": "theme", // 'theme', 'avatar', 'badge', 'perk'
      "price": 500, // in coins
      "icon": "dark-theme-icon.png",
      "rarity": "epic",
      "owned": false, // Indicates if the current user owns this item
      "stock": null // null for unlimited, number for limited stock
    }
    // ... other store items
  ]
}
\`\`\`

**Filters:**
- `type`: Filter by item type.
- `owned`: Show only items owned by the user (true/false).

#### POST /api/gamification/store/:id/purchase
Purchase an item from the reward store.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "itemId": "item_id",
    "userId": "user_id",
    "pricePaid": 500,
    "purchasedAt": "timestamp",
    "newBalance": 700 // User's updated coin balance
  }
}
\`\`\`

**Business Rules:**
- Check if the user has enough coins (`gamification.coins`).
- Deduct coins from the user's balance.
- Record the purchase in a `user_purchases` collection.
- Apply the item effect (e.g., activate theme, grant avatar).
- Decrement stock if the item has limited quantity.
- Create a notification for the user.

---

### 3.13 Analytics APIs

#### GET /api/analytics/dashboard
Get dashboard analytics for admins and supervisors.

**Query Parameters:**
\`\`\`
?dateFrom=2025-02-01&dateTo=2025-02-28&teamId=team_id // teamId only for supervisors
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 250,
      "activeUsersLast30Days": 180,
      "totalTeams": 45,
      "activeTeamsLast30Days": 38,
      "totalTasks": 450,
      "completedTasks": 320,
      "taskCompletionRate": 71.1
    },
    "tasksByStatus": { // Counts for the selected period
      "todo": 80,
      "inProgress": 100,
      "review": 40,
      "done": 180,
      "archived": 50
    },
    "tasksByPriority": {
      "low": 80,
      "medium": 200,
      "high": 120,
      "critical": 50
    },
    "teamPerformanceSummary": [ // For supervisors/admins viewing multiple teams
      {
        "teamId": "team_id",
        "teamName": "Smart Campus IoT",
        "progress": 75,
        "currentPhase": "testing",
        "supervisor": "Dr. Jane Smith"
      }
      // ... other teams
    ],
    "submissionStats": {
      "totalSubmissions": 120,
      "onTime": 100,
      "late": 20,
      "averageGrade": 88.5
    },
    "gamificationStats": {
      "totalXPDistributed": 50000,
      "achievementsUnlocked": 150,
      "activeQuests": 300
    },
    "recentActivityFeed": [ // List of recent significant events
      { "type": "task_completed", "user": "John Doe", "taskTitle": "Implement Auth", "timestamp": "..." },
      { "type": "submission_graded", "team": "Smart Campus", "deliverable": "SRS", "grade": 95, "timestamp": "..." }
    ]
  }
}
\`\`\`

**Authorization:**
- Admins: See system-wide data.
- Supervisors: See data for their assigned teams and supervised students.
- Team Leaders: May have access to their own team's analytics.

#### GET /api/analytics/team/:id
Get detailed analytics for a specific team.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "team": { // Basic team info
      "id": "team_id",
      "name": "Smart Campus IoT",
      "supervisor": "Dr. Jane Smith",
      "currentPhase": "implementation"
    },
    "performanceMetrics": {
      "taskCompletionRate": 85,
      "averageTaskEstimatedHours": 5.2,
      "averageTaskActualHours": 4.8,
      "submissionStats": {
        "total": 8,
        "onTime": 7,
        "late": 1,
        "averageGrade": 87.5
      },
      "meetingAttendanceRate": 88
    },
    "velocityChartData": [ // For task completion over time
      { "week": "2025-W06", "tasksCompleted": 12, "points": 45 },
      { "week": "2025-W07", "tasksCompleted": 10, "points": 40 }
    ],
    "burndownChartData": [ // For tracking remaining work
      { "date": "2025-02-01", "remainingEstimate": 100, "idealRemaining": 100 },
      { "date": "2025-02-14", "remainingEstimate": 45, "idealRemaining": 50 }
    ],
    "memberContributions": [ // Break down by team member
      {
        "userId": "user_id",
        "fullName": "John Doe",
        "tasksCompleted": 15,
        "codeCommits": 45, // If GitHub integrated
        "meetingsAttended": 10
      }
      // ... other members
    ],
    "codeQualityMetrics": { // If GitHub integrated
      "totalCommits": 156,
      "totalPullRequests": 23,
      "codeReviewsGiven": 31,
      "linesAdded": 5240,
      "linesRemoved": 1830
    }
  }
}
\`\`\`

#### GET /api/analytics/user/:id
Get analytics for a specific user.

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "user": { // Basic user info
      "id": "user_id",
      "fullName": "John Doe",
      "role": "student",
      "team": { "id": "team_id", "name": "Smart Campus IoT" }
    },
    "performanceSummary": {
      "tasksCompleted": 38,
      "tasksInProgress": 5,
      "taskCompletionRate": 84.4,
      "averageGradeOnSubmissions": 87.5,
      "meetingAttendanceRate": 90
    },
    "contributionMetrics": {
      "codeCommits": 156,
      "pullRequests": 23,
      "reviewsGiven": 31
    },
    "activityTimeline": [ // Summary of activity over time (e.g., weekly)
      { "week": "2025-W07", "tasksCompleted": 2, "commits": 8, "meetingsAttended": 1 },
      { "week": "2025-W06", "tasksCompleted": 3, "commits": 5, "meetingsAttended": 2 }
    ],
    "skillDevelopment": [ // Based on badges or task tags
      { "skill": "React", "level": 3, "progressTowardsNextLevel": 65 },
      { "skill": "Node.js", "level": 2, "progressTowardsNextLevel": 30 }
    ]
  }
}
\`\`\`

#### POST /api/analytics/events
Track custom analytics events.

**Request:**
\`\`\`json
{
  "eventType": "page_view",
  "eventData": {
    "page": "/dashboard",
    "durationSeconds": 125,
    "referrer": "google.com"
  },
  "userId": "user_id", // Optional: if user is authenticated
  "teamId": "team_id"  // Optional: if event is context-specific
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "message": "Analytics event tracked successfully"
}
\`\`\`

**Business Rules:**
- Used to track user interactions, feature usage, and system performance.
- Data stored in the `analytics` collection.
- Essential for understanding user behavior and improving the system.
- Ensure privacy compliance.

---

## 4. Authentication & Authorization

### 4.1 JWT Token Structure

**Access Token Payload:**
\`\`\`json
{
  "_id": "user_id", // MongoDB ObjectId
  "firstName": "John",
  "lastName": "Doe",
  "email": "student@university.edu",
  "role": "student",
  "teamId": "team_id", // ObjectId or null
  "teamRole": "leader", // or "member", null
  "iat": 1707910800, // Issued At
  "exp": 1707914400 // Expiration Time
}
\`\`\`

**Refresh Token Payload:**
\`\`\`json
{
  "_id": "user_id",
  "tokenId": "unique_token_id_for_revocation", // To invalidate specific tokens
  "iat": 1707910800,
  "exp": 1710502800 // Longer expiry, e.g., 30 days
}
\`\`\`

### 4.2 Token Management

**Access Token:**
- Expiry: Typically 1 hour.
- Storage: Client-side (e.g., in memory, local storage, or secure cookie). HttpOnly cookies are recommended for security.
- Usage: Sent in `Authorization: Bearer <token>` header for API requests.

**Refresh Token:**
- Expiry: Typically 30 days or longer.
- Storage: Securely stored, often in HttpOnly, Secure cookies. Must be associated with the user account and stored server-side (e.g., in user document or a separate `sessions` collection) for revocation.
- Usage: Used via `/api/auth/refresh` to obtain a new access token.
- Rotation: Recommended to rotate refresh tokens upon use for added security.

### 4.3 Permission Matrix (Simplified Example)

| Resource / Action | Admin | Supervisor | Student | TA |
|-------------------|-------|------------|---------|----|
| **Users**         |       |            |         |    |
| Read Own Profile  | ✅    | ✅         | ✅      | ✅ |
| Update Own Profile| ✅    | ✅         | ✅      | ✅ |
| Read Any Profile  | ✅    | ✅         | ❌      | ✅ |
| Manage All Users  | ✅    | ❌         | ❌      | ❌ |
| **Teams**         |       |            |         |    |
| Create Team       | ❌    | ✅         | ✅      | ❌ |
| Read Own Team     | ✅    | ✅         | ✅      | ✅ |
| Read Any Team     | ✅    | ✅         | ❌      | ✅ |
| Update Own Team   | ✅    | ❌         | ✅      | ❌ |
| Update Supervisor Team | ✅ | ✅         | ❌      | ❌ |
| Manage Team Members | ✅ | ✅         | ✅      | ❌ |
| **Tasks**         |       |            |         |    |
| Create Task (Own Team) | ✅ | ✅         | ✅      | ✅ |
| Read Tasks (Own Team) | ✅ | ✅         | ✅      | ✅ |
| Update Task (Own Team) | ✅ | ✅         | ✅      | ✅ |
| **Proposals**     |       |            |         |    |
| Create Draft      | ❌    | ✅         | ✅      | ❌ |
| Submit Proposal   | ❌    | ✅         | ✅      | ❌ |
| Review/Approve    | ❌    | ✅         | ❌      | ❌ |
| **Submissions**   |       |            |         |    |
| Submit Deliverable| ❌    | ✅         | ✅      | ✅ |
| Grade Submission  | ❌    | ✅         | ❌      | ✅ |
| **Meetings**      |       |            |         |    |
| Create Meeting    | ✅    | ✅         | ✅      | ✅ |
| Respond to Invite | ✅    | ✅         | ✅      | ✅ |
| **Files**         |       |            |         |    |
| Upload File (Own Team) | ✅ | ✅         | ✅      | ✅ |
| Download File (Own Team) | ✅ | ✅         | ✅      | ✅ |

**Legend:**
- ✅: Allowed
- ❌: Not Allowed

### 4.4 Role-Based Access Control (RBAC)

**Admin:** Full system access. Can manage users, teams, system settings, view all analytics, and override permissions.
**Supervisor:** Oversees assigned teams. Can grade submissions, review proposals, manage team progress, and view team analytics.
**Student:** Standard user. Can join teams, create/manage tasks within their team, submit deliverables, participate in discussions, and access gamification features.
**Teaching Assistant (TA):** Assists supervisors. Can grade submissions, provide feedback, and has similar read access as supervisors for their teams, but typically cannot approve proposals or directly manage team status.

---

## 5. Business Logic Rules

### 5.1 User Management

**Registration:**
- Email uniqueness enforced.
- Password complexity: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
- `studentId` required for 'student' role, must be unique.
- Default `gamification` values: `level: 1`, `xp: 0`, `coins: 0`, `streak: 0`.
- Upon successful registration, a welcome email is sent.

**XP & Levels:**
- Formula for next level: `level = floor(sqrt(xp / 100)) + 1`. Example: Lvl 1 (0 XP), Lvl 2 (100 XP), Lvl 3 (400 XP), Lvl 4 (900 XP).
- XP awarded for: Task completion, successful submission grades, meeting attendance, proposal approvals, code commits (via integration), helping teammates, completing quests.

**Login Streak:**
- `gamification.streak` increments daily if the user logs in consecutively.
- Resets to 0 if a day is missed.
- Bonus XP awarded for maintaining long streaks.

### 5.2 Team Management

**Team Creation:**
- The user creating the team becomes the `leader`.
- A unique `code` (e.g., 6 alphanumeric chars) is generated.
- Default `status`: 'forming'.
- Default `currentPhase`: 'planning'.
- Default `progress`: 0.
- `maxMembers` enforced (e.g., min 3, max 6).
- `supervisorId` is mandatory and must reference a valid supervisor.

**Team Progress:**
- Calculated based on a weighted average of task completion, submission grades, and milestone achievements.
- Example formula: `progress = (completed_tasks_ratio * 0.4) + (avg_submission_grade_ratio * 0.4) + (completed_milestones_ratio * 0.2)`.
- Range: 0-100.

**Team Health (Conceptual):**
- Not a direct DB field, but an aggregate derived from `progress`, overdue tasks, and activity levels.
- "Healthy": On track with progress and deadlines.
- "At-Risk": Some delays, overdue tasks, or declining progress.
- "Critical": Significant delays, multiple overdue critical tasks, inactivity.

### 5.3 Task Management

**Status Flow:**
`todo` -> `in-progress` -> `review` -> `done` (or `archived`)
Tasks can start in `todo` or be placed in `backlog` (implicitly, before being assigned).

**Task Completion:**
- When `status` is set to 'done':
  - Assignee receives XP based on priority, estimated effort, and timeliness.
  - Check for task dependencies: if this task is a dependency for others, those tasks might become unblocked.
  - Potentially update team progress.
  - Notify relevant parties (creator, leader).

**Task Dependencies:**
- A task can depend on one or more other tasks.
- A task cannot be marked 'done' if any of its dependencies are not 'done'.

### 5.4 Proposal Workflow

**Status Progression:**
`draft` -> `submitted`
`submitted` -> `feedback-requested` / `approved` / `rejected`
`feedback-requested` -> `revised`
`revised` -> `submitted`

**Rules:**
- Only team leader can submit.
- Submission locks editing until status changes.
- Supervisor feedback is crucial.
- Approval is required for the project to formally proceed to the next stage.

### 5.5 Submission & Grading

**Late Submissions:**
- Penalty applied if `submittedAt` > `deadline`.
- Grade reduction: e.g., 5% per day late, capped at 30%.
- XP awarded is also reduced.

**Grading:**
- Awarded by Supervisors/TAs.
- Grade range: 0-100.
- XP awarded scales with grade.
- Finalized grades are typically immutable.

### 5.6 Gamification Logic

**XP Sources:**
- Task completion: Base XP (e.g., 10-50) modulated by priority, estimate, and timeliness.
- Submission: Base XP (e.g., 100) modulated by grade and deliverable type.
- Meeting attendance: Fixed XP (e.g., 20).
- Proposal approval: Significant XP (e.g., 200).
- Code commits/PRs (via integration): Variable XP.
- Quests & Challenges: Variable XP rewards.
- Daily login & Streak bonuses.

**Coin Sources:**
- Initial balance upon registration.
- XP conversion or direct rewards from quests, challenges, achievements.
- Used to purchase cosmetic items (themes, avatars) from the store.

**Achievement Criteria:**
- Defined via JSONB objects in the `achievements` collection.
  - Example: `{"type": "count", "entity": "tasks", "condition": "status='done'", "target": 50}`.
  - System monitors relevant actions to check against criteria.

### 5.7 Notification Triggers

Notifications are generated for key events:
- Task assignment/update.
- Submission deadline approaching/graded.
- Proposal status change.
- Meeting invitations/reminders.
- Team invites/join requests.
- Achievement unlocked.
- New messages (if offline).
- System announcements.

### 5.8 Meeting Rules

**Attendance Tracking:**
- Users mark `invited`, `accepted`, `declined`, `attended`.
- XP awarded for `attended` status.

**Recurring Meetings:**
- System generates series of meeting instances based on pattern and end date.
- Each instance is a separate record, but linked to the series.

---

## 6. Real-time Features

### 6.1 WebSocket Events

**Connection & Authentication:**
- Client connects: `socket.emit('authenticate', { token: accessToken })`
- Server verifies token and emits: `socket.emit('authenticated', { userId, socketId })`

**Chat Messages:**
- Send: `socket.emit('sendMessage', { channelId, content, replyToId, ... })`
- Receive: `socket.on('newMessage', (messageData) => { ... })` (broadcast to channel participants)

**Typing Indicators:**
- User starts typing: `socket.emit('typingStart', { channelId })`
- User stops typing: `socket.emit('typingStop', { channelId })`
- Receive status: `socket.on('userTyping', ({ channelId, userId, typing }) => { ... })`

**Notifications:**
- Server pushes new notifications: `socket.emit('newNotification', notificationData)`

**Presence:**
- Track user online/offline status.
- Broadcast presence updates: `socket.emit('userPresenceUpdate', { userId, status: 'online' | 'offline' })`

### 6.2 Redis Pub/Sub for Scaling

- WebSocket servers subscribe to Redis channels (e.g., `team:team_id:messages`).
- When a message is sent via API or another WebSocket server, it's published to Redis.
- Subscribers receive the message and broadcast it to connected clients in that channel.
- This decouples WebSocket servers and allows horizontal scaling.

---

## 7. File Storage & Management

### 7.1 Storage Strategy

- **AWS S3:** Recommended for scalability and performance.
  - Bucket structure: `/teams/{teamId}/files/`, `/submissions/{teamId}/`, `/users/avatars/`.
- **GridFS (MongoDB):** Alternative if using MongoDB exclusively. Suitable for smaller projects or simpler deployments.

### 7.2 Upload Process (S3 Presigned URLs)

1. **Client Request:** Client requests an upload URL: `POST /api/files/upload-url` with file metadata.
2. **Server Generates URL:** Server generates a presigned S3 POST URL with necessary conditions (file size, type).
3. **Client Uploads:** Client uploads the file directly to S3 using the presigned URL.
4. **Client Confirmation:** Upon successful upload, client calls a confirmation endpoint: `POST /api/files/:id/confirm-upload` with final file details.
5. **Server Finalizes:** Server verifies the upload and updates the file record in the database.

### 7.3 Security

- **Virus Scanning:** Integrate a virus scanner (e.g., ClamAV) after upload confirmation.
- **File Type Validation:** Enforce allowed file types on the server-side.
- **Size Limits:** Configure maximum file size (e.g., 50MB).
- **Access Control:** Use presigned URLs for uploads and restrict direct access to files via S3 policies or signed URLs for downloads.
- **Permissions:** Ensure only authorized users can download or manage files.

---

## 8. Gamification System

### 8.1 XP Calculation Details

**Task Completion XP:**
\`\`\`javascript
function calculateTaskXP(task, completionTime) {
  const baseXP = 10;
  const priorityMultipliers = { low: 0.5, medium: 1.0, high: 1.5, critical: 2.0 };
  const estimateMultiplier = Math.log2(task.estimatedHours + 1) || 1; // Logarithmic scaling for effort

  let daysLate = 0;
  if (task.dueDate && completionTime > task.dueDate) {
    daysLate = Math.floor((completionTime - task.dueDate) / (1000 * 60 * 60 * 24));
  }
  const latePenalty = Math.min(daysLate * 0.2, 0.8); // Max 80% penalty

  let daysEarly = 0;
  if (task.dueDate && completionTime < task.dueDate) {
    daysEarly = Math.floor((task.dueDate - completionTime) / (1000 * 60 * 60 * 24));
  }
  const earlyBonus = Math.min(daysEarly * 0.1, 0.5); // Max 50% bonus

  return Math.round(
    baseXP *
    (priorityMultipliers[task.priority] || 1.0) *
    estimateMultiplier *
    (1 - latePenalty + earlyBonus)
  );
}
\`\`\`

**Submission XP:**
\`\`\`javascript
function calculateSubmissionXP(submission, grade) {
  const baseXP = 100;
  const gradeMultiplier = (grade || 0) / 100;
  const lateMultiplier = submission.late ? 0.7 : 1.0; // 30% reduction if late

  const typeMultipliers = {
    srs: 1.0, prototype: 1.5, code: 1.5, 'test-plan': 1.2,
    'final-report': 2.0, presentation: 1.3, uml: 0.8
  };
  const typeMultiplier = typeMultipliers[submission.deliverableType] || 1.0;

  return Math.round(baseXP * gradeMultiplier * lateMultiplier * typeMultiplier);
}
\`\`\`

### 8.2 Achievement Criteria Examples

Defined in the `achievements` collection using `criteria` field (JSONB).

\`\`\`json
// Example: Complete 50 tasks
{
  "type": "count",
  "entity": "tasks",
  "condition": "status='done'",
  "target": 50
}

// Example: Get grade 95+ on 10 submissions
{
  "type": "count",
  "entity": "submissions",
  "condition": "grade >= 95",
  "target": 10
}

// Example: Maintain 30-day login streak
{
  "type": "streak",
  "target": 30
}
\`\`\`

### 8.3 Quest Generation

- **Daily Quests:** Randomly selected from a predefined pool each day.
- **Weekly Quests:** Reset weekly, often more involved tasks.
- **Seasonal Quests:** Longer-term objectives aligned with academic terms or project phases.
- Quests auto-complete and award rewards upon meeting criteria.

---

## 9. Notification System

### 9.1 Notification Templates

Stored in the backend, mapping event types to structured notification data.

\`\`\`javascript
const notificationTemplates = {
  task_assigned: {
    title: 'New Task Assigned',
    content: (data) => `${data.assignerName} assigned you task: "${data.taskTitle}"`,
    actionUrl: (data) => `/tasks/${data.taskId}`,
    priority: 'normal',
  },
  submission_graded: {
    title: 'Submission Graded',
    content: (data) => `Your ${data.deliverableType} submission received grade: ${data.grade}`,
    actionUrl: (data) => `/submissions/${data.submissionId}`,
    priority: 'high',
  },
  achievement_unlocked: {
    title: 'Achievement Unlocked!',
    content: (data) => `Congratulations! You unlocked "${data.achievementName}".`,
    actionUrl: '/gamification',
    priority: 'high',
  },
  // ... other templates
};
\`\`\`

### 9.2 Notification Delivery

- **In-App:** Real-time via WebSocket, displayed in a notification center.
- **Email:** Batched daily/weekly (digest) or instantly, based on user preferences. Uses Nodemailer.
- **Push Notifications:** For critical alerts, if enabled and user permissions granted.

### 9.3 Notification Preferences

Managed via `userSchema.preferences.notifications` and `userSchema.emailDigest`. Users can opt-in/out of different notification types and delivery methods.

---

## 10. Search & Filtering

### 10.1 Global Search

- **Endpoint:** `GET /api/search?q=<query>&type=<all|tasks|files|users|messages>`
- **Implementation:** Utilizes database text search capabilities (e.g., MongoDB's `$text` operator or Atlas Search).
- **Results:** Returns relevant items with highlighting and pagination.

### 10.2 Advanced Filters

- **Implementation:** Query parameters passed to relevant API endpoints (e.g., `/api/tasks`, `/api/teams`).
- **Logic:** Supports filtering by multiple criteria (AND logic), multiple values for a single field (OR logic), date ranges, and custom search terms.
- **Sorting:** `sortBy` and `sortOrder` parameters allow for flexible data ordering.

---

## 11. Analytics & Reporting

### 11.1 Report Types

- **Team Performance Report:** Comprehensive overview of a team's progress, task completion, submissions, member contributions, and code quality (if integrated).
- **Individual Performance Report:** Focuses on a single user's task completion, submission grades, contributions, and gamification progress.
- **System-Wide Report:** Aggregated statistics for admins (user growth, team activity, overall system health).

### 11.2 Export Formats

- **PDF:** For professional, printable reports.
- **Excel/CSV:** For data analysis and import into other tools.

---

## 12. Data Validation Rules

Validation is performed server-side using libraries like Joi, Yup, or custom middleware.

### 12.1 User Validation (Example Snippet)

\`\`\`javascript
// Using Joi
const userSchemaValidation = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
  role: Joi.string().valid('admin', 'supervisor', 'student', 'teaching_assistant').required(),
  studentId: Joi.string().pattern(/^\d{10}$/).when('role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() }),
  // ... other fields
});
\`\`\`

### 12.2 Team Validation (Example Snippet)

\`\`\`javascript
const teamSchemaValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  projectType: Joi.string().valid('web', 'mobile', 'ai', 'data', 'iot', 'other').required(),
  techStack: Joi.array().items(Joi.string()).min(1).max(5).required(),
  maxMembers: Joi.number().integer().min(3).max(6).default(5),
  supervisorId: Joi.string().required(), // Should be validated against existing supervisor IDs
  semester: Joi.string().required(),
  year: Joi.number().integer().min(2020).required(),
});
\`\`\`

---

## 13. Performance Requirements

### 13.1 Response Time Targets

- **API Endpoints:** 95th percentile < 200ms.
- **Real-time Messages:** < 50ms delivery latency.
- **Database Operations:** Average < 100ms.
- **Search Queries:** < 300ms.

### 13.2 Scalability

- **Horizontal Scaling:** Deploy multiple Node.js/Express instances behind a load balancer. Scale WebSocket servers using Redis Pub/Sub. Use MongoDB Atlas for managed database scaling.
- **Caching:** Implement Redis for session caching, frequently accessed data (user profiles, team details), and leaderboards.
- **Database Optimization:** Proper indexing in MongoDB, query optimization, efficient schema design.

### 13.3 Rate Limiting

Applied globally and per-route using middleware (e.g., `express-rate-limit`).
- **Examples:**
  - Login attempts: 5 per 15 mins per IP.
  - Authentication endpoints: 100 per hour.
  - API requests: 600 per hour per user.

---

## 14. Security Requirements

### 14.1 Authentication Security

- **Password Hashing:** Use bcrypt (`bcryptjs`) with a salt factor of 12 or higher.
- **JWT:** Securely sign tokens using strong secrets. Implement token expiration and refresh mechanisms. Store tokens securely (e.g., HttpOnly cookies).
- **HTTPS:** Enforce HTTPS for all communication.

### 14.2 Input Validation & Sanitization

- **Server-Side Validation:** Validate all incoming data against defined schemas.
- **Sanitization:** Sanitize user-generated content to prevent XSS attacks. Use libraries like `dompurify`.
- **NoSQL Injection Prevention:** Mongoose ODM generally handles this well by default, but ensure queries are constructed safely.

### 14.3 Authorization

- **RBAC:** Implement Role-Based Access Control middleware on API routes to check user roles and permissions.
- **Resource Ownership:** Verify that the authenticated user has the right to perform actions on specific resources (e.g., a user can only edit their own profile).

### 14.4 Data Protection

- **Sensitive Data:** Encrypt sensitive fields at rest if necessary (though MongoDB handles encryption at rest at the storage level).
- **Secure Storage:** Ensure file storage is secured (e.g., S3 bucket policies).
- **Auditing:** Log critical actions for security monitoring.

---

## 15. Integration Points

### 15.1 GitHub Integration

- **OAuth:** Allow users to connect their GitHub accounts.
- **Data Sync:** Pull repository information, commit history, PRs, issues.
- **Metrics:** Track code contributions for gamification and team analytics.
- **Endpoints:** `/api/integrations/github/connect`, `/api/integrations/github/repos`, `/api/integrations/github/commits`.

### 15.2 Email Service

- **Provider:** Nodemailer configured with SMTP (SendGrid, AWS SES, Mailgun).
- **Types:** Welcome, verification, password reset, notifications, grade reports, meeting reminders.

### 15.3 Calendar Integration

- **Export:** Provide `.ics` file export for meetings.
- **Sync:** Potential for future integration with Google Calendar or Outlook.

---

## 16. Testing Strategy

### 16.1 Unit Tests

- **Framework:** Jest.
- **Focus:** Business logic, utility functions, validation logic, individual models.
- **Coverage Goal:** Aim for >80% code coverage.

### 16.2 Integration Tests

- **Framework:** Supertest with Jest.
- **Focus:** API endpoints, interaction between services (e.g., controller -> service -> model), database operations.
- **Environment:** Use an in-memory MongoDB or a dedicated test database.

### 16.3 End-to-End (E2E) Tests

- **Framework:** Cypress or Playwright.
- **Focus:** Simulating user flows through the frontend and backend (e.g., registration, team creation, task management, chat).

### 16.4 Load Testing

- **Tools:** k6, Artillery.
- **Scenarios:** Simulate concurrent users accessing APIs, sending messages, performing common actions. Measure response times and identify bottlenecks.

---

## 17. Deployment Specifications

### 17.1 Environment Variables

Key variables for different environments (development, staging, production).

\`\`\`bash
# General
NODE_ENV=production
PORT=8080
API_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<dbName>?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb://localhost:27017/testdb

# Redis
REDIS_URL=redis://:<password>@<host>:<port>

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=your-aws-region

# Email Service (e.g., SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# File Uploads
MAX_FILE_SIZE_MB=50 # Max file size in Megabytes
ALLOWED_FILE_TYPES=pdf,doc,docx,ppt,pptx,zip,jpg,png,gif,jpeg
\`\`\`

### 17.2 Infrastructure

- **Backend:** Node.js/Express.js application containerized with Docker.
- **Database:** MongoDB Atlas (managed cloud service).
- **Cache:** Redis instance (managed service or self-hosted).
- **File Storage:** AWS S3.
- **Load Balancing:** Cloud provider's load balancer (e.g., AWS ALB) distributing traffic across multiple backend instances.
- **CI/CD:** Automated pipeline for building, testing, and deploying (e.g., GitHub Actions, GitLab CI).

### 17.3 Docker Compose (Development Example)

\`\`\`yaml
version: '3.8'

services:
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build: .
    ports:
      - "3000:8080" # Map host port 3000 to container port 8080
    environment:
      NODE_ENV: development
      PORT: 8080
      MONGODB_URI: mongodb://mongo:27017/graduation_project_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_key_for_testing_only
      JWT_ACCESS_EXPIRES_IN: 1d # Longer expiry for dev
      JWT_REFRESH_EXPIRES_IN: 7d
      # Add other necessary env vars for dev
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/app # Mount current directory for code changes
      - /app/node_modules # Avoid overwriting node_modules

volumes:
  mongo_data:
  redis_data:
\`\`\`

### 17.4 Deployment Steps

1.  **Build Docker Image:** `docker build -t your-api-image .`
2.  **Push Image:** `docker push your-dockerhub-repo/your-api-image:tag`
3.  **Deploy to Cloud Provider:** Use orchestration services (e.g., AWS ECS, Kubernetes) or PaaS (e.g., Heroku, Render).
4.  **Configure Environment Variables:** Set production environment variables in the deployment platform.
5.  **Run Migrations/Seeders:** Ensure database schema is up-to-date (less critical for NoSQL, but schema definitions ensure consistency).
6.  **Start Application:** Deploy the containerized application.
7.  **Health Checks:** Configure load balancer health checks to monitor application availability.

### 17.5 Monitoring

- **Application Performance Monitoring (APM):** Tools like New Relic, Datadog, or PM2 for Node.js. Track response times, error rates, CPU/memory usage.
- **Logging:** Centralized logging (e.g., ELK stack, CloudWatch Logs) for aggregating application logs.
- **Metrics:** Prometheus/Grafana for infrastructure and application metrics.
- **Uptime Monitoring:** External services like UptimeRobot or Pingdom.

### 17.6 Backup Strategy

- **MongoDB Atlas:** Provides automated backups, point-in-time recovery, and manual snapshot options. Configure backup frequency and retention policies.
- **AWS S3:** Enable S3 versioning to protect against accidental deletions or overwrites. Implement lifecycle policies for older file versions.

---

## Summary

This comprehensive documentation outlines the backend specification for a MERN stack-based Graduation Project Management System. It covers:

- **MERN Stack Architecture:** Next.js/React frontend, Node.js/Express.js backend, MongoDB database, Redis cache.
- **Database Schema:** Detailed MongoDB collection definitions with relationships and indexes.
- **API Specifications:** Over 100+ RESTful API endpoints for all system functionalities, including detailed request/response examples, authorization rules, and business logic.
- **Authentication & Authorization:** JWT-based auth with refresh tokens, and robust RBAC based on user roles (Admin, Supervisor, Student, TA).
- **Real-time Features:** WebSocket integration using Socket.io for chat, notifications, and presence updates, scaled with Redis Pub/Sub.
- **File Management:** Secure file uploads via S3 presigned URLs, with virus scanning and access controls.
- **Gamification System:** Comprehensive features including XP, levels, streaks, achievements, quests, challenges, and a reward store.
- **Notification System:** Multi-channel notifications (in-app, email, push) with user preferences.
- **Search & Filtering:** Global search and advanced filtering capabilities.
- **Analytics & Reporting:** Dashboards and reports for team, user, and system-wide performance.
- **Data Validation:** Schema-level validation for all data inputs.
- **Performance & Scalability:** Targets for response times, horizontal scaling strategies, and caching.
- **Security:** Best practices for authentication, authorization, input validation, and data protection.
- **Integrations:** GitHub and Calendar integration points.
- **Testing Strategy:** Unit, integration, E2E, and load testing approaches.
- **Deployment:** Environment variables, infrastructure recommendations, Dockerization, and monitoring strategies.

This detailed specification serves as a blueprint for building a scalable, secure, and feature-rich backend for the graduation project management system.
