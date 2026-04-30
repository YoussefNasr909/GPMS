# ProjectHub - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Code Structure](#code-structure)
4. [Component Library](#component-library)
5. [State Management](#state-management)
6. [Data Models](#data-models)
7. [API Routes](#api-routes)
8. [Authentication Flow](#authentication-flow)
9. [Role-Based Access Control](#role-based-access-control)
10. [Features by Module](#features-by-module)
11. [Design System](#design-system)
12. [Testing Guide](#testing-guide)
13. [Deployment](#deployment)

---

## Overview

ProjectHub is a comprehensive academic project management platform designed for graduation projects. It supports four user roles (Students, Team Leaders, Doctors, TAs, and Admins) with distinct features and workflows.

### Key Technologies
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **State Management**: Zustand
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

---

## System Architecture

### High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │  State Mgmt  │  │   Routing    │     │
│  │  (React)     │  │  (Zustand)   │  │  (Next.js)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Application Layer (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  App Router  │  │  Server      │  │  API Routes  │     │
│  │  (Pages)     │  │  Components  │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Mock/DB)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Users     │  │    Teams     │  │    Tasks     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Request Flow

1. **User Action** → UI Component triggers state update
2. **State Change** → Zustand store updates
3. **Re-render** → React components reflect new state
4. **Data Fetch** → Server components/API routes retrieve data
5. **Response** → UI updates with new data

---

## Code Structure

### Recommended File Organization

\`\`\`
projecthub/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/               
│   │   ├── register/            
│   │   └── verify-email/        
│   ├── dashboard/               # Protected dashboard routes
│   │   ├── page.tsx            # Main dashboard (role-based)
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── tasks/              # Task management
│   │   ├── teams/              # Team management
│   │   ├── sdlc/               # SDLC phases
│   │   ├── proposals/          # Project proposals
│   │   ├── submissions/        # Submission system
│   │   ├── meetings/           # Meeting scheduler
│   │   ├── chat/               # Real-time chat with AI bot
│   │   ├── files/              # File management
│   │   ├── calendar/           # Calendar & events
│   │   ├── notifications/      # Notification center
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── reports/            # Report generation
│   │   ├── gamification/       # Gamification hub
│   │   ├── settings/           # User settings & customization
│   │   ├── github/             # GitHub integration
│   │   ├── discussions/        # Forum discussions
│   │   ├── resources/          # Learning resources
│   │   ├── peer-reviews/       # Peer review system
│   │   ├── risk-management/    # Risk tracking
│   │   ├── time-tracker/       # Time tracking
│   │   └── admin/              # Admin panel
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
│
├── components/                  # Reusable React components
│   ├── ui/                     # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── ...
│   ├── app-shell/              # Layout components
│   │   ├── app-sidebar.tsx    # Main navigation sidebar
│   │   ├── app-topbar.tsx     # Top navigation bar
│   │   └── mobile-menu.tsx    # Mobile navigation
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── stat-card.tsx      # Statistics cards
│   │   ├── activity-feed.tsx  # Activity timeline
│   │   ├── overview-tab.tsx   # Dashboard overview
│   │   ├── gamification-tab.tsx
│   │   └── my-team-tab.tsx
│   ├── gamification/           # Gamification components
│   │   ├── xp-progress.tsx
│   │   ├── achievement-badge.tsx
│   │   └── leaderboard-card.tsx
│   ├── features/               # Feature-specific components
│   │   ├── notification-center.tsx
│   │   ├── task-board.tsx
│   │   └── calendar-view.tsx
│   └── providers.tsx           # React context providers
│
├── lib/                        # Utility libraries
│   ├── stores/                 # Zustand state stores
│   │   ├── auth-store.ts      # Authentication state
│   │   ├── ui-store.ts        # UI state (theme, sidebar)
│   │   ├── team-store.ts      # Team management state
│   │   └── system-store.ts    # System-wide state
│   ├── utils/                  # Helper functions
│   │   ├── team-utils.ts      # Team-related utilities
│   │   └── date-utils.ts      # Date formatting
│   ├── guards/                 # Route guards
│   │   └── route-guard.tsx    # Authentication guard
│   └── utils.ts                # Common utilities (cn, etc.)
│
├── data/                       # Mock data (will be replaced by DB)
│   ├── users.ts               # User data
│   ├── teams.ts               # Team data
│   ├── tasks.ts               # Task data
│   ├── meetings.ts            # Meeting data
│   ├── notifications.ts       # Notification data
│   └── activities.ts          # Activity feed data
│
├── types/                      # TypeScript type definitions
│   └── index.ts               # All type definitions
│
├── hooks/                      # Custom React hooks
│   ├── use-mobile.tsx         # Mobile detection hook
│   └── use-toast.ts           # Toast notification hook
│
├── public/                     # Static assets
│   ├── images/                # Image assets
│   ├── icons/                 # Icon files
│   └── ...
│
├── .env.example               # Environment variables template
├── next.config.mjs            # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind configuration
├── package.json               # Dependencies
├── README.md                  # Project overview
├── FEATURES.md                # Feature documentation
├── ARCHITECTURE.md            # Architecture guide
└── DOCUMENTATION.md           # This file
\`\`\`

### Code Organization Best Practices

✅ **DO:**
- Group related files by feature/module
- Use descriptive file and folder names
- Keep components small and focused (< 300 lines)
- Separate business logic from UI components
- Use barrel exports (index.ts) for cleaner imports
- Co-locate tests with source files

❌ **DON'T:**
- Mix different concerns in one file
- Create deeply nested folder structures (max 4 levels)
- Use generic names like "utils" without context
- Store business logic in components

---

## Component Library

### Base UI Components (shadcn/ui)

All base components are in `components/ui/` and follow shadcn/ui patterns:

#### Button Component
\`\`\`tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
\`\`\`

**Variants:**
- `default` - Primary button with background
- `destructive` - Red destructive action
- `outline` - Border only
- `secondary` - Secondary style
- `ghost` - Transparent background
- `link` - Text link style

#### Card Component
\`\`\`tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
\`\`\`

#### Dialog Component
\`\`\`tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
\`\`\`

### Custom Components

#### StatCard Component
\`\`\`tsx
import { StatCard } from "@/components/dashboard/stat-card"

<StatCard
  title="Total Tasks"
  value="24"
  change="+12%"
  trend="up"
  icon={CheckCircle2}
/>
\`\`\`

**Props:**
- `title`: string - Card title
- `value`: string | number - Main value to display
- `change`: string - Percentage change (optional)
- `trend`: "up" | "down" | "neutral" - Trend indicator
- `icon`: LucideIcon - Icon component

#### XPProgress Component
\`\`\`tsx
import { XPProgress } from "@/components/gamification/xp-progress"

<XPProgress
  currentXP={450}
  level={5}
  xpToNextLevel={500}
  streak={7}
/>
\`\`\`

---

## State Management

### Zustand Store Architecture

We use Zustand for lightweight, performant state management.

#### Auth Store (`lib/stores/auth-store.ts`)

\`\`\`typescript
interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  login: async (email, password) => {
    // Login logic
    set({ currentUser: user, isAuthenticated: true })
  },
  logout: () => {
    set({ currentUser: null, isAuthenticated: false })
  },
  switchRole: (role) => {
    set((state) => ({
      currentUser: { ...state.currentUser!, role }
    }))
  }
}))
\`\`\`

**Usage in components:**
\`\`\`tsx
const { currentUser, login, logout } = useAuthStore()
\`\`\`

#### UI Store (`lib/stores/ui-store.ts`)

\`\`\`typescript
interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}
\`\`\`

**Usage:**
\`\`\`tsx
const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore()
\`\`\`

### Store Best Practices

✅ **DO:**
- Keep stores focused on single concerns
- Use computed values (derived state) sparingly
- Avoid storing derived data
- Use actions for state mutations
- Subscribe to specific slices, not entire store

❌ **DON'T:**
- Store UI component state in global stores
- Create circular dependencies between stores
- Mutate state directly (always use actions)
- Store temporary form data globally

---

## Data Models

### Core Type Definitions

All types are defined in `types/index.ts`:

#### User Types
\`\`\`typescript
export type UserRole = 
  | "student" 
  | "team_leader" 
  | "doctor" 
  | "ta" 
  | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  studentCode?: string
  department?: string
  specialization?: string
  
  // Gamification
  xp: number
  level: number
  coins: number
  streak: number
  achievements: Achievement[]
  
  // Settings
  preferences?: UserPreferences
  theme?: CustomTheme
}

export interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  theme: "light" | "dark" | "system"
  language: "en" | "ar"
  dashboardLayout: "default" | "compact" | "comfortable"
}
\`\`\`

#### Team Types
\`\`\`typescript
export interface Team {
  id: string
  name: string
  projectTitle: string
  description: string
  avatar?: string
  
  // Members
  memberIds: string[]
  leaderId: string
  doctorId?: string
  taId?: string
  
  // Project details
  techStack: string[]
  category: string
  status: "planning" | "in-progress" | "review" | "completed"
  
  // Progress
  progress: number
  currentPhase: SDLCPhase
  health: "excellent" | "good" | "at-risk" | "critical"
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  deadline?: Date
}
\`\`\`

#### Task Types
\`\`\`typescript
export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  
  // Assignment
  teamId: string
  assignedTo: string[]
  createdBy: string
  
  // Categorization
  phase: SDLCPhase
  tags: string[]
  
  // Rewards
  xpReward: number
  coinReward: number
  
  // Dates
  dueDate?: Date
  createdAt: Date
  completedAt?: Date
}
\`\`\`

#### Gamification Types
\`\`\`typescript
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  xpReward: number
  unlockedAt?: Date
  progress: number
  maxProgress: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "seasonal"
  xpReward: number
  coinReward: number
  requirements: ChallengeRequirement[]
  expiresAt: Date
}
\`\`\`

---

## API Routes

### Route Structure

API routes follow Next.js 16 App Router conventions:

\`\`\`
app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   └── logout/route.ts
├── users/
│   ├── route.ts              # GET /api/users
│   └── [id]/route.ts         # GET /api/users/:id
├── teams/
│   ├── route.ts              # GET, POST /api/teams
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE /api/teams/:id
│       └── members/route.ts  # GET, POST /api/teams/:id/members
├── tasks/
│   ├── route.ts
│   └── [id]/route.ts
└── github/
    ├── repos/route.ts
    └── commits/route.ts
\`\`\`

### Example API Route

\`\`\`typescript
// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    // Fetch teams
    const teams = await fetchTeams(userId)
    
    return NextResponse.json(teams)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    if (!body.name || !body.projectTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create team
    const team = await createTeam(body)
    
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
\`\`\`

---

## Authentication Flow

### Login Flow

\`\`\`
1. User enters credentials → Login Form
2. Form submits → useAuthStore.login()
3. Store validates → Check against data/users.ts
4. Success → Set currentUser, isAuthenticated = true
5. Redirect → /dashboard (role-based)
\`\`\`

### Registration Flow

\`\`\`
1. User fills registration form
2. Validation → Email, password, student code
3. Create user → Add to users array
4. Send verification email (simulated)
5. Redirect → /verify-email
6. Enter OTP → Verify code
7. Success → Redirect to /login
\`\`\`

### Role-Based Redirects

\`\`\`typescript
const getRoleRedirect = (role: UserRole) => {
  switch (role) {
    case "student":
    case "team_leader":
      return "/dashboard"
    case "doctor":
    case "ta":
      return "/dashboard"
    case "admin":
      return "/dashboard"
    default:
      return "/login"
  }
}
\`\`\`

---

## Role-Based Access Control

### Permission Matrix

| Feature | Student | Team Leader | Doctor | TA | Admin |
|---------|---------|-------------|--------|-----|-------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Team | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assign Tasks | ❌ | ✅ | ✅ | ✅ | ✅ |
| Review Submissions | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve Proposals | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gamification | ✅ | ✅ | ❌ | ❌ | ❌ |

### Implementation

\`\`\`typescript
// lib/guards/route-guard.tsx
export function withAuth(Component: React.ComponentType, allowedRoles: UserRole[]) {
  return function AuthGuard(props: any) {
    const { currentUser, isAuthenticated } = useAuthStore()
    
    if (!isAuthenticated) {
      redirect('/login')
    }
    
    if (!allowedRoles.includes(currentUser.role)) {
      redirect('/unauthorized')
    }
    
    return <Component {...props} />
  }
}

// Usage
const AdminPage = withAuth(AdminPageContent, ["admin"])
\`\`\`

---

## Features by Module

### Dashboard Module
**File**: `app/dashboard/page.tsx`

Features:
- Role-based dashboard views
- Statistics cards with real-time data
- Activity feed
- Quick actions
- Tab-based navigation (Overview, Gamification, My Team)

### Tasks & Boards Module
**File**: `app/dashboard/tasks/page.tsx`

Features:
- Multiple views (Kanban, List, Timeline, Calendar)
- Task creation and assignment
- Priority and status management
- Filtering and search
- XP rewards for completion
- Team leader: Review and approval system

### SDLC Module
**File**: `app/dashboard/sdlc/page.tsx`

Features:
- Phase tracking (Requirements, Design, Development, Testing, Deployment)
- Deliverable management
- File uploads with versioning
- Milestone tracking
- Progress visualization
- Blocker reporting

### Chat Module
**File**: `app/dashboard/chat/page.tsx`

Features:
- Real-time messaging
- Channel-based conversations
- Direct messages
- AI chatbot assistant
- File sharing
- Message reactions
- Read receipts

### Gamification Module
**File**: `app/dashboard/gamification/page.tsx`

Features:
- XP and level tracking
- Achievement system with progress bars
- Global leaderboard (top 100)
- Team competitions
- Daily/weekly challenges
- Reward store
- Skill badges

### Analytics Module
**File**: `app/dashboard/analytics/page.tsx`

Features:
- Team performance metrics
- Task completion analytics
- Member productivity tracking
- Timeline visualization
- Exportable reports
- Trend analysis

---

## Design System

### Color System

Our design uses a professional formal color palette:

**Light Mode:**
- Background: `oklch(0.99 0.002 90)` - Warm white
- Primary: `oklch(0.45 0.15 265)` - Deep indigo
- Accent: `oklch(0.55 0.12 195)` - Refined teal
- Secondary: `oklch(0.92 0.01 270)` - Refined slate

**Dark Mode:**
- Background: `oklch(0.13 0.01 270)` - Rich charcoal
- Primary: `oklch(0.65 0.2 265)` - Brighter indigo
- Accent: `oklch(0.65 0.15 195)` - Vibrant teal

### Typography

\`\`\`css
Font Family: Geist (body), Geist Mono (code)
Scale:
- text-xs: 0.75rem
- text-sm: 0.875rem
- text-base: 1rem
- text-lg: 1.125rem
- text-xl: 1.25rem
- text-2xl: 1.5rem
- text-3xl: 1.875rem
- text-4xl: 2.25rem
\`\`\`

### Spacing System

Following Tailwind's 4px base unit:
\`\`\`
1 = 0.25rem (4px)
2 = 0.5rem (8px)
4 = 1rem (16px)
6 = 1.5rem (24px)
8 = 2rem (32px)
12 = 3rem (48px)
16 = 4rem (64px)
\`\`\`

### Component Patterns

#### Glass Morphism
\`\`\`tsx
<div className="glass rounded-xl p-6">
  {/* Content with frosted glass effect */}
</div>
\`\`\`

#### Gradient Text
\`\`\`tsx
<h1 className="gradient-text text-4xl font-bold">
  Gradient Title
</h1>
\`\`\`

#### Hover Lift
\`\`\`tsx
<Card className="hover-lift cursor-pointer">
  {/* Card lifts on hover */}
</Card>
\`\`\`

---

## Testing Guide

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
\`\`\`

### Writing Tests

#### Component Test Example
\`\`\`typescript
// components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByText('Delete')
    expect(button).toHaveClass('bg-destructive')
  })
})
\`\`\`

#### Store Test Example
\`\`\`typescript
// lib/stores/auth-store.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from './auth-store'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: null, isAuthenticated: false })
  })
  
  it('logs in successfully', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.login('john@example.com', 'password123')
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.currentUser).toBeTruthy()
  })
})
\`\`\`

---

## Deployment

### Environment Variables

Create `.env.local` file:

\`\`\`env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ProjectHub

# Database (when implemented)
DATABASE_URL=postgresql://user:password@localhost:5432/projecthub

# Authentication (when implemented)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# GitHub Integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI Features (optional)
OPENAI_API_KEY=your-openai-key
\`\`\`

### Build Commands

\`\`\`bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
\`\`\`

### Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

\`\`\`bash
# Or use Vercel CLI
npm i -g vercel
vercel deploy
\`\`\`

### Performance Optimization

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Use Next.js Image component
- **Font Optimization**: Self-host with next/font
- **Bundle Analysis**: `npm run build -- --analyze`

---

## Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [Zustand](https://github.com/pmndrs/zustand)

### Internal Documentation
- `README.md` - Project overview and setup
- `FEATURES.md` - Complete feature list
- `ARCHITECTURE.md` - System architecture details

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainers**: ProjectHub Development Team
