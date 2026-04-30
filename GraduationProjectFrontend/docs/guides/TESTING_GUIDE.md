# 🧪 Complete Testing Guide
## Unit, Integration, and E2E Testing

---

## Table of Contents
1. [Testing Setup](#testing-setup)
2. [Unit Testing](#unit-testing)
3. [Component Testing](#component-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [API Testing](#api-testing)
7. [Testing Best Practices](#testing-best-practices)

---

## 1. Testing Setup

### Install Dependencies

\`\`\`bash
# Testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest jest-environment-jsdom
npm install --save-dev @types/jest

# E2E testing
npm install --save-dev playwright @playwright/test
npx playwright install
\`\`\`

### Jest Configuration

\`\`\`javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
\`\`\`

\`\`\`javascript
// jest.setup.js
import '@testing-library/jest-dom'
\`\`\`

### Playwright Configuration

\`\`\`typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
\`\`\`

### Package.json Scripts

\`\`\`json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
\`\`\`

---

## 2. Unit Testing

### Testing Utilities

\`\`\`typescript
// lib/utils/__tests__/date-utils.test.ts
import { formatDate, isDateInPast, getDaysBetween } from '../date-utils'

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('should handle invalid dates', () => {
      expect(formatDate(null)).toBe('Invalid Date')
    })
  })

  describe('isDateInPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01')
      expect(isDateInPast(pastDate)).toBe(true)
    })

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01')
      expect(isDateInPast(futureDate)).toBe(false)
    })
  })

  describe('getDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-10')
      expect(getDaysBetween(start, end)).toBe(9)
    })
  })
})
\`\`\`

### Testing Stores

\`\`\`typescript
// lib/stores/__tests__/auth-store.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../auth-store'

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    })
  })

  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login user', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('S2021001', 'password123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.studentCode).toBe('S2021001')
  })

  it('should logout user', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('S2021001', 'password123')
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
\`\`\`

---

## 3. Component Testing

### Testing UI Components

\`\`\`typescript
// components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })

  it('should apply correct variant class', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
\`\`\`

### Testing Dashboard Components

\`\`\`typescript
// components/dashboard/__tests__/stat-card.test.tsx
import { render, screen } from '@testing-library/react'
import { StatCard } from '../stat-card'
import { Users } from 'lucide-react'

describe('StatCard Component', () => {
  const mockProps = {
    title: 'Total Users',
    value: '1,234',
    change: '+12.5%',
    isPositive: true,
    icon: Users,
  }

  it('should render all props correctly', () => {
    render(<StatCard {...mockProps} />)
    
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('should show positive change in green', () => {
    render(<StatCard {...mockProps} isPositive={true} />)
    const change = screen.getByText('+12.5%')
    expect(change).toHaveClass('text-green-600')
  })

  it('should show negative change in red', () => {
    render(<StatCard {...mockProps} change="-5.2%" isPositive={false} />)
    const change = screen.getByText('-5.2%')
    expect(change).toHaveClass('text-red-600')
  })
})
\`\`\`

### Testing with User Interactions

\`\`\`typescript
// components/features/__tests__/task-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '../task-form'

describe('TaskForm Component', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<TaskForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/title/i), 'New Task')
    await user.type(screen.getByLabelText(/description/i), 'Task description')
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
      })
    })
  })

  it('should show validation errors', async () => {
    const user = userEvent.setup()
    render(<TaskForm onSubmit={mockOnSubmit} />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
\`\`\`

---

## 4. Integration Testing

### Testing Page Components

\`\`\`typescript
// app/dashboard/teams/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import TeamsPage from '../page'
import { getTeams } from '@/lib/api/teams'

// Mock API
jest.mock('@/lib/api/teams')

describe('Teams Page', () => {
  const mockTeams = [
    { id: '1', name: 'Team Alpha', membersCount: 5 },
    { id: '2', name: 'Team Beta', membersCount: 4 },
  ]

  beforeEach(() => {
    (getTeams as jest.Mock).mockResolvedValue({ teams: mockTeams, total: 2 })
  })

  it('should render teams list', async () => {
    render(<TeamsPage />)

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
      expect(screen.getByText('Team Beta')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    render(<TeamsPage />)
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('should handle API errors', async () => {
    (getTeams as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    render(<TeamsPage />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
\`\`\`

---

## 5. E2E Testing

### Authentication Flow

\`\`\`typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="identifier"]', 'S2021001')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="identifier"]', 'invalid')
    await page.fill('[name="password"]', 'wrong')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[name="identifier"]', 'S2021001')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Logout
    await page.click('[aria-label="User menu"]')
    await page.click('text=Logout')

    await expect(page).toHaveURL('/login')
  })
})
\`\`\`

### Team Management Flow

\`\`\`typescript
// tests/e2e/teams.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="identifier"]', 'S2021001')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new team', async ({ page }) => {
    await page.goto('/dashboard/teams')
    await page.click('text=Create Team')

    await page.fill('[name="name"]', 'New Test Team')
    await page.fill('[name="description"]', 'Team description')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=New Test Team')).toBeVisible()
  })

  test('should invite team member', async ({ page }) => {
    await page.goto('/dashboard/my-team')
    await page.click('text=Invite Member')

    await page.fill('[name="email"]', 'newmember@example.com')
    await page.click('button:has-text("Send Invite")')

    await expect(page.locator('text=Invite sent')).toBeVisible()
  })

  test('should filter teams by status', async ({ page }) => {
    await page.goto('/dashboard/teams')
    
    await page.selectOption('[name="status"]', 'active')
    await page.waitForTimeout(500) // Wait for filter

    const teams = page.locator('[data-testid="team-card"]')
    const count = await teams.count()
    expect(count).toBeGreaterThan(0)
  })
})
\`\`\`

### Task Management Flow

\`\`\`typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="identifier"]', 'S2021001')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/tasks')
  })

  test('should create a new task', async ({ page }) => {
    await page.click('text=New Task')

    await page.fill('[name="title"]', 'Test Task')
    await page.fill('[name="description"]', 'Task description')
    await page.selectOption('[name="priority"]', 'high')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Test Task')).toBeVisible()
  })

  test('should drag and drop task between columns', async ({ page }) => {
    const task = page.locator('[data-task-id="task-1"]').first()
    const targetColumn = page.locator('[data-column="in-progress"]')

    await task.dragTo(targetColumn)

    await expect(targetColumn.locator('[data-task-id="task-1"]')).toBeVisible()
  })

  test('should switch between views', async ({ page }) => {
    await page.click('[data-view="list"]')
    await expect(page.locator('[data-testid="list-view"]')).toBeVisible()

    await page.click('[data-view="calendar"]')
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible()
  })
})
\`\`\`

---

## 6. API Testing

### Testing API Endpoints

\`\`\`typescript
// tests/api/__tests__/teams.test.ts
import { getTeams, createTeam, updateTeam } from '@/lib/api/teams'
import { apiClient } from '@/lib/api/client'

jest.mock('@/lib/api/client')

describe('Teams API', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getTeams', () => {
    it('should fetch teams successfully', async () => {
      const mockResponse = {
        data: {
          teams: [{ id: '1', name: 'Team 1' }],
          total: 1,
        },
      }
      
      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getTeams()

      expect(apiClient.get).toHaveBeenCalledWith('/teams', { params: undefined })
      expect(result.teams).toHaveLength(1)
    })

    it('should pass filters correctly', async () => {
      const mockResponse = { data: { teams: [], total: 0 } }
      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getTeams({ status: 'active', search: 'test' })

      expect(apiClient.get).toHaveBeenCalledWith('/teams', {
        params: { status: 'active', search: 'test' },
      })
    })
  })

  describe('createTeam', () => {
    it('should create team successfully', async () => {
      const newTeam = { name: 'New Team', description: 'Description' }
      const mockResponse = { data: { id: '1', ...newTeam } }
      
      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createTeam(newTeam)

      expect(apiClient.post).toHaveBeenCalledWith('/teams', newTeam)
      expect(result.name).toBe('New Team')
    })
  })
})
\`\`\`

---

## 7. Testing Best Practices

### General Guidelines

\`\`\`typescript
// ✅ DO: Use data-testid for complex selectors
<button data-testid="submit-button">Submit</button>
screen.getByTestId('submit-button')

// ✅ DO: Test user behavior, not implementation
await user.click(screen.getByRole('button', { name: /submit/i }))

// ❌ DON'T: Test implementation details
expect(component.state.count).toBe(5) // ❌
expect(screen.getByText('Count: 5')).toBeInTheDocument() // ✅

// ✅ DO: Use async/await for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// ✅ DO: Clean up after tests
afterEach(() => {
  jest.clearAllMocks()
  cleanup()
})
\`\`\`

### Test Organization

\`\`\`
tests/
├── unit/
│   ├── utils/
│   ├── hooks/
│   └── stores/
├── integration/
│   ├── components/
│   └── pages/
└── e2e/
    ├── auth.spec.ts
    ├── teams.spec.ts
    └── tasks.spec.ts
\`\`\`

### Coverage Goals

\`\`\`bash
# Run with coverage
npm run test:coverage

# Goals
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%
\`\`\`

---

## Summary Checklist

- [ ] Jest and Testing Library configured
- [ ] Playwright configured for E2E
- [ ] Unit tests for utilities
- [ ] Unit tests for stores
- [ ] Component tests for UI components
- [ ] Integration tests for pages
- [ ] E2E tests for critical flows
- [ ] API tests with mocked endpoints
- [ ] Test coverage > 80%
- [ ] CI/CD pipeline includes tests
- [ ] All tests passing

---

**Next Steps:**
1. Write tests as you develop features (TDD)
2. Run tests before committing
3. Monitor test coverage
4. Add visual regression testing (optional)
5. Set up continuous testing in CI/CD
