# 🔧 Troubleshooting Guide
## Common Issues and Solutions

---

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Development Server Issues](#development-server-issues)
3. [Build Issues](#build-issues)
4. [Runtime Errors](#runtime-errors)
5. [Styling Issues](#styling-issues)
6. [API Integration Issues](#api-integration-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)

---

## 1. Installation Issues

### Issue: npm install fails

**Error:**
\`\`\`
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
\`\`\`

**Solutions:**
\`\`\`bash
# Solution 1: Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2: Use legacy peer deps
npm install --legacy-peer-deps

# Solution 3: Use yarn instead
yarn install
\`\`\`

### Issue: Node version incompatibility

**Error:**
\`\`\`
The engine "node" is incompatible with this module
\`\`\`

**Solution:**
\`\`\`bash
# Check your Node version
node --version

# Install correct version (18.17+ required)
nvm install 18.18.0
nvm use 18.18.0

# Or update Node.js from nodejs.org
\`\`\`

---

## 2. Development Server Issues

### Issue: Port 3000 already in use

**Error:**
\`\`\`
Error: listen EADDRINUSE: address already in use :::3000
\`\`\`

**Solutions:**
\`\`\`bash
# Solution 1: Kill the process
# On Mac/Linux
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Solution 2: Use different port
npm run dev -- -p 3001
\`\`\`

### Issue: Hot reload not working

**Symptoms:** Changes don't reflect in browser

**Solutions:**
\`\`\`bash
# Solution 1: Clear Next.js cache
rm -rf .next
npm run dev

# Solution 2: Check file watchers limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Solution 3: Disable browser cache
# Open DevTools → Network → Disable cache
\`\`\`

###Issue: "Module not found" errors

**Error:**
\`\`\`
Module not found: Can't resolve '@/components/...'
\`\`\`

**Solutions:**
\`\`\`typescript
// Solution 1: Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}

// Solution 2: Restart TypeScript server in VS Code
// Cmd/Ctrl + Shift + P → TypeScript: Restart TS Server

// Solution 3: Check file exists and has correct export
\`\`\`

---

## 3. Build Issues

### Issue: Type errors during build

**Error:**
\`\`\`
Type error: Property 'x' does not exist on type 'Y'
\`\`\`

**Solutions:**
\`\`\`typescript
// Solution 1: Fix type definitions
interface Props {
  x: string // Add missing property
}

// Solution 2: Add type assertion
const data = response.data as MyType

// Solution 3: Skip type checking temporarily (not recommended)
// next.config.js
module.exports = {
  typescript: {
    ignoreBuildErrors: true, // Only for debugging
  },
}
\`\`\`

### Issue: Build runs out of memory

**Error:**
\`\`\`
FATAL ERROR: Ineffective mark-compacts near heap limit
\`\`\`

**Solutions:**
\`\`\`bash
# Solution 1: Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Solution 2: Add to package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}

# Solution 3: Optimize bundle size
# Check bundle analyzer
npm install @next/bundle-analyzer
\`\`\`

### Issue: Missing environment variables in build

**Error:**
\`\`\`
ReferenceError: process is not defined
\`\`\`

**Solutions:**
\`\`\`typescript
// Solution 1: Use NEXT_PUBLIC_ prefix for client-side vars
NEXT_PUBLIC_API_URL=http://localhost:8000

// Solution 2: Check .env.local exists
cp .env.example .env.local

// Solution 3: Add to next.config.js
module.exports = {
  env: {
    CUSTOM_VAR: process.env.CUSTOM_VAR,
  },
}
\`\`\`

---

## 4. Runtime Errors

### Issue: Hydration errors

**Error:**
\`\`\`
Error: Hydration failed because the initial UI does not match 
what was rendered on the server
\`\`\`

**Solutions:**
\`\`\`typescript
// Solution 1: Use client component for dynamic content
'use client'

import { useState, useEffect } from 'react'

export function Component() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <div>{/* Dynamic content */}</div>
}

// Solution 2: Suppress hydration warning for specific element
<div suppressHydrationWarning>
  {new Date().toISOString()}
</div>

// Solution 3: Check for browser-only code
if (typeof window !== 'undefined') {
  // Browser-only code
}
\`\`\`

### Issue: "Cannot read property of undefined"

**Error:**
\`\`\`
TypeError: Cannot read property 'map' of undefined
\`\`\`

**Solutions:**
\`\`\`typescript
// Solution 1: Add optional chaining
{data?.items?.map((item) => ...)}

// Solution 2: Provide default value
{(data?.items || []).map((item) => ...)}

// Solution 3: Add loading/error states
if (!data) return <Loading />
if (error) return <Error />
return <div>{data.items.map(...)}</div>
\`\`\`

### Issue: Infinite re-renders

**Error:**
\`\`\`
Error: Too many re-renders. React limits the number of renders
\`\`\`

**Solutions:**
\`\`\`typescript
// ❌ Wrong: setState in render
function Component() {
  const [count, setCount] = useState(0)
  setCount(count + 1) // Infinite loop!
  return <div>{count}</div>
}

// ✅ Correct: setState in effect
function Component() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    setCount(count + 1)
  }, []) // Empty deps
  
  return <div>{count}</div>
}

// ✅ Correct: setState in event handler
function Component() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}
\`\`\`

---

## 5. Styling Issues

### Issue: Tailwind classes not working

**Symptoms:** Classes applied but no styling

**Solutions:**
\`\`\`typescript
// Solution 1: Check globals.css is imported
// app/layout.tsx
import './globals.css'

// Solution 2: Check Tailwind config
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
}

// Solution 3: Clear Next.js cache
rm -rf .next
npm run dev

// Solution 4: Check for typos
className="bg-blue-500" // ✅
className="bg-blue-50" // ✅
className="bg-blue-550" // ❌ Invalid
\`\`\`

### Issue: Dark mode not working

**Symptoms:** Theme not switching

**Solutions:**
\`\`\`typescript
// Solution 1: Check ThemeProvider is wrapping app
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

// Solution 2: Check theme is being applied
<html className="dark"> {/* or light */}

// Solution 3: Check CSS variables are defined
// app/globals.css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
\`\`\`

### Issue: Custom CSS not applying

**Solutions:**
\`\`\`css
/* Solution 1: Check CSS specificity */
.my-class { /* Lower specificity */
  color: red;
}

.parent .my-class { /* Higher specificity */
  color: blue;
}

/* Solution 2: Use !important (last resort) */
.my-class {
  color: red !important;
}

/* Solution 3: Check CSS is imported */
// component.tsx
import './styles.css'
\`\`\`

---

## 6. API Integration Issues

### Issue: CORS errors

**Error:**
\`\`\`
Access to fetch at 'http://localhost:8000' has been blocked by CORS policy
\`\`\`

**Solutions:**
\`\`\`typescript
// Solution 1: Configure backend CORS
// Express.js example
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

// Solution 2: Use Next.js API routes as proxy
// app/api/teams/route.ts
export async function GET() {
  const response = await fetch('http://localhost:8000/teams')
  const data = await response.json()
  return Response.json(data)
}

// Solution 3: Add to next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}
\`\`\`

### Issue: Authentication token not being sent

**Symptoms:** API returns 401 Unauthorized

**Solutions:**
\`\`\`typescript
// Solution 1: Check axios interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Solution 2: Manually add token
const response = await fetch('/api/data', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

// Solution 3: Check token is being stored
localStorage.setItem('accessToken', token)
console.log('Token:', localStorage.getItem('accessToken'))
\`\`\`

### Issue: API calls failing silently

**Solutions:**
\`\`\`typescript
// Solution 1: Add error handling
try {
  const data = await fetchData()
  console.log('[API] Success:', data)
} catch (error) {
  console.error('[API] Error:', error)
  toast.error('Failed to fetch data')
}

// Solution 2: Check network tab in DevTools
// Open DevTools → Network → Check failed requests

// Solution 3: Add request logging
apiClient.interceptors.request.use((config) => {
  console.log('[API] Request:', config.method, config.url)
  return config
})
\`\`\`

---

## 7. Performance Issues

### Issue: Slow page loads

**Solutions:**
\`\`\`typescript
// Solution 1: Use dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
})

// Solution 2: Optimize images
import Image from 'next/image'

<Image
  src="/image.jpg"
  width={800}
  height={600}
  alt="Description"
  priority={false} // Don't load immediately
/>

// Solution 3: Add loading states
if (isLoading) return <Skeleton />

// Solution 4: Use React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
})
\`\`\`

### Issue: Too many re-renders

**Solutions:**
\`\`\`typescript
// Solution 1: Use useMemo for expensive calculations
const sortedData = useMemo(
  () => data.sort((a, b) => a.name.localeCompare(b.name)),
  [data]
)

// Solution 2: Use useCallback for functions
const handleClick = useCallback(
  (id: string) => {
    console.log('Clicked:', id)
  },
  []
)

// Solution 3: Move static data outside component
const STATIC_OPTIONS = ['Option 1', 'Option 2']

function Component() {
  // Use STATIC_OPTIONS here
}
\`\`\`

---

## 8. Deployment Issues

### Issue: Build succeeds locally but fails on Vercel

**Solutions:**
\`\`\`bash
# Solution 1: Test production build locally
npm run build
npm start

# Solution 2: Check Node version matches
# Add to package.json
{
  "engines": {
    "node": ">=18.17.0"
  }
}

# Solution 3: Check environment variables in Vercel
# Vercel Dashboard → Settings → Environment Variables

# Solution 4: Check build logs for specific errors
\`\`\`

### Issue: Environment variables not working in production

**Solutions:**
\`\`\`typescript
// Solution 1: Use NEXT_PUBLIC_ prefix for client-side
NEXT_PUBLIC_API_URL=https://api.example.com

// Solution 2: Add to Vercel environment variables
// Dashboard → Project → Settings → Environment Variables

// Solution 3: Rebuild after adding env vars
# Vercel automatically rebuilds when env vars change
\`\`\`

---

## Quick Reference: Common Commands

\`\`\`bash
# Clear everything and restart
rm -rf node_modules package-lock.json .next
npm install
npm run dev

# Check for type errors
npm run type-check

# Check for lint errors
npm run lint

# Build for production
npm run build

# Test production build locally
npm run build && npm start

# Clear Next.js cache only
rm -rf .next

# Kill port 3000
lsof -ti:3000 | xargs kill -9  # Mac/Linux
# or find PID and use taskkill on Windows
\`\`\`

---

## Getting Help

If you're still stuck:

1. Check the error message carefully
2. Search GitHub issues
3. Check Next.js documentation
4. Ask on Discord/Slack
5. Create a minimal reproduction
6. Open an issue with details

---

**Remember:** Most issues can be solved by clearing cache and restarting! 🔄
