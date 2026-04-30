"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Socket } from "socket.io-client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { chatApi } from "@/lib/api/chat"
import { disconnectChatSocket, getChatSocket } from "@/lib/chat/socket"

type ChatContextValue = {
  socket: Socket | null
  connected: boolean
  unreadCount: number
  setUnreadCount: (count: number) => void
  refreshUnreadCount: () => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { hasHydrated, accessToken, currentUser } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!accessToken || !currentUser) {
      setUnreadCount(0)
      return
    }

    try {
      const data = await chatApi.unreadCount()
      setUnreadCount(data.unreadCount)
    } catch {
      // Keep the current badge state if a background refresh fails.
    }
  }, [accessToken, currentUser])

  useEffect(() => {
    if (!hasHydrated) return

    if (!accessToken || !currentUser) {
      setConnected(false)
      setUnreadCount(0)
      setSocket(null)
      disconnectChatSocket()
      return
    }

    void refreshUnreadCount()

    const nextSocket = getChatSocket(accessToken)
    setSocket(nextSocket)

    if (!nextSocket) {
      setConnected(false)
      return
    }

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)
    const handleBadge = (payload: { unreadCount?: number }) => setUnreadCount(Number(payload?.unreadCount ?? 0))

    nextSocket.on("connect", handleConnect)
    nextSocket.on("disconnect", handleDisconnect)
    nextSocket.on("chat:badge", handleBadge)

    setConnected(nextSocket.connected)

    return () => {
      nextSocket.off("connect", handleConnect)
      nextSocket.off("disconnect", handleDisconnect)
      nextSocket.off("chat:badge", handleBadge)
      disconnectChatSocket()
      setSocket(null)
      setConnected(false)
    }
  }, [accessToken, currentUser, hasHydrated, refreshUnreadCount])

  const value = useMemo<ChatContextValue>(
    () => ({
      socket,
      connected,
      unreadCount,
      setUnreadCount,
      refreshUnreadCount,
    }),
    [connected, refreshUnreadCount, socket, unreadCount],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }

  return context
}
