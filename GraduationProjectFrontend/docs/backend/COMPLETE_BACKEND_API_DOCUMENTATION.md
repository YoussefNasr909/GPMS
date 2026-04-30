# Complete Backend API Documentation
## Graduation Project Management System

**Base URL:** `https://api.graduation-system.com/api/v1`  
**Version:** 1.0  
**Last Updated:** February 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Teams API](#teams-api)
4. [Tasks API](#tasks-api)
5. [Meetings API](#meetings-api)
6. [Calendar API](#calendar-api)
7. [Chat API](#chat-api)
8. [Files API](#files-api)
9. [GitHub Integration API](#github-integration-api)
10. [Notifications API](#notifications-api)
11. [Proposals API](#proposals-api)
12. [Submissions API](#submissions-api)
13. [Analytics API](#analytics-api)
14. [Gamification API](#gamification-api)
15. [Admin API](#admin-api)

---

## Authentication

### Register New User

**Endpoint:** `POST /auth/register`

**Description:** Register a new user account

**Request Body:**
\`\`\`json
{
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "fullName": "Ahmed Hassan",
  "role": "student",
  "department": "Computer Science"
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@university.edu",
      "fullName": "Ahmed Hassan",
      "role": "student",
      "department": "Computer Science",
      "createdAt": "2025-02-15T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
\`\`\`

**Validation Rules:**
- Email must be valid university email
- Password minimum 8 characters, must include uppercase, number, special char
- Full name is required
- Role must be one of: student, team_leader, supervisor, ta, admin

---

### Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT tokens

**Request Body:**
\`\`\`json
{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@university.edu",
      "fullName": "Ahmed Hassan",
      "role": "student",
      "avatar": "https://cdn.../avatar.jpg"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
\`\`\`

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account suspended
- `404 Not Found` - User does not exist

---

### Refresh Access Token

**Endpoint:** `POST /auth/refresh-token`

**Description:** Get new access token using refresh token

**Request Body:**
\`\`\`json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
\`\`\`

---

### Logout

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer {accessToken}`

**Description:** Invalidate refresh token and logout user

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Logged out successfully"
}
\`\`\`

---

### Reset Password Request

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
\`\`\`json
{
  "email": "student@university.edu"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Password reset link sent to email"
}
\`\`\`

---

### Reset Password

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
\`\`\`json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Password reset successfully"
}
\`\`\`

---

## Users API

### Get All Users

**Endpoint:** `GET /users`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `role` (optional) - Filter by role
- `department` (optional) - Filter by department
- `search` (optional) - Search by name or email
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Example:** `GET /users?role=student&department=CS&page=1&limit=20`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "student1@university.edu",
        "fullName": "Ahmed Hassan",
        "role": "student",
        "department": "Computer Science",
        "avatar": "https://cdn.../avatar1.jpg",
        "bio": "Full-stack developer",
        "skills": ["React", "Node.js", "MongoDB"]
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "email": "student2@university.edu",
        "fullName": "Sara Mohamed",
        "role": "student",
        "department": "Computer Science",
        "avatar": "https://cdn.../avatar2.jpg"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
\`\`\`

---

### Get User by ID

**Endpoint:** `GET /users/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "student@university.edu",
      "fullName": "Ahmed Hassan",
      "role": "student",
      "department": "Computer Science",
      "avatar": "https://cdn.../avatar.jpg",
      "bio": "Passionate about AI and ML",
      "skills": ["Python", "TensorFlow", "React"],
      "gamification": {
        "xp": 1250,
        "level": "Silver",
        "coins": 450,
        "achievements": [
          {
            "id": "a1",
            "name": "First Task",
            "description": "Complete your first task",
            "icon": "trophy",
            "earnedAt": "2025-01-20T10:00:00Z"
          }
        ]
      },
      "teams": [
        {
          "id": "t1",
          "name": "Smart Campus",
          "role": "member"
        }
      ],
      "createdAt": "2024-12-01T10:00:00Z"
    }
  }
}
\`\`\`

---

### Update User Profile

**Endpoint:** `PUT /users/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "fullName": "Ahmed Hassan Updated",
  "bio": "Full-stack developer passionate about EdTech",
  "skills": ["React", "Node.js", "MongoDB", "Docker"],
  "avatar": "https://cdn.../new-avatar.jpg"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "Ahmed Hassan Updated",
      "bio": "Full-stack developer passionate about EdTech",
      "skills": ["React", "Node.js", "MongoDB", "Docker"],
      "updatedAt": "2025-02-15T12:00:00Z"
    }
  }
}
\`\`\`

**Permissions:**
- Users can only update their own profile
- Admins can update any user profile

---

### Delete User

**Endpoint:** `DELETE /users/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Admin only

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "User deleted successfully"
}
\`\`\`

---

### Get User Teams

**Endpoint:** `GET /users/:id/teams`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "t1",
        "name": "Smart Campus",
        "description": "IoT-based campus management",
        "role": "member",
        "progress": 65,
        "health": "healthy"
      }
    ]
  }
}
\`\`\`

---

### Get User Tasks

**Endpoint:** `GET /users/:id/tasks`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `status` (optional) - Filter by status
- `priority` (optional) - Filter by priority

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task1",
        "title": "Implement user authentication",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2025-02-20T23:59:59Z",
        "team": {
          "id": "t1",
          "name": "Smart Campus"
        }
      }
    ]
  }
}
\`\`\`

---

## Teams API

### Get All Teams

**Endpoint:** `GET /teams`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `visibility` (optional) - public/private
- `stage` (optional) - requirements/design/implementation/testing/deployment
- `health` (optional) - healthy/at-risk/critical
- `search` (optional) - Search by name/description
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Example:** `GET /teams?visibility=public&stage=implementation`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "t1",
        "name": "Smart Campus",
        "description": "IoT-based campus management system",
        "leaderId": "u7",
        "memberCount": 3,
        "maxMembers": 5,
        "stage": "implementation",
        "progress": 65,
        "health": "healthy",
        "visibility": "public",
        "stack": ["React", "Node.js", "MongoDB", "IoT"],
        "doctor": {
          "id": "u2",
          "fullName": "Dr. Mohamed Ali"
        },
        "createdAt": "2025-01-05T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
\`\`\`

---

### Get Team by ID

**Endpoint:** `GET /teams/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "team": {
      "id": "t1",
      "name": "Smart Campus",
      "description": "IoT-based campus management system with real-time monitoring",
      "leaderId": "u7",
      "memberIds": ["u7", "u10", "u11"],
      "doctorId": "u2",
      "taId": "u5",
      "stack": ["React", "Node.js", "MongoDB", "IoT"],
      "stage": "implementation",
      "visibility": "public",
      "progress": 65,
      "health": "healthy",
      "maxMembers": 5,
      "inviteCode": "SMART2025",
      "members": [
        {
          "id": "u7",
          "fullName": "Youssef Ahmed",
          "email": "youssef@university.edu",
          "role": "team_leader",
          "avatar": "https://cdn.../avatar7.jpg"
        },
        {
          "id": "u10",
          "fullName": "Sara Mohamed",
          "email": "sara@university.edu",
          "role": "student",
          "avatar": "https://cdn.../avatar10.jpg"
        }
      ],
      "doctor": {
        "id": "u2",
        "fullName": "Dr. Mohamed Ali",
        "email": "mohamed.ali@university.edu",
        "department": "Computer Science"
      },
      "ta": {
        "id": "u5",
        "fullName": "Fatima Hassan",
        "email": "fatima@university.edu"
      },
      "statistics": {
        "totalTasks": 45,
        "completedTasks": 28,
        "inProgressTasks": 12,
        "todoTasks": 5,
        "overdueTasks": 2,
        "totalCommits": 156,
        "codeContributions": {
          "u7": 89,
          "u10": 45,
          "u11": 22
        }
      },
      "joinRequests": [
        {
          "userId": "u15",
          "userName": "Ali Mahmoud",
          "requestedAt": "2025-02-14T09:00:00Z",
          "status": "pending"
        }
      ],
      "createdAt": "2025-01-05T10:00:00Z",
      "updatedAt": "2025-02-15T10:00:00Z"
    }
  }
}
\`\`\`

---

### Create Team

**Endpoint:** `POST /teams`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team leaders and admins only

**Request Body:**
\`\`\`json
{
  "name": "AI Study Assistant",
  "description": "Intelligent tutoring system using NLP and machine learning",
  "stack": ["Python", "TensorFlow", "React", "FastAPI"],
  "maxMembers": 4,
  "visibility": "public"
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "team": {
      "id": "t2",
      "name": "AI Study Assistant",
      "description": "Intelligent tutoring system using NLP and machine learning",
      "leaderId": "u8",
      "memberIds": ["u8"],
      "stack": ["Python", "TensorFlow", "React", "FastAPI"],
      "stage": "requirements",
      "progress": 0,
      "health": "healthy",
      "visibility": "public",
      "maxMembers": 4,
      "inviteCode": "AISTUDY24",
      "createdAt": "2025-02-15T12:00:00Z"
    }
  }
}
\`\`\`

**Validation:**
- Team name must be unique
- User can only lead one team at a time
- Max members between 3-5

---

### Update Team

**Endpoint:** `PUT /teams/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team leader or admin

**Request Body:**
\`\`\`json
{
  "description": "Updated description",
  "stage": "implementation",
  "progress": 70,
  "visibility": "private"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Team updated successfully",
  "data": {
    "team": {
      "id": "t1",
      "description": "Updated description",
      "stage": "implementation",
      "progress": 70,
      "visibility": "private",
      "updatedAt": "2025-02-15T12:30:00Z"
    }
  }
}
\`\`\`

---

### Delete Team

**Endpoint:** `DELETE /teams/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Admin only

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Team deleted successfully"
}
\`\`\`

**Note:** Deleting a team:
- Archives all tasks
- Removes all members
- Preserves data for records
- Cannot be undone

---

### Add Team Member

**Endpoint:** `POST /teams/:id/members`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team leader or admin

**Request Body:**
\`\`\`json
{
  "userId": "u12"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "team": {
      "id": "t1",
      "memberCount": 4,
      "members": [...]
    }
  }
}
\`\`\`

**Validation:**
- Team cannot exceed max members
- User cannot be in multiple teams (unless policy allows)
- User must not already be a member

---

### Remove Team Member

**Endpoint:** `DELETE /teams/:id/members/:userId`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team leader or admin

**Query Parameters:**
- `reassignTo` (optional) - User ID to reassign tasks

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Member removed successfully"
}
\`\`\`

---

### Request to Join Team

**Endpoint:** `POST /teams/:id/join-request`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "message": "I'm interested in IoT development and would love to join"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Join request submitted successfully"
}
\`\`\`

---

### Approve/Reject Join Request

**Endpoint:** `PATCH /teams/:id/join-requests/:userId`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team leader or admin

**Request Body:**
\`\`\`json
{
  "action": "approve"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Join request approved"
}
\`\`\`

**Actions:**
- `approve` - Add user to team
- `reject` - Decline request

---

## Tasks API

### Get All Tasks

**Endpoint:** `GET /tasks`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `teamId` (optional) - Filter by team
- `assigneeId` (optional) - Filter by assignee
- `status` (optional) - todo/in_progress/in_review/done
- `priority` (optional) - low/medium/high
- `phase` (optional) - SDLC phase
- `search` (optional) - Search by title/description
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Example:** `GET /tasks?teamId=t1&status=in_progress&priority=high`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task1",
        "title": "Implement user authentication",
        "description": "Build JWT-based auth system",
        "teamId": "t1",
        "assigneeId": "u7",
        "status": "in_progress",
        "priority": "high",
        "phase": "implementation",
        "deadline": "2025-02-20T23:59:59Z",
        "estimatedHours": 16,
        "actualHours": 8,
        "tags": ["auth", "backend"],
        "assignee": {
          "id": "u7",
          "fullName": "Youssef Ahmed",
          "avatar": "https://cdn.../avatar7.jpg"
        },
        "team": {
          "id": "t1",
          "name": "Smart Campus"
        },
        "createdAt": "2025-02-10T10:00:00Z",
        "updatedAt": "2025-02-15T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87,
      "itemsPerPage": 20
    }
  }
}
\`\`\`

---

### Get Task by ID

**Endpoint:** `GET /tasks/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "task": {
      "id": "task1",
      "title": "Implement user authentication",
      "description": "Build JWT-based authentication system with refresh tokens",
      "teamId": "t1",
      "assigneeId": "u7",
      "status": "in_progress",
      "priority": "high",
      "phase": "implementation",
      "deadline": "2025-02-20T23:59:59Z",
      "estimatedHours": 16,
      "actualHours": 8,
      "tags": ["auth", "backend", "security"],
      "attachments": [
        {
          "id": "f1",
          "name": "auth-flow-diagram.png",
          "url": "https://cdn.../diagram.png",
          "size": 245678,
          "uploadedAt": "2025-02-12T10:00:00Z"
        }
      ],
      "assignee": {
        "id": "u7",
        "fullName": "Youssef Ahmed",
        "email": "youssef@university.edu",
        "avatar": "https://cdn.../avatar7.jpg"
      },
      "team": {
        "id": "t1",
        "name": "Smart Campus",
        "leaderId": "u7"
      },
      "comments": [
        {
          "id": "c1",
          "userId": "u2",
          "userName": "Dr. Mohamed Ali",
          "content": "Make sure to implement rate limiting",
          "createdAt": "2025-02-13T14:00:00Z"
        }
      ],
      "history": [
        {
          "action": "status_change",
          "from": "todo",
          "to": "in_progress",
          "userId": "u7",
          "timestamp": "2025-02-12T09:00:00Z"
        }
      ],
      "createdAt": "2025-02-10T10:00:00Z",
      "updatedAt": "2025-02-15T12:00:00Z"
    }
  }
}
\`\`\`

---

### Create Task

**Endpoint:** `POST /tasks`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team members can create tasks for their team

**Request Body:**
\`\`\`json
{
  "title": "Design database schema",
  "description": "Create MongoDB schema for users, teams, and tasks",
  "teamId": "t1",
  "assigneeId": "u10",
  "status": "todo",
  "priority": "high",
  "phase": "design",
  "deadline": "2025-02-25T23:59:59Z",
  "estimatedHours": 8,
  "tags": ["database", "design"]
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "task2",
      "title": "Design database schema",
      "status": "todo",
      "priority": "high",
      "createdAt": "2025-02-15T13:00:00Z"
    }
  }
}
\`\`\`

**Validation:**
- Title is required (3-200 characters)
- Team ID must be valid
- Assignee must be team member
- Deadline must be in the future

---

### Update Task

**Endpoint:** `PUT /tasks/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team members or task assignee

