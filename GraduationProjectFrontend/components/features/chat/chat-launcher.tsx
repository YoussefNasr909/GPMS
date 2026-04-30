"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { ChatWorkspace } from "@/components/features/chat/chat-workspace"
import { useChat } from "@/components/features/chat/chat-provider"
import { Button } from "@/components/ui/button"

export function ChatLauncher() {
  const pathname = usePathname()
  const { unreadCount } = useChat()
  const [open, setOpen] = useState(false)

  if (pathname === "/dashboard/chat") {
    return null
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-4 z-[70] sm:bottom-6 sm:right-6">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close chat launcher" : "Open chat launcher"}
            className="relative h-14 w-14 rounded-[22px] shadow-[0_24px_60px_-24px_rgba(37,99,235,0.65)]"
            size="icon"
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            {unreadCount > 0 ? (
              <>
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
                <span className="absolute -right-1 -top-1 h-6 w-6 animate-ping rounded-full bg-destructive/70" />
              </>
            ) : null}
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[65] bg-background/70 backdrop-blur-sm md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed inset-x-3 bottom-[5.5rem] top-20 z-[68] sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[min(82vh,720px)] sm:w-[min(92vw,480px)]"
            >
              <ChatWorkspace variant="launcher" className="h-full shadow-2xl" onClose={() => setOpen(false)} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
