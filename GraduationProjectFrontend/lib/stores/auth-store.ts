"use client"

import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import type { User } from "@/types"
import { users } from "@/data/users"

interface AuthState {
  currentUser: User | null
  accessToken: string | null
  rememberSession: boolean
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  setCurrentUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setAuth: (payload: { user: User; accessToken: string; rememberSession?: boolean }) => void
  setRememberSession: (rememberSession: boolean) => void
  logout: () => void
}

const authStateStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(name) ?? window.sessionStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return

    try {
      const parsed = JSON.parse(value) as { state?: { rememberSession?: boolean } }
      const rememberSession = Boolean(parsed?.state?.rememberSession)
      const targetStorage = rememberSession ? window.localStorage : window.sessionStorage
      const otherStorage = rememberSession ? window.sessionStorage : window.localStorage

      targetStorage.setItem(name, value)
      otherStorage.removeItem(name)
    } catch {
      window.localStorage.setItem(name, value)
      window.sessionStorage.removeItem(name)
    }
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(name)
    window.sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      rememberSession: false,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuth: ({ user, accessToken, rememberSession }) =>
        set((state) => ({
          currentUser: user,
          accessToken,
          rememberSession: rememberSession ?? state.rememberSession,
        })),
      setRememberSession: (rememberSession) => set({ rememberSession }),
      logout: () => set({ currentUser: null, accessToken: null, rememberSession: false }),
    }),
    {
      name: "gpms-auth",
      storage: createJSONStorage(() => authStateStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        accessToken: state.accessToken,
        rememberSession: state.rememberSession,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

// Old demo helpers (keep for UI demo parts)
export const getUserById = (id: string) => users.find((u) => u.id === id)
export const getUsersByRole = (role: User["role"]) => users.filter((u) => u.role === role)
export const getUsersByIds = (ids: string[]) => users.filter((u) => ids.includes(u.id))
