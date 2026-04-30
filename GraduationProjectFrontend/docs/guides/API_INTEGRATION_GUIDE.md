# 🔌 API Integration Guide
## Connecting Frontend to Backend

This guide shows you exactly how to replace mock data with real backend APIs.

---

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [API Client Setup](#api-client-setup)
3. [Authentication Flow](#authentication-flow)
4. [Replacing Mock Data](#replacing-mock-data)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Caching Strategy](#caching-strategy)
8. [WebSocket Integration](#websocket-integration)

---

## 1. Setup & Configuration

### Environment Variables

Create `.env.local`:
\`\`\`env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Authentication (Server-side only - NEVER expose JWT secrets to client)
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.zip

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
\`\`\`

---

## 2. API Client Setup

### Create API Client

\`\`\`typescript
// lib/api/client.ts
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
\`\`\`

---

## 3. Authentication Flow

### Login API Integration

\`\`\`typescript
// lib/api/auth.ts
import { apiClient } from './client'
import type { User } from '@/types'

interface LoginCredentials {
  identifier: string // email or student code
  password: string
}

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
  
  // Store tokens
  localStorage.setItem('accessToken', response.data.accessToken)
  localStorage.setItem('refreshToken', response.data.refreshToken)
  
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me')
  return response.data
}

export async function register(data: RegisterData): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/register', data)
  return response.data
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { token })
}

export async function resetPassword(email: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { email })
}
\`\`\`

### Update Auth Store

\`\`\`typescript
// lib/stores/auth-store.ts
import { create } from 'zustand'
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/lib/api/auth'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (identifier, password) => {
    try {
      set({ isLoading: true, error: null })
      const { user } = await apiLogin({ identifier, password })
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed',
        isLoading: false 
      })
      throw error
    }
  },

  logout: async () => {
    try {
      await apiLogout()
      set({ user: null, isAuthenticated: false })
    } catch (error) {
      // Even if API fails, clear local state
      set({ user: null, isAuthenticated: false })
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        set({ isLoading: false })
        return
      }

      const user = await getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
\`\`\`

---

## 4. Replacing Mock Data

### Teams API

\`\`\`typescript
// lib/api/teams.ts
import { apiClient } from './client'
import type { Team, TeamMember, TeamInvite } from '@/types'

// GET all teams
export async function getTeams(filters?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ teams: Team[]; total: number }> {
  const response = await apiClient.get('/teams', { params: filters })
  return response.data
}

// GET single team
export async function getTeam(teamId: string): Promise<Team> {
  const response = await apiClient.get(`/teams/${teamId}`)
  return response.data
}

// POST create team
export async function createTeam(data: Partial<Team>): Promise<Team> {
  const response = await apiClient.post('/teams', data)
  return response.data
}

// PUT update team
export async function updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
  const response = await apiClient.put(`/teams/${teamId}`, data)
  return response.data
}

// DELETE team
export async function deleteTeam(teamId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}`)
}

// POST invite member
export async function inviteTeamMember(teamId: string, data: {
  email?: string
  studentCode?: string
}): Promise<TeamInvite> {
  const response = await apiClient.post(`/teams/${teamId}/invites`, data)
  return response.data
}

// POST join team
export async function joinTeam(inviteCode: string): Promise<Team> {
  const response = await apiClient.post('/teams/join', { inviteCode })
  return response.data
}

// DELETE remove member
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/members/${userId}`)
}

// PUT update member role
export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: 'leader' | 'member'
): Promise<TeamMember> {
  const response = await apiClient.put(`/teams/${teamId}/members/${userId}/role`, { role })
  return response.data
}
\`\`\`

### Tasks API

\`\`\`typescript
// lib/api/tasks.ts
import { apiClient } from './client'
import type { Task } from '@/types'

export async function getTasks(teamId: string, filters?: {
  status?: string
  assignee?: string
  priority?: string
}): Promise<Task[]> {
  const response = await apiClient.get(`/teams/${teamId}/tasks`, { params: filters })
  return response.data
}

export async function getTask(teamId: string, taskId: string): Promise<Task> {
  const response = await apiClient.get(`/teams/${teamId}/tasks/${taskId}`)
  return response.data
}

export async function createTask(teamId: string, data: Partial<Task>): Promise<Task> {
  const response = await apiClient.post(`/teams/${teamId}/tasks`, data)
  return response.data
}

export async function updateTask(
  teamId: string,
  taskId: string,
  data: Partial<Task>
): Promise<Task> {
  const response = await apiClient.put(`/teams/${teamId}/tasks/${taskId}`, data)
  return response.data
}

export async function deleteTask(teamId: string, taskId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/tasks/${taskId}`)
}

