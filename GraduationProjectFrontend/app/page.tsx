"use client"

import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from "framer-motion"
import { useState, useRef, useEffect, type ComponentType } from "react"
import {
  ArrowRight,
  GraduationCap,
  Users,
  Target,
  TrendingUp,
  Sparkles,
  Star,
  Rocket,
  Clock,
  Award,
  Code,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  Github,
  Play,
  ChevronDown,
  Bell,
  Settings,
  Heart,
  Puzzle,
  Workflow,
  Database,
  Menu,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useAuthStore } from "@/lib/stores/auth-store"
import { isUserProfileIncomplete } from "@/lib/auth/profile-completion"

function TypingAnimation({ texts, className }: { texts: string[]; className?: string }) {
  const shouldReduceMotion = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrentText(texts[0] ?? "")
      return
    }

    const text = texts[currentIndex]

    if (!isDeleting && currentText.length === text.length) {
      const pause = setTimeout(() => setIsDeleting(true), 2400)
      return () => clearTimeout(pause)
    }

    if (isDeleting && currentText.length === 0) {
      const next = setTimeout(() => {
        setIsDeleting(false)
        setCurrentIndex((prev) => (prev + 1) % texts.length)
      }, 300)
      return () => clearTimeout(next)
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) setCurrentText(text.slice(0, currentText.length + 1))
      else setCurrentText(text.slice(0, currentText.length - 1))
    }, isDeleting ? 60 : 85)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentIndex, shouldReduceMotion, texts])

  return (
    <span className={className}>
      {currentText}
      {!shouldReduceMotion && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
          className="inline-block w-[3px] h-[1em] bg-primary ml-1 align-middle"
        />
      )}
    </span>
  )
}

const featuredUniversities = [
  "MIT",
  "Stanford",
  "Harvard",
  "Oxford",
  "Cambridge",
  "Berkeley",
  "Caltech",
  "Princeton",
  "Yale",
  "Columbia",
  "Imperial College London",
  "UCL",
  "ETH Zurich",
  "University of Toronto",
  "National University of Singapore",
  "Tsinghua University",
  "Peking University",
  "Technical University of Munich",
  "Cairo University",
  "Ain Shams University",
  "Alexandria University",
  "King Saud University",
]

const footerSections = [
  {
    eyebrow: "Explore",
    title: "Navigate the platform",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Workflow Preview", href: "#demo" },
      { label: "Success Stories", href: "#testimonials" },
    ],
  },
  {
    eyebrow: "Get Started",
    title: "Join your workspace",
    links: [
      { label: "Create Account", href: "/register" },
      { label: "Sign In", href: "/login" },
      { label: "Success Stories", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
    ],
  },
] as const

const footerAudience = ["Students", "Team Leaders", "Supervisors", "Administrators"] as const

const navItems = [
  { label: "How It Works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Testimonials", id: "testimonials" },
  { label: "FAQ", id: "faq" },
] as const

