"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { Breadcrumbs } from "@/components/app-shell/breadcrumbs"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useUIStore } from "@/lib/stores/ui-store"
import { isUserProfileIncomplete } from "@/lib/auth/profile-completion"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
const { currentUser, accessToken, hasHydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

 useEffect(() => {
  if (!hasHydrated) return
  if (!accessToken) router.replace("/login")
}, [hasHydrated, accessToken, router])

useEffect(() => {
  if (!hasHydrated) return
  if (!accessToken) return
  if (!currentUser) return

  if (isUserProfileIncomplete(currentUser)) {
    router.replace("/complete-profile?reason=incomplete")
  }
}, [hasHydrated, accessToken, currentUser, router])



  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname, setMobileSidebarOpen])

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileSidebarOpen])

if (!hasHydrated) return null
if (!accessToken) return null // redirect effect will run
if (!currentUser) return null // waiting for /me from AuthBootstrap

const incomplete = isUserProfileIncomplete(currentUser)

// ✅ BLOCK DASHBOARD UI (no flash)
if (incomplete) {
  return (
    <div className="h-[100dvh] flex items-center justify-center text-sm text-muted-foreground">
      Redirecting to complete profile…
    </div>
  )
}

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background relative">
      <div className="fixed inset-0 gradient-bg -z-10 opacity-30" />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed z-50 lg:hidden"
          >
            <AppSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:block z-50 shrink-0">
        <AppSidebar />
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${
          !sidebarCollapsed ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        <AppTopbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth-touch safe-area-bottom">
          <div className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
            <Breadcrumbs />

            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="min-w-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