export async function updateTaskStatus(
  teamId: string,
  taskId: string,
  status: string
): Promise<Task> {
  const response = await apiClient.patch(`/teams/${teamId}/tasks/${taskId}/status`, { status })
  return response.data
}

export async function assignTask(
  teamId: string,
  taskId: string,
  assigneeId: string
): Promise<Task> {
  const response = await apiClient.patch(`/teams/${teamId}/tasks/${taskId}/assign`, {
    assigneeId,
  })
  return response.data
}
\`\`\`

### Example: Updating Teams Page

**Before (Mock Data):**
\`\`\`typescript
// app/dashboard/teams/page.tsx
import { mockTeams } from '@/data/teams'

export default function TeamsPage() {
  const teams = mockTeams
  
  return (
    <div>
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  )
}
\`\`\`

**After (Real API):**
\`\`\`typescript
// app/dashboard/teams/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getTeams } from '@/lib/api/teams'
import type { Team } from '@/types'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeams() {
      try {
        setIsLoading(true)
        const { teams: data } = await getTeams()
        setTeams(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [])

  if (isLoading) return <TeamsLoadingSkeleton />
  if (error) return <ErrorDisplay message={error} />

  return (
    <div>
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  )
}
\`\`\`

---

## 5. Error Handling

### Error Handler Utility

\`\`\`typescript
// lib/utils/error-handler.ts
import { toast } from 'sonner'

export function handleApiError(error: any) {
  console.error('[API Error]', error)

  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'An error occurred'
    const status = error.response.status

    switch (status) {
      case 400:
        toast.error('Invalid request', { description: message })
        break
      case 401:
        toast.error('Unauthorized', { description: 'Please log in again' })
        break
      case 403:
        toast.error('Forbidden', { description: 'You don't have permission' })
        break
      case 404:
        toast.error('Not found', { description: message })
        break
      case 500:
        toast.error('Server error', { description: 'Please try again later' })
        break
      default:
        toast.error('Error', { description: message })
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error', { 
      description: 'Please check your connection' 
    })
  } else {
    // Something else happened
    toast.error('Error', { description: error.message })
  }
}
\`\`\`

### Usage in Components

\`\`\`typescript
import { handleApiError } from '@/lib/utils/error-handler'

try {
  await createTask(teamId, taskData)
  toast.success('Task created successfully')
} catch (error) {
  handleApiError(error)
}
\`\`\`

---

## 6. Loading States

### Custom Hook for API Calls

\`\`\`typescript
// hooks/use-api.ts
import { useState, useCallback } from 'react'
import { handleApiError } from '@/lib/utils/error-handler'

export function useApi<T, Args extends any[]>(
  apiFunction: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: Args) => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await apiFunction(...args)
        setData(result)
        return result
      } catch (err: any) {
        setError(err)
        handleApiError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiFunction]
  )

  return { data, isLoading, error, execute }
}
\`\`\`

### Usage Example

\`\`\`typescript
import { useApi } from '@/hooks/use-api'
import { getTeam } from '@/lib/api/teams'

function TeamDetails({ teamId }: { teamId: string }) {
  const { data: team, isLoading, execute: fetchTeam } = useApi(getTeam)

  useEffect(() => {
    fetchTeam(teamId)
  }, [teamId, fetchTeam])

  if (isLoading) return <Skeleton />
  if (!team) return <EmptyState />

  return <div>{team.name}</div>
}
\`\`\`

---

## 7. Caching Strategy

### Using SWR (Recommended)

\`\`\`typescript
// Install: npm install swr

// hooks/use-teams.ts
import useSWR from 'swr'
import { getTeams } from '@/lib/api/teams'

export function useTeams(filters?: any) {
  const { data, error, isLoading, mutate } = useSWR(
    ['/teams', filters],
    () => getTeams(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  )

  return {
    teams: data?.teams || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate, // For manual refetch
  }
}
\`\`\`

### Usage with SWR

\`\`\`typescript
import { useTeams } from '@/hooks/use-teams'

function TeamsPage() {
  const { teams, isLoading, mutate } = useTeams()

  const handleCreateTeam = async (data: any) => {
    await createTeam(data)
    mutate() // Refresh teams list
  }

  if (isLoading) return <Skeleton />

  return <TeamsList teams={teams} onCreate={handleCreateTeam} />
}
\`\`\`

---

## 8. WebSocket Integration

### WebSocket Client

\`\`\`typescript
// lib/websocket/client.ts
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

let socket: Socket | null = null

export function initializeWebSocket(userId: string): Socket {
  if (socket?.connected) {
    return socket
  }

  const token = localStorage.getItem('accessToken')

  socket = io(WS_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('[WS] Connected')
    socket?.emit('join', { userId })
  })

  socket.on('disconnect', () => {
    console.log('[WS] Disconnected')
  })

  socket.on('error', (error) => {
    console.error('[WS] Error:', error)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
\`\`\`

### WebSocket Events Hook

\`\`\`typescript
// hooks/use-websocket.ts
import { useEffect } from 'react'
import { getSocket } from '@/lib/websocket/client'

export function useWebSocketEvent<T>(
  event: string,
  callback: (data: T) => void
) {
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on(event, callback)

    return () => {
      socket.off(event, callback)
    }
  }, [event, callback])
}
\`\`\`

### Real-time Notifications Example

\`\`\`typescript
// components/features/notification-listener.tsx
'use client'

import { useWebSocketEvent } from '@/hooks/use-websocket'
import { toast } from 'sonner'
import type { Notification } from '@/types'

export function NotificationListener() {
  useWebSocketEvent<Notification>('notification', (notification) => {
    toast(notification.title, {
      description: notification.message,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => window.location.href = notification.actionUrl!,
      } : undefined,
    })
  })

  return null
}
\`\`\`

### Chat Messages Example

\`\`\`typescript
// app/dashboard/chat/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useWebSocketEvent } from '@/hooks/use-websocket'
import { getSocket } from '@/lib/websocket/client'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const socket = getSocket()

  // Listen for new messages
  useWebSocketEvent<Message>('chat:message', (message) => {
    setMessages((prev) => [...prev, message])
  })

  // Send message
  const sendMessage = (content: string) => {
    socket?.emit('chat:send', {
      channelId: currentChannel,
      content,
    })
  }

  return (
    <div>
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
\`\`\`

---

## Summary Checklist

- [ ] Environment variables configured
- [ ] API client created with interceptors
- [ ] Authentication endpoints implemented
- [ ] Auth store connected to API
- [ ] All data endpoints created (teams, tasks, etc.)
- [ ] Mock data replaced with API calls
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Caching strategy (SWR) implemented
- [ ] WebSocket client initialized
- [ ] Real-time events connected
- [ ] File upload endpoints created
- [ ] Notification system connected
- [ ] All pages tested with real API

---

**Next Steps:**
1. Test each API endpoint individually
2. Implement proper error boundaries
3. Add retry logic for failed requests
4. Monitor API performance
5. Add analytics tracking
6. Implement offline support (optional)