type Feature = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  href?: string
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const shouldReduceMotion = useReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeatureTab, setActiveFeatureTab] = useState("students")
  const [activeSection, setActiveSection] = useState<string>("")
  const { accessToken, currentUser, hasHydrated } = useAuthStore()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  // Active navbar link based on current scroll position
  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (sections.length === 0) return

    let ticking = false

    const updateActiveSection = () => {
      const marker = window.scrollY + window.innerHeight * 0.34
      let nextActiveSection = ""

      for (const section of sections) {
        if (section.offsetTop <= marker) {
          nextActiveSection = section.id
        }
      }

      setActiveSection(nextActiveSection)
      ticking = false
    }

    const requestUpdate = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(updateActiveSection)
    }

    requestUpdate()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)

    return () => {
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
    }
  }, [])

  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])
  const currentYear = new Date().getFullYear()
  const isAuthenticated = hasHydrated && Boolean(accessToken || currentUser)
  const hasIncompleteProfile = isAuthenticated && isUserProfileIncomplete(currentUser)
  const isReadyAuthenticated = isAuthenticated && !hasIncompleteProfile
  const signInHref = isReadyAuthenticated ? "/dashboard" : "/login"
  const registerHref = isReadyAuthenticated ? "/dashboard" : "/register"
  const primaryCtaHref = hasIncompleteProfile ? "/complete-profile?reason=incomplete" : isReadyAuthenticated ? "/dashboard" : "/register"
  const footerNavSections = footerSections.map((section) => ({
    ...section,
    links: section.links.map((link) => ({
      ...link,
      href:
        link.href === "/login"
          ? signInHref
          : link.href === "/register"
            ? registerHref
            : link.href,
    })),
  }))

  const navLinkClass = (id: string) =>
    `relative group rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
      activeSection === id
        ? "bg-primary/10 text-primary ring-1 ring-primary/15 shadow-sm"
        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
    }`

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left" style={{ scaleX }} />

      {/* Background effects */}
      <div className="fixed inset-0 gradient-bg -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />

      {/* Animated blobs - hidden on mobile for performance */}
      <motion.div
        className="fixed top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl float pointer-events-none hidden lg:block"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-20 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl float pointer-events-none hidden lg:block"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none hidden xl:block"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
      />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-1 left-1 right-1 sm:left-2 sm:right-2 z-50 glass rounded-xl sm:rounded-2xl border shadow-lg"
      >
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="hidden xs:flex flex-col leading-tight">
                <span className="font-bold text-base sm:text-lg group-hover:text-primary">GPMS</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Graduation Project Management</span>
              </div>
            </Link>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navItems.map((item, i) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                className={navLinkClass(item.id)}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={activeSection === item.id ? "location" : undefined}
              >
                {item.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary transition-all duration-200 ${
                    activeSection === item.id ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                  }`}
                />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {mounted && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 group-hover:text-slate-700 transition-colors" />
                )}
              </motion.button>
            )}
            {!isReadyAuthenticated && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-lg sm:rounded-xl hidden sm:flex h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Link href={signInHref}>Sign In</Link>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="rounded-lg sm:rounded-xl glow group h-8 sm:h-9 px-2.5 sm:px-4 text-xs sm:text-sm"
            >
              <Link href={primaryCtaHref}>
                <span className="hidden xs:inline sm:inline">
                  {hasIncompleteProfile ? "Complete Profile" : isReadyAuthenticated ? "Dashboard" : "Get Started"}
                </span>
                <span className="xs:hidden sm:hidden">
                  {hasIncompleteProfile ? "Finish" : isReadyAuthenticated ? "Go" : "Start"}
                </span>
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-9 sm:w-9"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              id="mobile-navigation"
              className="lg:hidden border-t"
            >
              <div className="p-3 sm:p-4 flex flex-col gap-1 sm:gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl transition-all text-sm ${
                      activeSection === item.id
                        ? "bg-primary/10 text-primary ring-1 ring-primary/15 shadow-sm"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={activeSection === item.id ? "location" : undefined}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex gap-2 mt-2 pt-2 border-t">
                  {isReadyAuthenticated ? (
                    <Button asChild variant="outline" className="flex-1 bg-transparent h-10 text-sm">
                      <a href="#features">Explore Features</a>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="flex-1 bg-transparent h-10 text-sm">
                      <Link href={signInHref}>Sign In</Link>
                    </Button>
                  )}
                  <Button asChild className="flex-1 h-10 text-sm">
                    <Link href={primaryCtaHref}>
                      {hasIncompleteProfile ? "Complete Profile" : isReadyAuthenticated ? "Dashboard" : "Get Started"}
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 min-h-screen flex items-center">
        <div className="container mx-auto text-center max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass text-primary font-medium mb-4 sm:mb-6 glow text-xs sm:text-sm"
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Purpose-built for graduation project teams</span>
            <span className="xs:hidden">Purpose-built for teams</span>
            <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
              Students to admins
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mx-auto max-w-5xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-balance leading-[1.05]"
          >
            Plan, build, and present
            <br />
            <span className="text-primary inline-flex items-center justify-center gap-1">
              <TypingAnimation
                texts={["with clarity", "with structure", "with confidence", "with momentum"]}
                className="font-bold"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 text-pretty max-w-3xl mx-auto leading-relaxed px-2"
          >
            GPMS gives students, team leaders, supervisors, and administrators one shared academic workspace for tasks,
            milestones, reviews, collaboration, and final delivery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0"
          >
            <Button
              asChild
              size="lg"
              className="rounded-xl sm:rounded-2xl h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base glow-lg group w-full sm:w-auto"
            >
              <Link href={primaryCtaHref}>
                {hasIncompleteProfile ? "Complete Your Profile" : isReadyAuthenticated ? "Open Your Dashboard" : "Create Your Workspace"}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl sm:rounded-2xl h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base glass bg-transparent w-full sm:w-auto"
            >
              {hasIncompleteProfile ? (
                <Link href={signInHref}>
                  <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Sign In
                </Link>
              ) : (
                <a href="#demo">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Preview the Workflow
                </a>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 px-4"
          >
            {["Students", "Team Leaders", "Supervisors", "Admins"].map((role) => (
              <span
                key={role}
                className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur sm:text-xs"
              >
                {role}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-muted-foreground px-2"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm">Role-based dashboards</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              <span className="text-xs sm:text-sm">Deadline tracking</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Github className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/80" />
              <span className="text-xs sm:text-sm">GitHub integration</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 hidden xs:flex">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm">Team collaboration</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto px-2"
          >
            {[
              {
                title: "Student workspace",
                description: "Tasks, files, meetings, and progress in one clear view.",
                icon: FileText,
                color: "text-blue-500",
              },
              {
                title: "Supervisor oversight",
                description: "Review progress, feedback, and milestones without chasing updates.",
                icon: Users,
                color: "text-purple-500",
              },
              {
                title: "Milestone control",
                description: "Keep proposals, reviews, demos, and submissions on schedule.",
                icon: Target,
                color: "text-green-500",
              },
              {
                title: "Progress visibility",
                description: "Spot blockers early and keep the whole team aligned.",
                icon: TrendingUp,
                color: "text-orange-500",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl glow group text-left"
              >
                <motion.div
                  className={`inline-flex p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-primary/10 mb-2 sm:mb-3 group-hover:bg-primary/20 transition-colors ${item.color}`}
                  whileHover={{ scale: 1.04, y: -1 }}
                  transition={{ duration: 0.25 }}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </motion.div>
                <div className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2 ${item.color}`}>
                  {item.title}
                </div>
                <div className="text-[10px] leading-relaxed sm:text-xs md:text-sm text-muted-foreground">
                  {item.description}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-10 sm:mt-12 md:mt-16"
          >
            <motion.a
              href="#how-it-works"
              className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <span className="text-xs sm:text-sm">Scroll to explore</span>
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-3 sm:px-4 border-y bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
            Designed for academic teams across universities worldwide
          </p>
          {shouldReduceMotion ? (
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 opacity-60">
              {featuredUniversities.map((uni) => (
                <motion.div
                  key={uni}
                  className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-muted-foreground"
                  whileHover={{ scale: 1.06, opacity: 1 }}
                >
                  {uni}
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              className="relative overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div className="trusted-marquee-track flex w-max items-center opacity-60">
                {[0, 1].map((groupIndex) => (
                  <div
                    key={groupIndex}
                    aria-hidden={groupIndex === 1}
                    className="flex shrink-0 items-center gap-4 pr-4 sm:gap-6 sm:pr-6 md:gap-8 md:pr-8 lg:gap-12 lg:pr-12"
                  >
                    {featuredUniversities.map((uni) => (
                      <motion.div
                        key={`${groupIndex}-${uni}`}
                        className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-muted-foreground whitespace-nowrap"
                        whileHover={{ scale: 1.08, opacity: 1, y: -2 }}
                      >
                        {uni}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 scroll-mt-24 sm:scroll-mt-28">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm">Simple Process</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              From setup to submission
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              A clear three-step flow for organizing work, coordinating supervision, and keeping delivery on track.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative">
            {/* Connection line - hidden on mobile */}
            <div className="hidden md:block absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />

            {[
              {
                step: "01",
                title: "Create Your Workspace",
                description: "Set up the project space, choose your role, and start with the structure your team needs.",
                icon: Users,
              },
              {
                step: "02",
                title: "Bring In Your Team",
                description: "Invite team members and supervisors so tasks, meetings, and feedback stay in one place.",
                icon: Puzzle,
              },
              {
                step: "03",
                title: "Track Delivery Clearly",
                description: "Manage milestones, submissions, reviews, and progress without losing momentum.",
                icon: Rocket,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="glass-card p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-center hover:glow transition-all h-full">
                  <motion.div
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6 text-white font-bold text-base sm:text-lg md:text-xl"
                    whileHover={{ scale: 1.06, y: -2 }}
                    transition={{ duration: 0.25 }}
                  >
                    {item.step}
                  </motion.div>
                  <item.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 bg-muted/20 scroll-mt-24 sm:scroll-mt-28">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm">Powerful Features</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              One system for the full academic workflow
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Explore the tools each role needs, from daily execution to review and oversight.
            </p>
          </motion.div>

          {/* Feature tabs by role - improved mobile responsiveness */}
          <Tabs value={activeFeatureTab} onValueChange={setActiveFeatureTab} className="mb-8 sm:mb-12">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 sm:grid-cols-4 h-auto p-1.5 gap-1.5 rounded-2xl bg-background/80 backdrop-blur">
              {[
                { value: "students", label: "Students", icon: GraduationCap },
                { value: "supervisors", label: "Supervisors", icon: Users },
                { value: "teams", label: "Teams", icon: Puzzle },
                { value: "admins", label: "Admins", icon: Settings },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-row items-center justify-center gap-2 rounded-xl py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="students" className="mt-6 sm:mt-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {studentFeatures.map((feature, index) => (
                  <FeatureCard key={feature.title} feature={feature} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="supervisors" className="mt-6 sm:mt-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {supervisorFeatures.map((feature, index) => (
                  <FeatureCard key={feature.title} feature={feature} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="teams" className="mt-6 sm:mt-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {teamFeatures.map((feature, index) => (
                  <FeatureCard key={feature.title} feature={feature} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="admins" className="mt-6 sm:mt-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {adminFeatures.map((feature, index) => (
                  <FeatureCard key={feature.title} feature={feature} index={index} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section id="demo" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 scroll-mt-24 sm:scroll-mt-28">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm">Interface Preview</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              What the workspace feels like
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Clean enough for daily execution, structured enough for supervisor review, and focused enough for final delivery.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"
          >
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8">
              <Badge variant="secondary" className="mb-4 w-fit">
                Shared workspace
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold text-balance">
                Keep your team, supervisor, and deadlines aligned in one flow.
              </h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                GPMS brings task planning, milestone visibility, team updates, feedback, and GitHub activity into one
                clear academic workspace.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  {
                    icon: Calendar,
                    title: "Milestones and deadlines",
                    description: "Track upcoming reviews, meetings, and deliverables without losing context.",
                  },
                  {
                    icon: MessageSquare,
                    title: "Team and supervisor updates",
                    description: "Keep communication tied directly to the project instead of scattered chats.",
                  },
                  {
                    icon: Github,
                    title: "Build progress in context",
                    description: "Connect commits, tasks, and submissions so progress is easy to explain and review.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 sm:p-4"
                  >
                    <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold">{item.title}</div>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button asChild className="rounded-xl">
                  <Link href={primaryCtaHref}>{isAuthenticated ? "Open Dashboard" : "Start Free"}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl bg-transparent">
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
            </Card>

            <Card className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 overflow-hidden">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      GPMS Workspace
                    </p>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold">Graduation Project Overview</h3>
                  </div>
                  <Badge variant="secondary">Live progress</Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Next milestone</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="mt-3 text-sm font-semibold">System Design Review</div>
                    <p className="mt-1 text-xs text-muted-foreground">Thursday, 2:00 PM with supervisor feedback</p>
                    <div className="mt-4 h-2 rounded-full bg-background">
                      <div className="h-full w-3/4 rounded-full bg-primary" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Team status</span>
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-2xl font-bold">78%</span>
                      <span className="pb-1 text-xs text-emerald-600">on track</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Tasks, submissions, and meeting prep aligned</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Current board</p>
                      <p className="text-xs text-muted-foreground">From planning to review-ready deliverables</p>
                    </div>
                    <Badge variant="outline">Sprint 06</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        title: "To do",
                        items: ["Finalize ER diagram", "Prepare user manual"],
                      },
                      {
                        title: "In review",
                        items: ["UI polish pass", "Supervisor notes"],
                      },
                      {
                        title: "Done",
                        items: ["GitHub setup", "Task allocation"],
                      },
                    ].map((column) => (
                      <div key={column.title} className="rounded-2xl bg-background/80 p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {column.title}
                        </div>
                        <div className="mt-3 space-y-2">
                          {column.items.map((item) => (
                            <div key={item} className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs sm:text-sm">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="testimonials" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 scroll-mt-24 sm:scroll-mt-28">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm">Success Stories</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Feedback from the academic workflow
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              A quick view of how GPMS supports students, team leaders, and supervisors through the project lifecycle.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl h-full hover:glow transition-all">
                  <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="font-bold text-primary text-xs sm:text-sm">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">{testimonial.name}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 bg-muted/20 scroll-mt-24 sm:scroll-mt-28">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Everything you need to know about GPMS
            </p>
          </motion.div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 md:py-24 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="glass-card p-6 sm:p-8 md:p-12 lg:p-16 text-center rounded-2xl sm:rounded-3xl glow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10" />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex p-3 sm:p-4 rounded-full bg-primary/10 mb-4 sm:mb-6"
                >
                  <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  Ready to run your project in one place?
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                  Start with a cleaner workflow for planning, teamwork, supervision, and delivery from the first week.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl sm:rounded-2xl h-12 sm:h-14 px-6 sm:px-8 glow-lg group text-sm sm:text-base"
                  >
                    <Link href={primaryCtaHref}>
                      {hasIncompleteProfile ? "Complete Your Profile" : isReadyAuthenticated ? "Open Your Dashboard" : "Create Your Workspace"}
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-xl sm:rounded-2xl h-12 sm:h-14 px-6 sm:px-8 bg-transparent text-sm sm:text-base"
                  >
                    <Link href={signInHref}>{isReadyAuthenticated ? "Open Dashboard" : "Sign In"}</Link>
                  </Button>
                </div>
                <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2">
                  {["Tasks and milestones", "Supervisor review flow", "Team collaboration", "Submission tracking"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur sm:text-xs"
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <footer className="border-t bg-muted/[0.18] px-3 py-8 sm:px-4 sm:py-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-base text-foreground sm:text-lg">GPMS</p>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">Graduation Project Management</p>
                </div>
              </div>

              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                A focused workspace for graduation project planning, collaboration, supervision, and delivery.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="h-9 rounded-xl">
                  <a href="#features">Explore Features</a>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-9 rounded-xl bg-transparent">
                  <Link href={hasIncompleteProfile ? registerHref : primaryCtaHref}>
                    {hasIncompleteProfile ? "Create Account" : isReadyAuthenticated ? "Open Dashboard" : "Create Account"}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-6 xs:grid-cols-2">
              {footerNavSections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-sm font-semibold text-foreground">{section.eyebrow}</h4>
                  <ul className="mt-3 space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <FooterLink href={link.href} label={link.label} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="xs:col-span-2">
                <h4 className="text-sm font-semibold text-foreground">Built For</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {footerAudience.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] text-muted-foreground sm:text-xs"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-muted-foreground sm:text-sm">{currentYear} GPMS. All rights reserved.</p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-end sm:text-sm">
              <span>Made with</span>
              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              <span>for academic project teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const className =
    "group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"

  const content = (
    <>
      <span>{label}</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </>
  )

  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}


function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      {feature.href ? (
        <Link href={feature.href} className="block">
          <Card className="glass-card p-4 sm:p-5 md:p-6 h-full rounded-xl sm:rounded-2xl hover:glow transition-all group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <feature.icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6 text-primary" />
            </div>
            <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </Card>
        </Link>
      ) : (
        <Card className="glass-card p-4 sm:p-5 md:p-6 h-full rounded-xl sm:rounded-2xl hover:glow transition-all group">
          <div className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <feature.icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6 text-primary" />
          </div>
          <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        </Card>
      )}
    </motion.div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = question.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const triggerId = `${panelId}-trigger`
  const contentId = `${panelId}-content`

  return (
    <Card className="glass-card rounded-lg sm:rounded-xl overflow-hidden">
      <button
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5 md:p-6"
      >
        <h3 className="font-semibold text-sm sm:text-base pr-2">{question}</h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={triggerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 text-xs sm:text-sm md:text-base text-muted-foreground">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

const studentFeatures = [
  {
    title: "Task Management",
    description: "Organize and track all your project tasks with deadlines and priorities",
    icon: FileText,
    href: "/login",
  },
  {
    title: "Progress Tracking",
    description: "Visual dashboards showing your project completion status",
    icon: BarChart3,
    href: "/login",
  },
  {
    title: "Team Chat",
    description: "Real-time messaging with your team members",
    icon: MessageSquare,
    href: "/login",
  },
  {
    title: "Calendar Sync",
    description: "Never miss a deadline with calendar integration",
    icon: Calendar,
    href: "/login",
  },
  {
    title: "GitHub Integration",
    description: "Connect your repositories for seamless development",
    icon: Github,
    href: "/login",
  },
  {
    title: "Gamification",
    description: "Earn XP and badges as you make progress",
    icon: Award,
    href: "/login",
  },
]

const supervisorFeatures = [
  {
    title: "Team Overview",
    description: "Monitor all your supervised teams at a glance",
    icon: Users,
    href: "/login",
  },
  {
    title: "Progress Reports",
    description: "Detailed analytics on team performance",
    icon: BarChart3,
    href: "/login",
  },
  {
    title: "Meeting Scheduler",
    description: "Easy scheduling with integrated video calls",
    icon: Calendar,
    href: "/login",
  },
  {
    title: "Feedback System",
    description: "Provide structured feedback on submissions",
    icon: MessageSquare,
    href: "/login",
  },
  {
    title: "Grading Tools",
    description: "Comprehensive evaluation and grading features",
    icon: Award,
    href: "/login",
  },
  {
    title: "Risk Alerts",
    description: "Get notified when teams need attention",
    icon: Bell,
    href: "/login",
  },
]

const teamFeatures = [
  {
    title: "Kanban Boards",
    description: "Visual task management with drag-and-drop",
    icon: Workflow,
    href: "/login",
  },
  {
    title: "File Sharing",
    description: "Secure document storage and sharing",
    icon: FileText,
    href: "/login",
  },
  {
    title: "Version Control",
    description: "Track changes and manage versions",
    icon: Github,
    href: "/login",
  },
  {
    title: "Real-time Collaboration",
    description: "Work together simultaneously",
    icon: Users,
    href: "/login",
  },
  {
    title: "SDLC Phases",
    description: "Follow structured development lifecycle",
    icon: Workflow,
    href: "/login",
  },
  {
    title: "Time Tracking",
    description: "Log hours spent on tasks",
    icon: Clock,
    href: "/login",
  },
]

const adminFeatures = [
  {
    title: "User Management",
    description: "Add, edit, and manage all users",
    icon: Users,
    href: "/login",
  },
  {
    title: "Analytics Dashboard",
    description: "University-wide statistics and insights",
    icon: BarChart3,
    href: "/login",
  },
  {
    title: "System Settings",
    description: "Configure platform settings and features",
    icon: Settings,
    href: "/login",
  },
  {
    title: "Audit Logs",
    description: "Track all system activities",
    icon: Database,
    href: "/login",
  },
  {
    title: "Announcements",
    description: "Broadcast messages to all users",
    icon: Bell,
    href: "/login",
  },
  {
    title: "Data Export",
    description: "Export reports and analytics",
    icon: Code,
    href: "/login",
  },
]

const testimonials = [
  {
    quote: "GPMS transformed how we manage our graduation project. The collaboration features are incredible!",
    name: "Ahmed Hassan",
    role: "Computer Science Student",
  },
  {
    quote:
      "As a supervisor, I can now track all my teams effortlessly. The analytics help me identify struggling teams early.",
    name: "Dr. Sarah Mohamed",
    role: "Professor, Engineering",
  },
  {
    quote:
      "The gamification features kept us motivated throughout the semester. We actually enjoyed tracking our progress!",
    name: "Fatima Ali",
    role: "Software Engineering Team Lead",
  },
]

const faqs = [
  {
    question: "Is GPMS really free for students?",
    answer:
      "Yes! GPMS is completely free for students and academic use. We believe in supporting education and making project management accessible to everyone.",
  },
  {
    question: "How do I invite my team members?",
    answer:
      "Once you create a team, you can invite members via email or share an invite code. They'll receive a notification to join your team.",
  },
  {
    question: "Can my supervisor access our project?",
    answer:
      "Yes, supervisors can be added to teams with special permissions to view progress, provide feedback, and grade submissions.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use enterprise-grade security with SSL encryption, regular backups, and comply with GDPR regulations.",
  },
  {
    question: "Can I use GPMS for non-graduation projects?",
    answer:
      "While designed for graduation projects, GPMS works great for any academic group project or coursework.",
  },
]
