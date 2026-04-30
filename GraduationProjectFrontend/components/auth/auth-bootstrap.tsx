"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { authApi } from "@/lib/api/auth"
import { mapApiUserToUiUser } from "@/lib/api/mappers"

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { hasHydrated, accessToken, currentUser, setCurrentUser, logout } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      // ✅ wait until zustand persist finishes hydration
      if (!hasHydrated) return

      // no token -> ok to render public pages
      if (!accessToken) {
        setReady(true)
        return
      }

      // already have user
      if (currentUser) {
        setReady(true)
        return
      }

      // token exists but user not loaded -> fetch /me
      try {
        const apiUser = await authApi.me()
        if (!cancelled) setCurrentUser(mapApiUserToUiUser(apiUser))
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [hasHydrated, accessToken, currentUser, setCurrentUser, logout])

  // ✅ don’t render anything until hydration is complete
  if (!hasHydrated || !ready) return null
  return <>{children}</>
}