**Request Body:**
\`\`\`json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "actualHours": 12
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {
      "id": "task1",
      "title": "Updated task title",
      "status": "in_progress",
      "updatedAt": "2025-02-15T14:00:00Z"
    }
  }
}
\`\`\`

---

### Delete Task

**Endpoint:** `DELETE /tasks/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Team leader or admin

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Task deleted successfully"
}
\`\`\`

---

### Update Task Status

**Endpoint:** `PATCH /tasks/:id/status`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "status": "done"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Task status updated",
  "data": {
    "task": {
      "id": "task1",
      "status": "done",
      "completedAt": "2025-02-15T15:00:00Z"
    },
    "xpEarned": 50
  }
}
\`\`\`

**Status Flow:**
- todo → in_progress
- in_progress → in_review
- in_review → done or in_progress (revision)

---

### Add Comment to Task

**Endpoint:** `POST /tasks/:id/comments`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "content": "Great progress! Just a few suggestions..."
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "id": "c2",
      "taskId": "task1",
      "userId": "u2",
      "content": "Great progress! Just a few suggestions...",
      "createdAt": "2025-02-15T16:00:00Z"
    }
  }
}
\`\`\`

---

## Meetings API

### Get All Meetings

**Endpoint:** `GET /meetings`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `teamId` (optional) - Filter by team
- `startDate` (optional) - Filter meetings after date
- `endDate` (optional) - Filter meetings before date
- `status` (optional) - upcoming/completed/cancelled
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "id": "m1",
        "title": "Sprint Planning Meeting",
        "description": "Plan tasks for the upcoming sprint",
        "teamId": "t1",
        "startTime": "2025-02-20T14:00:00Z",
        "endTime": "2025-02-20T15:00:00Z",
        "location": "Room 301",
        "isVirtual": false,
        "meetingLink": null,
        "attendeeIds": ["u7", "u10", "u11", "u2"],
        "attendees": [
          {
            "id": "u7",
            "fullName": "Youssef Ahmed",
            "avatar": "https://cdn.../avatar7.jpg",
            "status": "accepted"
          }
        ],
        "organizer": {
          "id": "u7",
          "fullName": "Youssef Ahmed"
        },
        "status": "upcoming",
        "createdAt": "2025-02-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45
    }
  }
}
\`\`\`

---

### Get Meeting by ID

**Endpoint:** `GET /meetings/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "m1",
      "title": "Sprint Planning Meeting",
      "description": "Plan tasks for the upcoming sprint and review progress",
      "teamId": "t1",
      "startTime": "2025-02-20T14:00:00Z",
      "endTime": "2025-02-20T15:00:00Z",
      "location": "Room 301",
      "isVirtual": false,
      "meetingLink": null,
      "attendeeIds": ["u7", "u10", "u11", "u2"],
      "attendees": [
        {
          "id": "u7",
          "fullName": "Youssef Ahmed",
          "avatar": "https://cdn.../avatar7.jpg",
          "status": "accepted"
        },
        {
          "id": "u10",
          "fullName": "Sara Mohamed",
          "avatar": "https://cdn.../avatar10.jpg",
          "status": "pending"
        }
      ],
      "organizer": {
        "id": "u7",
        "fullName": "Youssef Ahmed",
        "email": "youssef@university.edu"
      },
      "team": {
        "id": "t1",
        "name": "Smart Campus"
      },
      "agenda": [
        "Review last sprint progress",
        "Discuss blockers",
        "Plan next sprint tasks"
      ],
      "minutes": "Sprint planning completed. 15 tasks planned for next sprint...",
      "actionItems": [
        {
          "description": "Create database migration script",
          "assigneeId": "u10",
          "dueDate": "2025-02-22T23:59:59Z"
        }
      ],
      "status": "upcoming",
      "createdAt": "2025-02-15T10:00:00Z",
      "updatedAt": "2025-02-15T10:00:00Z"
    }
  }
}
\`\`\`

---

### Create Meeting

**Endpoint:** `POST /meetings`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "title": "Weekly Progress Review",
  "description": "Discuss project progress and blockers",
  "teamId": "t1",
  "startTime": "2025-02-22T15:00:00Z",
  "endTime": "2025-02-22T16:00:00Z",
  "location": "Online",
  "isVirtual": true,
  "meetingLink": "https://zoom.us/j/123456789",
  "attendeeIds": ["u7", "u10", "u11", "u2"],
  "agenda": [
    "Review tasks completed",
    "Discuss challenges",
    "Plan next steps"
  ]
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "Meeting created successfully",
  "data": {
    "meeting": {
      "id": "m2",
      "title": "Weekly Progress Review",
      "startTime": "2025-02-22T15:00:00Z",
      "meetingLink": "https://zoom.us/j/123456789",
      "createdAt": "2025-02-15T17:00:00Z"
    }
  }
}
\`\`\`

**Notifications:**
- Email invites sent to all attendees
- Calendar invites generated
- In-app notifications created

---

### Update Meeting

**Endpoint:** `PUT /meetings/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Meeting organizer or team leader

