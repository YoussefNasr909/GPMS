# Developer Guide - ProjectHub

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Git
- Code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Next.js

### First-Time Setup

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd projecthub
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Copy environment variables**
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. **Run development server**
\`\`\`bash
npm run dev
\`\`\`

5. **Open browser**
Navigate to `http://localhost:3000`

### Development Workflow

1. Create a new branch for your feature
\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

2. Make your changes

3. Test your changes
\`\`\`bash
npm test
npm run lint
\`\`\`

4. Commit with conventional commits
\`\`\`bash
git commit -m "feat: add new feature"
\`\`\`

5. Push and create pull request
\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

---

## Code Standards

### TypeScript Guidelines

✅ **DO:**
\`\`\`typescript
// Use explicit types
interface UserProps {
  name: string
  age: number
}

// Use type inference when obvious
const count = 5 // number is inferred

// Use const assertions for literal types
const ROLES = ["student", "doctor", "admin"] as const
\`\`\`

❌ **DON'T:**
\`\`\`typescript
// Avoid 'any' type
const data: any = fetchData() // ❌

// Don't use var
var count = 5 // ❌ Use const or let

// Don't disable ESLint rules without reason
// eslint-disable-next-line // ❌
\`\`\`

### React Best Practices

✅ **DO:**
\`\`\`typescript
// Use functional components
export function MyComponent({ title }: Props) {
  return <div>{title}</div>
}

// Destructure props
function Card({ title, description }: CardProps) {
  return (...)
}

// Use custom hooks for logic
function useUserData(userId: string) {
  const [data, setData] = useState(null)
  // ... logic
  return data
}
\`\`\`

❌ **DON'T:**
\`\`\`typescript
// Avoid class components (unless necessary)
class MyComponent extends React.Component {} // ❌

// Don't mutate state directly
state.count++ // ❌
setState({ count: state.count + 1 }) // ✅

// Don't define components inside components
function Parent() {
  function Child() { return ... } // ❌
  return <Child />
}
\`\`\`

### Styling Guidelines

✅ **DO:**
\`\`\`tsx
// Use Tailwind utility classes
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">

// Use semantic color tokens
<div className="bg-background text-foreground">

// Group related classes
<div className="
  // Layout
  flex items-center justify-between
  // Spacing
  p-6 gap-4
  // Styling
  bg-card rounded-lg shadow-lg
">
\`\`\`

❌ **DON'T:**
\`\`\`tsx
// Don't use inline styles (unless dynamic)
<div style={{ padding: '24px' }}> // ❌

// Don't use arbitrary values unnecessarily
<div className="p-[24px]"> // ❌ Use p-6

// Don't mix Tailwind with CSS modules
<div className="myclass p-4"> // ❌ Choose one approach
\`\`\`

---

## Adding New Features

### Step 1: Create Types

\`\`\`typescript
// types/index.ts
export interface NewFeature {
  id: string
  name: string
  // ... other properties
}
\`\`\`

### Step 2: Create Data/API

\`\`\`typescript
// data/new-feature.ts
export const mockNewFeatures: NewFeature[] = [
  { id: "1", name: "Feature 1" }
]
\`\`\`

### Step 3: Create Components

\`\`\`typescript
// components/features/new-feature.tsx
export function NewFeatureCard({ feature }: { feature: NewFeature }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{feature.name}</CardTitle>
      </CardHeader>
    </Card>
  )
}
\`\`\`

### Step 4: Create Page

\`\`\`typescript
// app/dashboard/new-feature/page.tsx
export default function NewFeaturePage() {
  const features = mockNewFeatures
  
  return (
    <div>
      <h1>New Feature</h1>
      {features.map(feature => (
        <NewFeatureCard key={feature.id} feature={feature} />
      ))}
    </div>
  )
}
\`\`\`

### Step 5: Add to Navigation

\`\`\`typescript
// components/app-shell/app-sidebar.tsx
const items = [
  // ...existing items
  {
    title: "New Feature",
    url: "/dashboard/new-feature",
    icon: Sparkles,
  }
]
\`\`\`

---

## Common Tasks

### Adding a New UI Component

\`\`\`bash
# Use shadcn CLI to add components
npx shadcn@latest add dialog
npx shadcn@latest add select
\`\`\`

### Creating a New Store

\`\`\`typescript
// lib/stores/my-store.ts
import { create } from 'zustand'

interface MyStore {
  count: number
  increment: () => void
  decrement: () => void
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
\`\`\`

### Adding Animation

\`\`\`typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
\`\`\`

### Handling Forms

\`\`\`typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      <Input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      <Button type="submit">Submit</Button>
    </form>
  )
}
\`\`\`

---

## Debugging Tips

### Using React DevTools

1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Inspect component props and state

### Using Zustand DevTools

\`\`\`typescript
import { devtools } from 'zustand/middleware'

export const useMyStore = create(
  devtools(
    (set) => ({
      // store implementation
    }),
    { name: 'MyStore' }
  )
)
\`\`\`

### Console Debugging

\`\`\`typescript
// Use v0 prefix for debugging
console.log('[v0] User data:', userData)
console.log('[v0] State update:', { before, after })
\`\`\`

### Network Debugging

1. Open DevTools → Network tab
2. Filter by Fetch/XHR
3. Inspect request/response

---

## Performance Optimization

### Code Splitting

\`\`\`typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
})
\`\`\`

### Memoization

\`\`\`typescript
import { useMemo, useCallback } from 'react'

function MyComponent({ items }) {
  // Memoize expensive calculations
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  
  // Memoize callbacks
  const handleClick = useCallback(
    (id: string) => {
      console.log('Clicked:', id)
    },
    []
  )
  
  return (...)
}
\`\`\`

### Image Optimization

\`\`\`typescript
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // For above-the-fold images
/>
\`\`\`

---

## Troubleshooting

### Common Issues

**Issue**: Module not found
\`\`\`
Error: Cannot find module '@/components/...'
\`\`\`
**Solution**: Check import path and file location

**Issue**: Hydration errors
\`\`\`
Error: Hydration failed because the initial UI...
\`\`\`
**Solution**: Ensure server and client render the same content

**Issue**: Build errors
\`\`\`
Type error: Property 'x' does not exist on type 'Y'
\`\`\`
**Solution**: Check TypeScript types and interfaces

---

## Additional Resources

- VS Code Extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

- Useful Commands:
\`\`\`bash
npm run dev        # Start dev server
npm run build      # Create production build
npm run lint       # Run ESLint
npm run type-check # Check TypeScript errors
\`\`\`

---

**Happy Coding! 🚀**
