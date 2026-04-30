"use client"

import { io, type Socket } from "socket.io-client"
import { API_BASE_URL } from "@/lib/api/http"

let activeSocket: Socket | null = null
let activeToken: string | null = null

function stripApiPath(url: string) {
  return url
    .replace(/\/api\/v\d+\/?$/i, "")
    .replace(/\/api\/?$/i, "")
    .replace(/\/+$/, "")
}

function resolveSocketUrl() {
  const explicitSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  if (typeof explicitSocketUrl === "string" && explicitSocketUrl.trim()) {
    return explicitSocketUrl.trim().replace(/\/+$/, "")
  }

  return stripApiPath(API_BASE_URL)
}

export function getChatSocket(token: string) {
  if (typeof window === "undefined") return null

  if (activeSocket && activeToken === token) {
    return activeSocket
  }

  if (activeSocket) {
    activeSocket.disconnect()
    activeSocket = null
  }

  activeToken = token
  activeSocket = io(resolveSocketUrl(), {
    transports: ["websocket"],
    auth: { token },
  })

  return activeSocket
}

export function disconnectChatSocket() {
  activeSocket?.disconnect()
  activeSocket = null
  activeToken = null
}
