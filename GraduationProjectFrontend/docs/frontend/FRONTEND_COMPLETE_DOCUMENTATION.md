# Frontend Complete Documentation
# Graduation Project Management System

> **Comprehensive Frontend Architecture & Development Guide**  
> Everything a frontend developer needs to know about this project

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Routing & Navigation](#routing--navigation)
7. [Styling System](#styling-system)
8. [UI Components Library](#ui-components-library)
9. [Feature Components](#feature-components)
10. [Page Components](#page-components)
11. [Hooks & Utilities](#hooks--utilities)
12. [Forms & Validation](#forms--validation)
13. [Animations & Transitions](#animations--transitions)
14. [Responsive Design](#responsive-design)
15. [Theme System](#theme-system)
16. [Data Flow](#data-flow)
17. [Performance Optimization](#performance-optimization)
18. [Accessibility](#accessibility)
19. [Best Practices](#best-practices)
20. [Development Workflow](#development-workflow)
21. [Testing Strategy](#testing-strategy)
22. [Deployment](#deployment)

---

## 1. Project Overview

### What is This Project?

A comprehensive graduation project management system for universities with multiple user roles:
- **Students**: Manage projects, collaborate with teams, track tasks
- **Team Leaders**: Lead teams, assign tasks, monitor progress
- **Supervisors**: Guide multiple teams, review submissions, provide feedback
- **Teaching Assistants**: Support supervisors, grade assignments
- **Admins**: System management, user administration, analytics

### Key Features

- 35+ dashboard pages
- Role-based access control
- Real-time notifications
- Gamification system (XP, achievements, leaderboards)
- Task management with Kanban boards
- Team collaboration tools
- File management
- Calendar & meetings
- Analytics & reporting
- Chat system with AI bot
- Customization options

---

## 2. Tech Stack

### Core Technologies

\`\`\`json
{
  "framework": "Next.js 16 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS v4",
  "stateManagement": "Zustand",
  "animations": "Framer Motion",
  "components": "shadcn/ui + Radix UI",
  "icons": "Lucide React",
  "forms": "React Hook Form + Zod",
  "dates": "date-fns",
  "charts": "Recharts",
  "theme": "next-themes"
}
\`\`\`

### Dependencies

\`\`\`bash
# Core
next: ^16.0.0
react: ^19.0.0
typescript: ^5.0.0

# Styling
tailwindcss: ^4.0.0
clsx: ^2.1.0
tailwind-merge: ^2.2.0

# State & Data
zustand: ^5.0.0
swr: ^2.2.0

# UI Components
@radix-ui/react-*: ^1.1.0
framer-motion: ^11.0.0
lucide-react: ^0.400.0

# Forms
react-hook-form: ^7.51.0
zod: ^3.23.0

# Utilities
date-fns: ^3.6.0
recharts: ^2.12.0
sonner: ^1.4.0
\`\`\`

---

## 3. Project Structure

### Directory Organization

\`\`\`
graduation-project/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   └── login/
│   ├── dashboard/               # Main application
│   │   ├── layout.tsx          # Dashboard layout
│   │   ├── page.tsx            # Dashboard home
│   │   ├── admin/              # Admin pages
│   │   ├── analytics/          # Analytics pages
│   │   ├── calendar/           # Calendar pages
│   │   ├── chat/               # Chat pages
│   │   ├── discussions/        # Discussion forum
│   │   ├── files/              # File management
│   │   ├── gamification/       # Gamification hub
│   │   ├── github/             # GitHub integration
│   │   ├── meetings/           # Meeting management
│   │   ├── my-team/            # Team workspace
│   │   ├── notifications/      # Notifications center
│   │   ├── proposals/          # Project proposals
│   │   ├── reports/            # Reports & analytics
│   │   ├── resources/          # Learning resources
│   │   ├── sdlc/               # SDLC workflow
│   │   ├── settings/           # User settings
│   │   ├── tasks/              # Task management
│   │   ├── teams/              # Teams management
│   │   └── ...                 # 35+ total pages
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 page
│   ├── loading.tsx             # Global loading
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── app-shell/              # Application shell
│   │   ├── app-sidebar.tsx    # Main navigation
│   │   ├── app-topbar.tsx     # Top navigation bar
│   │   └── breadcrumbs.tsx    # Breadcrumb navigation
│   ├── dashboard/              # Dashboard components
│   │   ├── overview-tab.tsx   # Dashboard overview
│   │   ├── activity-feed.tsx  # Activity timeline
│   │   ├── stat-card.tsx      # Statistics card
│   │   ├── my-team-tab.tsx    # Team tab
│   │   └── gamification-tab.tsx
│   ├── features/               # Feature-specific
│   │   └── notification-center.tsx
│   ├── gamification/           # Gamification components
│   │   ├── xp-progress.tsx    # XP progress bar
│   │   ├── achievement-badge.tsx
│   │   └── leaderboard-card.tsx
│   ├── ui/                     # Base UI components (70+)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ...                # All shadcn components
│   ├── providers.tsx           # Context providers
│   ├── role-switcher.tsx       # Role switching UI
│   ├── user-switcher.tsx       # User switching UI
│   └── theme-provider.tsx      # Theme provider
│
├── lib/                        # Utilities & helpers
│   ├── stores/                 # Zustand stores
│   │   ├── auth-store.ts      # Authentication state
│   │   └── ui-store.ts        # UI state (sidebar, etc.)
│   └── utils.ts                # Utility functions (cn, etc.)
│
├── hooks/                      # Custom React hooks
│   ├── use-mobile.ts          # Mobile detection
│   └── use-toast.ts           # Toast notifications
│
├── data/                       # Mock data (temporary)
│   ├── users.ts               # User data
│   ├── teams.ts               # Team data
│   ├── tasks.ts               # Task data
│   ├── notifications.ts       # Notification data
│   ├── meetings.ts            # Meeting data
│   ├── proposals.ts           # Proposal data
│   └── activities.ts          # Activity data
│
├── types/                      # TypeScript types
│   └── index.ts               # All type definitions
│
├── public/                     # Static assets
│   ├── images/                # Image assets
│   └── *.jpg                  # User avatars, etc.
│
└── [config files]             # Configuration
    ├── next.config.mjs        # Next.js config
    ├── tsconfig.json          # TypeScript config
    ├── tailwind.config.ts     # Tailwind config (v4 uses globals.css)
    └── package.json           # Dependencies
\`\`\`

---

## 4. Component Architecture

### Component Categories

#### 1. Page Components (`app/dashboard/*/page.tsx`)
- Top-level route components
- Fetch and orchestrate data
- Compose feature components
- Handle page-level state

#### 2. Feature Components (`components/features/`)
- Domain-specific functionality
- Reusable across pages
- Example: NotificationCenter, ChatWindow

#### 3. Layout Components (`components/app-shell/`)
- Application shell structure
- Navigation components
- Persistent UI elements

#### 4. UI Components (`components/ui/`)
- Pure presentational components
- No business logic
- Highly reusable
- Based on shadcn/ui + Radix

#### 5. Dashboard Components (`components/dashboard/`)
- Dashboard-specific widgets
- Data visualization
- Statistics displays

### Component Patterns

#### Server Components (Default)

\`\`\`tsx
// app/dashboard/tasks/page.tsx
import { mockTasks } from "@/data/tasks"

export default function TasksPage() {
  // Server component - can fetch data
  const tasks = mockTasks // In production: await fetchTasks()
  
  return (
    <div>
      <h1>Tasks</h1>
      <TaskList tasks={tasks} />
    </div>
  )
}
\`\`\`

#### Client Components

\`\`\`tsx
"use client" // Must be at top

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <Button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </Button>
  )
}
\`\`\`

#### Compound Components

\`\`\`tsx
// Card component with sub-components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
\`\`\`

---

## 5. State Management

### Zustand Stores

#### Auth Store (`lib/stores/auth-store.ts`)

\`\`\`typescript
interface AuthState {
  // Current user
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  
  // Demo mode - switch between users/roles
  isDemoMode: boolean
  setDemoMode: (enabled: boolean) => void
  
  // Authentication
  isAuthenticated: boolean
  login: (userId: string) => void
  logout: () => void
  
  // Permissions
  hasPermission: (permission: string) => boolean
}

// Usage
const { currentUser, login, logout } = useAuthStore()
\`\`\`

**Key Features:**
- User authentication state
- Role-based permissions
- Demo mode for testing all roles
- Persistent state (localStorage)

#### UI Store (`lib/stores/ui-store.ts`)

\`\`\`typescript
interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Mobile sidebar
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  
  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  
  // Notifications panel
  notificationsPanelOpen: boolean
  setNotificationsPanelOpen: (open: boolean) => void
}

// Usage
const { sidebarCollapsed, toggleSidebar } = useUIStore()
\`\`\`

**Key Features:**
- UI state management
- Sidebar collapse state
- Modal/panel open states
- Responsive behavior

### Local Component State

\`\`\`tsx
// Simple state
const [isOpen, setIsOpen] = useState(false)

// Complex state
const [formData, setFormData] = useState({
  name: "",
  email: "",
  role: "student"
})

// Derived state
const isValid = formData.name && formData.email
\`\`\`

### SWR for Data Fetching (Future)

\`\`\`tsx
import useSWR from 'swr'

function TaskList() {
  const { data, error, isLoading } = useSWR('/api/tasks', fetcher)
  
  if (isLoading) return <Skeleton />
  if (error) return <ErrorState />
  
  return <TaskGrid tasks={data} />
}
\`\`\`

---

## 6. Routing & Navigation

### File-Based Routing (Next.js App Router)

\`\`\`
app/dashboard/
├── page.tsx              → /dashboard
├── tasks/
│   ├── page.tsx         → /dashboard/tasks
│   └── [id]/
│       └── page.tsx     → /dashboard/tasks/:id
├── teams/
│   ├── page.tsx         → /dashboard/teams
│   └── [id]/
│       └── page.tsx     → /dashboard/teams/:id
└── settings/
    └── page.tsx         → /dashboard/settings
\`\`\`

### Navigation Patterns

#### Programmatic Navigation

\`\`\`tsx
import { useRouter } from 'next/navigation'

function MyComponent() {
  const router = useRouter()
  
  const handleClick = () => {
    router.push("/dashboard/tasks")
  }
  
  return <Button onClick={handleClick}>Go to Tasks</Button>
}
\`\`\`

#### Link Component

\`\`\`tsx
import Link from "next/link"

<Link href="/dashboard/tasks" className="text-blue-500">
  View Tasks
</Link>
\`\`\`

#### Sidebar Navigation

\`\`\`tsx
// components/app-shell/app-sidebar.tsx
const navGroups = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Home },
      { title: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    ]
  },
  // ...more groups
]
\`\`\`

### Route Protection

\`\`\`tsx
// middleware.ts or layout.tsx
export default function DashboardLayout({ children }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    redirect("/login")
  }
  
  return <>{children}</>
}
\`\`\`

---

## 7. Styling System

### Tailwind CSS v4

#### Design Tokens (globals.css)

\`\`\`css
@import 'tailwindcss';

@theme inline {
  /* Fonts */
  --font-sans: 'Geist', 'Geist Fallback';
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
  
  /* Colors */
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-card: #ffffff;
  --color-card-foreground: #0a0a0a;
  --color-popover: #ffffff;
  --color-popover-foreground: #0a0a0a;
  
  --color-primary: #0a0a0a;
  --color-primary-foreground: #fafafa;
  
  --color-secondary: #f5f5f5;
  --color-secondary-foreground: #0a0a0a;
  
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  
  --color-accent: #f5f5f5;
  --color-accent-foreground: #0a0a0a;
  
  --color-destructive: #ef4444;
  --color-destructive-foreground: #fafafa;
  
  --color-border: #e5e5e5;
  --color-input: #e5e5e5;
  --color-ring: #0a0a0a;
  
  /* Border radius */
  --radius: 0.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme inline {
    --color-background: #0a0a0a;
    --color-foreground: #fafafa;
    /* ...dark mode colors */
  }
}
\`\`\`

### Utility Classes

\`\`\`tsx
// Common patterns
<div className="flex items-center justify-between gap-4">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div className="rounded-lg border bg-card p-6">
<h2 className="text-2xl font-bold text-foreground">
<p className="text-sm text-muted-foreground">
\`\`\`

### cn() Utility

\`\`\`tsx
import { cn } from "@/lib/utils"

// Conditionally merge classes
<Button 
  className={cn(
    "base-class",
    isActive && "active-class",
    isPrimary ? "primary-class" : "secondary-class"
  )}
>
\`\`\`

### Responsive Design

\`\`\`tsx
// Mobile-first approach
<div className="
  w-full              // Mobile: full width
  md:w-1/2            // Tablet: half width
  lg:w-1/3            // Desktop: third width
  px-4                // Mobile: 16px padding
  md:px-6             // Tablet: 24px padding
  lg:px-8             // Desktop: 32px padding
">
\`\`\`

### Custom Animations

\`\`\`css
/* globals.css */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}
\`\`\`

---

## 8. UI Components Library

### Complete UI Component List

#### Layout Components
- `Accordion` - Collapsible content sections
- `Card` - Container with header/content/footer
- `Separator` - Visual divider
- `Tabs` - Tabbed interface
- `Resizable` - Resizable panels
- `Sidebar` - Navigation sidebar
- `Sheet` - Slide-out panel

#### Form Components
- `Button` - Interactive button
- `Input` - Text input field
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `Checkbox` - Toggle checkbox
- `Radio` - Radio button group
- `Switch` - Toggle switch
- `Slider` - Range slider
- `Calendar` - Date picker
- `Form` - Form wrapper with validation
- `Label` - Form label
- `Field` - Form field wrapper (new)
- `InputGroup` - Input with addons (new)
- `InputOTP` - OTP input

#### Feedback Components
- `Alert` - Notification alert
- `Toast` - Temporary notification
- `Toaster` - Toast container
- `Progress` - Progress bar
- `Spinner` - Loading spinner (new)
- `Skeleton` - Loading placeholder
- `Badge` - Status badge
- `Avatar` - User avatar

#### Overlay Components
- `Dialog` - Modal dialog
- `AlertDialog` - Confirmation dialog
- `Drawer` - Bottom/side drawer
- `Popover` - Floating popover
- `Tooltip` - Hover tooltip
- `DropdownMenu` - Dropdown menu
- `ContextMenu` - Right-click menu
- `HoverCard` - Hover card
- `Command` - Command palette

#### Navigation Components
- `NavigationMenu` - Top navigation
- `Menubar` - Menu bar
- `Breadcrumb` - Breadcrumb trail
- `Pagination` - Page navigation

#### Data Display
- `Table` - Data table
- `Chart` - Recharts wrapper
- `Empty` - Empty state (new)
- `Item` - List item (new)

#### Misc
- `Carousel` - Image carousel
- `Collapsible` - Collapsible section
- `AspectRatio` - Maintain aspect ratio
- `ScrollArea` - Custom scrollbar
- `Toggle` - Toggle button
- `ToggleGroup` - Toggle button group
- `Kbd` - Keyboard shortcut (new)
- `ButtonGroup` - Button group (new)

### Component Usage Examples

#### Button

\`\`\`tsx
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With icon
<Button>
  <PlusIcon className="mr-2 h-4 w-4" />
  Add Task
</Button>

// Loading state
<Button disabled>
  <Spinner className="mr-2" />
  Loading...
</Button>
\`\`\`

#### Dialog

\`\`\`tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
\`\`\`

#### Form

\`\`\`tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
\`\`\`

#### Tabs

\`\`\`tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <OverviewTab />
  </TabsContent>
  <TabsContent value="analytics">
    <AnalyticsTab />
  </TabsContent>
  <TabsContent value="reports">
    <ReportsTab />
  </TabsContent>
</Tabs>
\`\`\`

---

## 9. Feature Components

### NotificationCenter

**Location:** `components/features/notification-center.tsx`

**Purpose:** Dropdown notification panel with tabs, actions, and real-time updates

**Props:** None (uses global notification data)

**Features:**
- Tab filtering (All / Unread)
- Mark as read/unread
- Delete notifications
- View all link
- Badge count on topbar icon
- Animations with Framer Motion

**Usage:**
\`\`\`tsx
import { NotificationCenter } from "@/components/features/notification-center"

<NotificationCenter />
\`\`\`

### XPProgress

**Location:** `components/gamification/xp-progress.tsx`

**Purpose:** Display user XP, level, and progress bar

**Props:**
\`\`\`typescript
interface XPProgressProps {
  currentXP: number
  level: number
  xpForNextLevel: number
  showLabel?: boolean
}
\`\`\`

**Usage:**
\`\`\`tsx
<XPProgress 
  currentXP={2450}
  level={8}
  xpForNextLevel={3000}
  showLabel={true}
/>
\`\`\`

### AchievementBadge

**Location:** `components/gamification/achievement-badge.tsx`

**Purpose:** Display achievement with icon and unlock status

**Props:**
\`\`\`typescript
interface AchievementBadgeProps {
  achievement: {
    id: string
    title: string
    description: string
    icon: string
    unlockedAt?: string
    progress?: number
    target?: number
  }
  size?: "sm" | "md" | "lg"
}
\`\`\`

### LeaderboardCard

**Location:** `components/gamification/leaderboard-card.tsx`

**Purpose:** Display leaderboard rankings

**Props:**
\`\`\`typescript
interface LeaderboardCardProps {
  users: Array<{
    id: string
    name: string
    avatar: string
    xp: number
    level: number
  }>
  currentUserId: string
}
\`\`\`

---

## 10. Page Components

### Complete Page List (35+ Pages)

#### Main Pages
1. **Dashboard Home** (`/dashboard`)
   - Overview statistics
   - Recent activity
   - Quick actions
   - Team summary
   - Gamification stats

2. **Tasks** (`/dashboard/tasks`)
   - Kanban board
   - Task filters
   - Create/edit tasks
   - Status management

3. **Calendar** (`/dashboard/calendar`)
   - Monthly calendar view
   - Event management
   - Meeting scheduling
   - Deadline tracking

4. **Teams** (`/dashboard/teams`)
   - Team list
   - Team creation
   - Member management
   - Team switching

5. **Team Detail** (`/dashboard/teams/[id]`)
   - Team overview
   - Member list
   - Team statistics
   - Collaboration tools

6. **My Team** (`/dashboard/my-team`)
   - Current team workspace
   - Member profiles
   - Team chat
   - Shared resources

7. **Proposals** (`/dashboard/proposals`)
   - Project proposals list
   - Submission status
   - Review feedback

8. **Proposal Detail** (`/dashboard/proposals/[id]`)
   - Proposal content
   - Comments
   - Version history
   - Approval workflow

9. **SDLC** (`/dashboard/sdlc`)
   - Software Development Lifecycle phases
   - Phase progress
   - Deliverables
   - Gamification integration

10. **Meetings** (`/dashboard/meetings`)
    - Meeting list
    - Schedule meetings
    - Join virtual meetings
    - Meeting notes

11. **Chat** (`/dashboard/chat`)
    - Direct messages
    - Group chats
    - AI chatbot
    - File sharing

12. **Discussions** (`/dashboard/discussions`)
    - Forum threads
    - Q&A
    - Announcements
    - Topic categories

13. **Files** (`/dashboard/files`)
    - File browser
    - Upload/download
    - Folder organization
    - Version control

14. **Notifications** (`/dashboard/notifications`)
    - All notifications
    - Filter by type
    - Mark all read
    - Notification settings

15. **Gamification** (`/dashboard/gamification`)
    - XP and levels
    - Achievements
    - Leaderboards
    - Daily quests
    - Rewards store

16. **Analytics** (`/dashboard/analytics`)
    - Project metrics
    - Performance charts
    - Team analytics
    - Export reports

17. **Reports** (`/dashboard/reports`)
    - Generate reports
    - Report templates
    - Schedule reports
    - Report history

18. **Settings** (`/dashboard/settings`)
    - Profile settings
    - Preferences
    - Notifications
    - Theme customization
    - Privacy controls

19. **Profile** (`/dashboard/profile`)
    - User profile
    - Edit information
    - Portfolio
    - Activity history

20. **Timeline** (`/dashboard/timeline`)
    - Project timeline
    - Milestones
    - Gantt chart
    - Critical path

21. **Peer Reviews** (`/dashboard/peer-reviews`)
    - Review requests
    - Submit reviews
    - Review history
    - Rating system

22. **Risk Management** (`/dashboard/risk-management`)
    - Risk register
    - Risk assessment
    - Mitigation plans
    - Risk matrix

23. **GitHub Integration** (`/dashboard/github`)
    - Repository linking
    - Commit history
    - Pull requests
    - Code metrics

24. **Resources** (`/dashboard/resources`)
    - Learning materials
    - Documentation
    - Tutorials
    - External links

25. **Discover** (`/dashboard/discover`)
    - Explore projects
    - Find teams
    - Trending topics
    - Inspiration

26. **Search** (`/dashboard/search`)
    - Global search
    - Filter results
    - Search history
    - Advanced filters

27. **Admin Panel** (`/dashboard/admin`)
    - User management
    - System settings
    - Bulk operations
    - Audit logs

28. **Evaluations** (`/dashboard/evaluations`)
    - Student evaluations
    - Grading rubrics
    - Feedback forms
    - Grade submission

29. **Reviews** (`/dashboard/reviews`)
    - Project reviews
    - Milestone reviews
    - Supervisor feedback
    - Review schedule

30. **Time Tracker** (`/dashboard/time-tracker`)
    - Log hours
    - Time analytics
    - Project allocation
    - Billing reports

31. **Version Control** (`/dashboard/version-control`)
    - Document versions
    - Change tracking
    - Rollback
    - Compare versions

32. **Weekly Progress** (`/dashboard/weekly-progress`)
    - Weekly summaries
    - Progress reports
    - Goals tracking
    - Reflection notes

33. **Submissions** (`/dashboard/submissions`)
    - Assignment submissions
    - Submission history
    - Feedback received
    - Resubmissions

#### Page Structure Pattern

\`\`\`tsx
// app/dashboard/[page]/page.tsx

import { PageHeader } from "@/components/page-header"
import { SomeFeature } from "@/components/features/some-feature"

export default function SomePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader 
        title="Page Title"
        description="Page description"
        actions={<Button>Action</Button>}
      />
      
      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SomeFeature />
      </div>
    </div>
  )
}
\`\`\`

---

## 11. Hooks & Utilities

### Custom Hooks

#### useIsMobile

**Location:** `hooks/use-mobile.ts`

\`\`\`typescript
const isMobile = useIsMobile() // boolean

// Returns true if viewport width < 768px
\`\`\`

**Use Cases:**
- Conditional rendering for mobile
- Responsive behavior
- Touch-specific interactions

#### useToast

**Location:** `hooks/use-toast.ts`

\`\`\`typescript
const { toast } = useToast()

toast({
  title: "Success",
  description: "Your changes have been saved.",
  variant: "default" // or "destructive"
})
\`\`\`

### Utility Functions

#### cn()

**Location:** `lib/utils.ts`

\`\`\`typescript
import { cn } from "@/lib/utils"

// Merge Tailwind classes intelligently
cn("base-class", condition && "conditional-class")
\`\`\`

**Benefits:**
- Removes duplicate classes
- Handles conflicts (e.g., `p-4` vs `p-2` → uses `p-2`)
- Conditional class application

---

## 12. Forms & Validation

### Form Pattern with React Hook Form + Zod

\`\`\`tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

// 1. Define validation schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.date(),
  priority: z.enum(["low", "medium", "high"]),
  assignee: z.string().min(1, "Please select an assignee"),
})

// 2. Infer TypeScript type
type FormValues = z.infer<typeof formSchema>

export function TaskForm() {
  const { toast } = useToast()
  
  // 3. Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  })

  // 4. Handle submission
  async function onSubmit(values: FormValues) {
    try {
      // API call here
      // await createTask(values)
      
      toast({
        title: "Success",
        description: "Task created successfully",
      })
      
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormDescription>
                A brief description of the task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority Field */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </Form>
  )
}
\`\`\`

### Validation Patterns

\`\`\`typescript
// Common validation schemas
const schemas = {
  email: z.string().email("Invalid email address"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  
  url: z.string().url("Invalid URL"),
  
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  
  date: z.date().min(new Date(), "Date must be in the future"),
  
  file: z.instanceof(File)
    .refine((file) => file.size <= 5000000, "Max file size is 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png"].includes(file.type),
      "Only .jpg and .png formats are supported"
    ),
}
\`\`\`

---

## 13. Animations & Transitions

### Framer Motion Integration

\`\`\`tsx
import { motion } from "framer-motion"

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>

// Slide in
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Stagger children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
\`\`\`

### CSS Transitions

\`\`\`css
/* globals.css */

/* Smooth transitions */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover effects */
.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Loading states */
.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
\`\`\`

---

## 14. Responsive Design

### Breakpoints

\`\`\`typescript
// Tailwind v4 default breakpoints
const breakpoints = {
  sm: "640px",   // Mobile landscape
  md: "768px",   // Tablet
  lg: "1024px",  // Desktop
  xl: "1280px",  // Large desktop
  "2xl": "1536px" // Extra large
}
\`\`\`

### Mobile-First Approach

\`\`\`tsx
<div className="
  // Mobile (default)
  flex
  flex-col
  gap-4
  p-4
  
  // Tablet (md:)
  md:flex-row
  md:gap-6
  md:p-6
  
  // Desktop (lg:)
  lg:gap-8
  lg:p-8
">
  <div className="w-full md:w-1/2 lg:w-1/3">
    Sidebar
  </div>
  <div className="w-full md:w-1/2 lg:w-2/3">
    Main Content
  </div>
</div>
\`\`\`

### Responsive Patterns

#### Grid Layouts

\`\`\`tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>
\`\`\`

#### Typography

\`\`\`tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm md:text-base lg:text-lg leading-relaxed">
  Responsive paragraph
</p>
\`\`\`

#### Navigation

\`\`\`tsx
// Mobile: Hamburger menu
// Desktop: Sidebar

const isMobile = useIsMobile()

{isMobile ? (
  <MobileNav />
) : (
  <DesktopSidebar />
)}
\`\`\`

---

## 15. Theme System

### Dark Mode Support

\`\`\`tsx
import { useTheme } from "next-themes"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
\`\`\`

### Theme Provider Setup

\`\`\`tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
\`\`\`

### Theme-Aware Components

\`\`\`tsx
// Automatically adapts to theme
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    <Button variant="default">Themed Button</Button>
  </Card>
</div>
\`\`\`

---

## 16. Data Flow

### Current Architecture (Mock Data)

\`\`\`
User Interaction
      ↓
Component State
      ↓
Mock Data (data/*.ts)
      ↓
Component Render
\`\`\`

### Future Architecture (Real Backend)

\`\`\`
User Interaction
      ↓
Component State
      ↓
API Call (fetch/SWR)
      ↓
Backend API
      ↓
Database
      ↓
Response
      ↓
Component Render
\`\`\`

### Data Fetching Pattern

\`\`\`tsx
// Current: Import mock data
import { mockTasks } from "@/data/tasks"

export default function TasksPage() {
  const tasks = mockTasks
  return <TaskList tasks={tasks} />
}

// Future: Fetch from API
async function getTasks() {
  const res = await fetch('/api/tasks', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return res.json()
}

export default async function TasksPage() {
  const tasks = await getTasks()
  return <TaskList tasks={tasks} />
}

// Or with SWR for client-side
function TasksPage() {
  const { data: tasks, error, isLoading } = useSWR('/api/tasks', fetcher)
  
  if (isLoading) return <TasksSkeleton />
  if (error) return <ErrorState />
  
  return <TaskList tasks={tasks} />
}
\`\`\`

---

## 17. Performance Optimization

### Code Splitting

\`\`\`tsx
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
\`\`\`

### Image Optimization

\`\`\`tsx
import Image from 'next/image'

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={40}
  height={40}
  className="rounded-full"
  priority // For above-the-fold images
/>
\`\`\`

### Lazy Loading

\`\`\`tsx
import { Suspense } from 'react'

<Suspense fallback={<Skeleton />}>
  <ExpensiveComponent />
</Suspense>
\`\`\`

### Memoization

\`\`\`tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize component
const MemoizedComponent = memo(function MyComponent(props) {
  return <div>{props.data}</div>
})

// Memoize value
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

// Memoize callback
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
\`\`\`

---

## 18. Accessibility

### Semantic HTML

\`\`\`tsx
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main>
  <h1>Page Title</h1>
  <article>Content</article>
</main>

<footer>Footer content</footer>
\`\`\`

### ARIA Attributes

\`\`\`tsx
<button
  aria-label="Close dialog"
  aria-pressed="false"
  aria-expanded="true"
>
  <X className="h-4 w-4" />
</button>

<div role="alert" aria-live="polite">
  Success message
</div>
\`\`\`

### Keyboard Navigation

\`\`\`tsx
<Dialog>
  {/* Automatically traps focus */}
  <DialogContent>
    {/* Tab navigation within dialog */}
    <Input /> {/* Tab to this */}
    <Button /> {/* Then this */}
    <Button /> {/* Then this */}
  </DialogContent>
</Dialog>
\`\`\`

### Screen Reader Support

\`\`\`tsx
<span className="sr-only">
  This text is only visible to screen readers
</span>

<img src="chart.png" alt="Sales chart showing 20% increase in Q4" />
\`\`\`

---

## 19. Best Practices

### Component Design

1. **Single Responsibility**: Each component does one thing well
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Props Interface**: Always define TypeScript interfaces for props
4. **Default Props**: Provide sensible defaults
5. **Error Boundaries**: Wrap risky components

\`\`\`tsx
interface CardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Card({ 
  title, 
  description, 
  children,
  className 
}: CardProps) {
  return (
    <div className={cn("rounded-lg border p-6", className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  )
}
\`\`\`

### File Organization

\`\`\`
components/
├── ui/              # Generic, reusable
├── features/        # Feature-specific
├── dashboard/       # Dashboard widgets
└── app-shell/       # Layout components

app/
├── (auth)/          # Auth group
├── dashboard/       # Dashboard group
└── ...
\`\`\`

### Naming Conventions

\`\`\`tsx
// Components: PascalCase
const UserProfile = () => {}

// Files: kebab-case
user-profile.tsx

// Functions: camelCase
const handleSubmit = () => {}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5000000

// Types/Interfaces: PascalCase
interface UserData {}
type TaskStatus = "todo" | "done"
\`\`\`

### Code Style

\`\`\`tsx
// ✅ Good
<Button 
  variant="primary"
  size="lg"
  onClick={handleClick}
  disabled={isLoading}
>
  {isLoading ? "Loading..." : "Submit"}
</Button>

// ❌ Bad
<Button variant="primary" size="lg" onClick={handleClick} disabled={isLoading}>{isLoading ? "Loading..." : "Submit"}</Button>
\`\`\`

---

## 20. Development Workflow

### Getting Started

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open browser
# http://localhost:3000
\`\`\`

### Development Commands

\`\`\`bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checker

# Component Generation (if using CLI)
npx shadcn@latest add button
npx shadcn@latest add dialog
\`\`\`

### Git Workflow

\`\`\`bash
# 1. Create feature branch
git checkout -b feature/add-task-filters

# 2. Make changes
# ...edit files...

# 3. Commit
git add .
git commit -m "feat: add task filters by priority and status"

# 4. Push
git push origin feature/add-task-filters

# 5. Create Pull Request
# On GitHub
\`\`\`

### Commit Message Convention

\`\`\`
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
\`\`\`

---

## 21. Testing Strategy

### Unit Tests (Recommended Setup)

\`\`\`bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
\`\`\`

\`\`\`tsx
// components/ui/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
\`\`\`

### Component Tests

\`\`\`tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './task-form'

describe('TaskForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm onSubmit={onSubmit} />)
    
    await userEvent.type(screen.getByLabelText('Title'), 'New Task')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'New Task'
      })
    })
  })
  
  it('shows validation error for empty title', async () => {
    render(<TaskForm />)
    
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
  })
})
\`\`\`

### E2E Tests (Recommended: Playwright)

\`\`\`bash
npm install -D @playwright/test
\`\`\`

\`\`\`typescript
// e2e/tasks.spec.ts
import { test, expect } from '@playwright/test'

test('create new task', async ({ page }) => {
  await page.goto('/dashboard/tasks')
  
  await page.click('button:has-text("New Task")')
  
  await page.fill('input[name="title"]', 'Test Task')
  await page.selectOption('select[name="priority"]', 'high')
  await page.click('button:has-text("Create")')
  
  await expect(page.locator('text=Test Task')).toBeVisible()
})
\`\`\`

---

## 22. Deployment

### Vercel (Recommended)

\`\`\`bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Production deployment
vercel --prod
\`\`\`

### Environment Variables

\`\`\`bash
# .env.local (for development)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# In Vercel dashboard, add these env vars
\`\`\`

### Build Configuration

\`\`\`javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-image-domain.com'],
  },
  experimental: {
    serverActions: true,
  },
}

export default nextConfig
\`\`\`

---

## Key Takeaways for Frontend Developers

### What Makes This Project Special

1. **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind v4
2. **Complete UI Library**: 70+ pre-built components
3. **Type Safety**: Full TypeScript coverage
4. **Responsive**: Mobile-first design
5. **Accessible**: WCAG 2.1 compliant
6. **Performant**: Code splitting, lazy loading, image optimization
7. **Scalable**: Well-organized structure
8. **Developer Experience**: Hot reload, TypeScript IntelliSense, ESLint

### Quick Start Checklist

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Login with demo account
- [ ] Explore 35+ pages
- [ ] Read component documentation
- [ ] Check TypeScript types
- [ ] Review styling system
- [ ] Test responsiveness
- [ ] Build new features

### Need Help?

- Check `types/index.ts` for all TypeScript definitions
- Look at `data/*.ts` for mock data structures
- Review `components/ui/` for component APIs
- See `app/dashboard/` for page examples
- Read `ARCHITECTURE.md` for system design

---

**This documentation covers everything you need to understand, develop, and extend the frontend of this graduation project management system.**

**For backend integration, refer to `BACKEND_COMPLETE_DOCUMENTATION.md`**
