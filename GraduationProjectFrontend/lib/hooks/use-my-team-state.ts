"use client"

import { useCallback, useEffect, useState } from "react"
import { teamsApi } from "@/lib/api/teams"
import type { ApiMyTeamState } from "@/lib/api/types"
import { useAuthStore } from "@/lib/stores/auth-store"

export function useMyTeamState(enabled = true) {
  const { accessToken, currentUser, hasHydrated } = useAuthStore()
  const [data, setData] = useState<ApiMyTeamState | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null)
      setIsLoading(false)
      setError("")
      return
    }

    if (!hasHydrated || !accessToken || !currentUser) {
      setData(null)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await teamsApi.my()
      setData(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't load your team right now.")
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, currentUser, enabled, hasHydrated])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    data,
    isLoading,
    error,
    refresh,
  }
}