**Request Body:**
\`\`\`json
{
  "title": "Updated meeting title",
  "startTime": "2025-02-22T16:00:00Z",
  "endTime": "2025-02-22T17:00:00Z"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Meeting updated successfully",
  "data": {
    "meeting": {
      "id": "m1",
      "title": "Updated meeting title",
      "startTime": "2025-02-22T16:00:00Z",
      "updatedAt": "2025-02-15T18:00:00Z"
    }
  }
}
\`\`\`

**Notifications:**
- Update notifications sent to attendees
- Calendar updates synced

---

### Delete/Cancel Meeting

**Endpoint:** `DELETE /meetings/:id`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Meeting organizer or team leader

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Meeting cancelled successfully"
}
\`\`\`

**Notifications:**
- Cancellation emails sent
- Calendar events deleted

---

### Update Meeting Minutes

**Endpoint:** `PATCH /meetings/:id/minutes`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "minutes": "Meeting summary and key discussion points...",
  "actionItems": [
    {
      "description": "Complete authentication module",
      "assigneeId": "u7",
      "dueDate": "2025-02-25T23:59:59Z"
    }
  ]
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Meeting minutes saved successfully"
}
\`\`\`

---

### RSVP to Meeting

**Endpoint:** `PATCH /meetings/:id/rsvp`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "status": "accepted"
}
\`\`\`

**Status Options:**
- `accepted` - Will attend
- `declined` - Cannot attend
- `tentative` - Maybe

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "RSVP updated successfully"
}
\`\`\`

---

## Calendar API

### Get Calendar Events

**Endpoint:** `GET /calendar`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `startDate` (required) - Start date (YYYY-MM-DD)
- `endDate` (required) - End date (YYYY-MM-DD)
- `type` (optional) - meeting/deadline/all

**Example:** `GET /calendar?startDate=2025-02-01&endDate=2025-02-28&type=all`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "m1",
        "type": "meeting",
        "title": "Sprint Planning",
        "startTime": "2025-02-20T14:00:00Z",
        "endTime": "2025-02-20T15:00:00Z",
        "location": "Room 301",
        "teamId": "t1",
        "teamName": "Smart Campus"
      },
      {
        "id": "task1",
        "type": "deadline",
        "title": "Task: Implement authentication",
        "deadline": "2025-02-20T23:59:59Z",
        "priority": "high",
        "teamId": "t1",
        "teamName": "Smart Campus"
      }
    ]
  }
}
\`\`\`

---

### Sync with Google Calendar

**Endpoint:** `POST /calendar/sync/google`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "authCode": "google-oauth-authorization-code"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Google Calendar synced successfully",
  "data": {
    "syncedEvents": 12,
    "lastSyncedAt": "2025-02-15T20:00:00Z"
  }
}
\`\`\`

---

### Get Sync Status

**Endpoint:** `GET /calendar/sync/status`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "google": {
      "connected": true,
      "lastSyncedAt": "2025-02-15T20:00:00Z",
      "syncDirection": "two-way"
    },
    "outlook": {
      "connected": false,
      "lastSyncedAt": null
    }
  }
}
\`\`\`

---

### Disconnect Calendar Sync

**Endpoint:** `DELETE /calendar/sync/google`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Google Calendar disconnected successfully"
}
\`\`\`

---

## Chat API

### Get Channels

**Endpoint:** `GET /chat/channels`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `type` (optional) - direct/team/group
- `search` (optional) - Search channel name

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "c1",
        "name": "Smart Campus Team",
        "type": "team",
        "teamId": "t1",
        "memberIds": ["u7", "u10", "u11"],
        "lastMessage": {
          "content": "Great work on the authentication module!",
          "senderId": "u10",
          "timestamp": "2025-02-15T19:00:00Z"
        },
        "unreadCount": 3,
        "createdAt": "2025-01-05T10:00:00Z"
      },
      {
        "id": "c2",
        "name": "Youssef Ahmed",
        "type": "direct",
        "memberIds": ["u7", "u2"],
        "lastMessage": {
          "content": "Can we schedule a meeting?",
          "senderId": "u2",
          "timestamp": "2025-02-15T18:30:00Z"
        },
        "unreadCount": 1,
        "createdAt": "2025-01-10T14:00:00Z"
      }
    ]
  }
}
\`\`\`

---

### Get Channel Messages

**Endpoint:** `GET /chat/channels/:channelId/messages`

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `limit` (optional, default: 50)
- `before` (optional) - Message ID to fetch older messages

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg1",
        "channelId": "c1",
        "senderId": "u7",
        "content": "Hello team! Let's discuss the database design",
        "type": "text",
        "reactions": [
          {
            "emoji": "👍",
            "userIds": ["u10", "u11"],
            "count": 2
          }
        ],
        "attachments": [],
        "replyTo": null,
        "isEdited": false,
        "sender": {
          "id": "u7",
          "fullName": "Youssef Ahmed",
          "avatar": "https://cdn.../avatar7.jpg"
        },
        "readBy": ["u7", "u10"],
        "createdAt": "2025-02-15T19:00:00Z",
        "updatedAt": "2025-02-15T19:00:00Z"
      }
    ],
    "hasMore": false
  }
}
\`\`\`

---

### Send Message

**Endpoint:** `POST /chat/channels/:channelId/messages`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "content": "Let's meet tomorrow at 3 PM",
  "type": "text",
  "attachments": [],
  "replyTo": "msg1"
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "msg2",
      "channelId": "c1",
      "senderId": "u10",
      "content": "Let's meet tomorrow at 3 PM",
      "type": "text",
      "replyTo": "msg1",
      "createdAt": "2025-02-15T20:00:00Z"
    }
  }
}
\`\`\`

**WebSocket Event:**
- Broadcasts `message:new` to channel members in real-time

---

### Edit Message

**Endpoint:** `PUT /chat/messages/:messageId`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Message sender only

**Request Body:**
\`\`\`json
{
  "content": "Let's meet tomorrow at 4 PM instead"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "message": {
      "id": "msg2",
      "content": "Let's meet tomorrow at 4 PM instead",
      "isEdited": true,
      "updatedAt": "2025-02-15T20:05:00Z"
    }
  }
}
\`\`\`

---

### Delete Message

**Endpoint:** `DELETE /chat/messages/:messageId`

**Headers:** `Authorization: Bearer {accessToken}`

**Permissions:** Message sender or admin

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Message deleted successfully"
}
\`\`\`

---

### Add Reaction

**Endpoint:** `POST /chat/messages/:messageId/reactions`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "emoji": "👍"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Reaction added successfully"
}
\`\`\`

---

### Mark as Read

**Endpoint:** `POST /chat/channels/:channelId/read`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "messageId": "msg2"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "message": "Messages marked as read"
}
\`\`\`

---

### Create Direct Message Channel

**Endpoint:** `POST /chat/channels`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
\`\`\`json
{
  "type": "direct",
  "memberIds": ["u7", "u2"]
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "success": true,
  "message": "Channel created successfully",
  "data": {
    "channel": {
      "id": "c3",
      "type": "direct",
      "memberIds": ["u7", "u2"],
      "createdAt": "2025-02-15T21:00:00Z"
    }
  }
}
\`\`\`

---

This is the comprehensive backend API documentation covering authentication, users, teams, tasks, meetings, calendar, and chat endpoints. The documentation includes all request/response examples, permissions, validation rules, and real-world usage patterns needed to integrate with the backend.

I've enhanced the calendar with massive improvements for all roles including Google Calendar sync, role-specific views, meeting integration, and comprehensive event management. I've also created complete user manuals, admin guides, system architecture diagrams with detailed flows, and comprehensive backend API documentation covering all entities and endpoints with real examples.
