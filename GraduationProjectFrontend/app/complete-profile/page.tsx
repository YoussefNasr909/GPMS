"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { FormAlert } from "@/components/ui/form-alert"
import {
  GraduationCap,
  ArrowLeft,
  Phone,
  Lock,
  Award as IdCard,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  BookOpen,
  Shield,
  Users,
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"


// ✅ A) Added imports
import { authApi } from "@/lib/api/auth"
import { useAuthStore } from "@/lib/stores/auth-store"
import { mapApiUserToUiUser } from "@/lib/api/mappers"
import { doesUserRequireStudentAcademicFields, isUserProfileIncomplete } from "@/lib/auth/profile-completion"

// ✅ B) Using enum-values that match your backend Prisma enums
const DEPARTMENTS = [
  { value: "COMPUTER_SCIENCE", label: "Computer Science" },
  { value: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
  { value: "INFORMATION_TECHNOLOGY", label: "Information Technology" },
  { value: "COMPUTER_ENGINEERING", label: "Computer Engineering" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "ARTIFICIAL_INTELLIGENCE", label: "Artificial Intelligence" },
  { value: "CYBERSECURITY_INFOSEC", label: "Cybersecurity / InfoSec" },
  { value: "INFORMATION_SYSTEMS", label: "Information Systems" },
  { value: "BIOINFORMATICS", label: "Bioinformatics" },
]

const ACADEMIC_YEARS = [
  { value: "YEAR_1", label: "Year 1" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
]

const TRACKS = [
  { value: "FRONTEND_DEVELOPMENT", label: "Frontend Development" },
  { value: "BACKEND_DEVELOPMENT", label: "Backend Development" },
  { value: "FULLSTACK_DEVELOPMENT", label: "Full Stack Development" },
  { value: "MOBILE_APP_DEVELOPMENT", label: "Mobile Development" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "CLOUD_ENGINEERING", label: "Cloud Engineering" },
  { value: "SOFTWARE_ARCHITECTURE", label: "Software Architecture" },
  { value: "QUALITY_ASSURANCE", label: "QA & Testing" },
  { value: "GAME_DEVELOPMENT", label: "Game Development" },
]

const features = [
  {
    icon: Shield,
    title: "Verified academic setup",
    description: "Add the student details needed to unlock the right workspace and permissions",
  },
  {
    icon: Users,
    title: "Team-ready access",
    description: "Join your project group and stay aligned with teammates and supervisors",
  },
  {
    icon: BookOpen,
    title: "Milestone workflow",
    description: "Connect deadlines, reviews, and submissions from the start of the project",
  },
  {
    icon: Lock,
    title: "Secure sign-in",
    description: "Create a strong password for future access after Google or GitHub sign-in",
  },
]

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")
  const { theme, setTheme } = useTheme()

  // ✅ G) Using store to ensure user is authenticated
  const { accessToken, currentUser, hasHydrated, setCurrentUser, setAccessToken, logout } = useAuthStore()
  const readTokenFromUrl = useCallback(() => {
    if (typeof window === "undefined") return null

    // token can be in hash (#token=...) because backend redirects like that
    const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : ""
    const fromHash = hash ? new URLSearchParams(hash).get("token") : null
    if (fromHash) return fromHash

    // fallback if you ever switch backend to ?token=
    return new URLSearchParams(window.location.search).get("token")
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    phone: "",
    academicId: "",
    department: "",
    academicYear: "",
    preferredTrack: "",
    password: "",
    confirmPassword: "",
  })
  const [requiresStudentAcademicFields, setRequiresStudentAcademicFields] = useState(() =>
    currentUser ? doesUserRequireStudentAcademicFields(currentUser) : true,
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // 1) store token from URL into zustand
  useEffect(() => {
    if (!hasHydrated) return
    if (accessToken) return

    const token = readTokenFromUrl()
    if (!token) return

    setAccessToken(token)

    const cleanPath = reason ? `/complete-profile?reason=${encodeURIComponent(reason)}` : "/complete-profile"
    window.history.replaceState({}, document.title, cleanPath)
  }, [hasHydrated, accessToken, setAccessToken, readTokenFromUrl, reason])

  // 2) auto-load /me; if profile already complete => go dashboard
  useEffect(() => {
    if (!hasHydrated) return
    if (!accessToken) return

    let cancelled = false

    ;(async () => {
      try {
        const apiUser = await authApi.me()
        if (cancelled) return

        const mappedUser = mapApiUserToUiUser(apiUser)
        setCurrentUser(mappedUser)
        setRequiresStudentAcademicFields(doesUserRequireStudentAcademicFields(apiUser))
        const academicId = String((apiUser as any).academicId ?? "")
        setFormData((prev) => ({
          ...prev,
          phone: prev.phone || String(apiUser.phone ?? ""),
          academicId: prev.academicId || (academicId.startsWith("OAUTH-") ? "" : academicId),
          department: prev.department || String(apiUser.department ?? ""),
          academicYear: prev.academicYear || String(apiUser.academicYear ?? ""),
          preferredTrack: prev.preferredTrack || String((apiUser as any).preferredTrack ?? ""),
        }))

        if (!isUserProfileIncomplete(apiUser)) router.replace("/dashboard")
      } catch (e) {
        logout()
        router.replace("/login")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hasHydrated, accessToken, setCurrentUser, logout, router])


  /* duplicate state block removed after hook reordering
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ✅ C) Added preferredTrack
  const [formData, setFormData] = useState({
    phone: "",
    academicId: "",
    department: "",
    academicYear: "",
    preferredTrack: "",
    password: "",
    confirmPassword: "",
  })
  const [requiresStudentAcademicFields, setRequiresStudentAcademicFields] = useState(() =>
    currentUser ? doesUserRequireStudentAcademicFields(currentUser) : true,
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  */

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!currentUser) return
    setRequiresStudentAcademicFields(doesUserRequireStudentAcademicFields(currentUser))
  }, [currentUser])

  useEffect(() => {
    if (requiresStudentAcademicFields) return

    setFormData((prev) => {
      if (!prev.academicYear && !prev.preferredTrack) return prev

      return {
        ...prev,
        academicYear: "",
        preferredTrack: "",
      }
    })

    setErrors((prev) => {
      if (!prev.academicYear && !prev.preferredTrack) return prev

      const next = { ...prev }
      delete next.academicYear
      delete next.preferredTrack
      return next
    })
  }, [requiresStudentAcademicFields])

  const calculatePasswordStrength = useCallback((password: string) => {
    let strength = 0
    const feedback: string[] = []

    if (password.length >= 8) strength += 25
    else feedback.push("At least 8 characters")

    if (/[A-Z]/.test(password)) strength += 25
    else feedback.push("One uppercase letter")

    if (/[0-9]/.test(password)) strength += 25
    else feedback.push("One number")

    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    else feedback.push("One special character")

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }, [])

  useEffect(() => {
    calculatePasswordStrength(formData.password)
  }, [formData.password, calculatePasswordStrength])

  // redirect if no token
 useEffect(() => {
  if (!hasHydrated) return
  if (accessToken) return

  // If token is in the URL, don't redirect yet (we will store it in the other effect)
  const token = readTokenFromUrl()
  if (token) return

  router.replace("/login")
}, [hasHydrated, accessToken, router, readTokenFromUrl])



  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-orange-500"
    if (passwordStrength <= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength <= 25) return "Weak"
    if (passwordStrength <= 50) return "Fair"
    if (passwordStrength <= 75) return "Good"
    return "Strong"
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    {
      const normalizedAcademicId = formData.academicId.replace(/[-\s]/g, "")
      if (!normalizedAcademicId) {
        newErrors.academicId = "Academic ID is required"
      } else if (!/^\d{8}$/.test(normalizedAcademicId)) {
        newErrors.academicId = "Academic ID must be 8 digits"
      }
    }

    if (!formData.department) {
      newErrors.department = "Department is required"
    }

    if (requiresStudentAcademicFields && !formData.academicYear) {
      newErrors.academicYear = "Academic year is required"
    }

    // ✅ D) Added preferredTrack validation
    if (requiresStudentAcademicFields && !formData.preferredTrack) {
      newErrors.preferredTrack = "Preferred track is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (passwordStrength < 75) {
      newErrors.password = "Please create a stronger password"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "academicId" ? value.replace(/[^0-9]/g, "").slice(0, 8) : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // ✅ G) Real submit: calls backend + refreshes /me + redirects to dashboard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      await authApi.oauthComplete({
        phone: formData.phone.trim(),
        academicId: formData.academicId.trim(),
        department: formData.department as any,
        academicYear: requiresStudentAcademicFields ? (formData.academicYear as any) : undefined,
        preferredTrack: requiresStudentAcademicFields ? (formData.preferredTrack as any) : undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      const apiUser = await authApi.me()
      setCurrentUser(mapApiUserToUiUser(apiUser))

      setSuccess(true)
      setTimeout(() => router.replace("/dashboard"), 800)
    } catch (err: any) {
      const code = err?.code
      if (code === "ACADEMIC_ID_EXISTS") {
        setErrors({ academicId: "Academic ID already exists" })
      } else {
        setErrors({ form: err?.message ?? "Failed to complete profile" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const pageNavbar = (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="group h-10 px-0 hover:bg-transparent">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/15">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 text-left leading-tight">
              <div className="text-sm font-bold sm:text-lg">GPMS</div>
              <div className="hidden text-[11px] text-muted-foreground xs:block sm:text-xs">
                Graduation Project Management
              </div>
            </div>
          </Link>
        </Button>

        <div className="flex items-center gap-2 sm:gap-3">
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </motion.button>
          )}

          <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-2xl">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back Home
            </Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 gradient-bg -z-10" />
        {pageNavbar}

        <motion.div
          className="fixed top-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none hidden lg:block"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md text-center"
          >
            <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2, duration: 0.8 }}
            className="inline-flex p-4 sm:p-6 rounded-full bg-emerald-500/[0.15] mb-4 sm:mb-6 ring-2 ring-emerald-500/25"
            >
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-500" />
            </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4"
          >
            Profile complete
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8"
          >
            Your workspace setup is finished. You can now open your dashboard and continue with your project flow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-3 sm:space-y-4"
          >
            <Button asChild size="lg" className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold group">
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-transparent">
              <Link href="/" className="text-sm sm:text-base">
                Back to Home
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-4"
          >
            {[
              { icon: Shield, text: "Verified" },
              { icon: Users, text: "Team-ready" },
              { icon: Lock, text: "Secure" },
              { icon: BookOpen, text: "Dashboard access" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center"
              >
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 gradient-bg -z-10" />
      {pageNavbar}

      <motion.div
        className="fixed top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="fixed bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl mx-auto"
        >
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-6 lg:gap-8 items-start">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hidden lg:block lg:sticky lg:top-28"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                  Final setup step
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Finish your student workspace</h1>
                    <p className="text-muted-foreground">
                      Add the remaining academic details so GPMS can open the right dashboard, milestones, and team workflow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="rounded-[1.35rem] border border-border/60 bg-background/80 p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.35)] backdrop-blur"
                  >
                    <feature.icon className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="overflow-hidden rounded-[1.8rem] border border-border/60 bg-background/95 shadow-[0_30px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="lg:hidden mb-5 space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Final setup step
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Finish your profile</h1>
                    <p className="text-sm text-muted-foreground">
                      Add the remaining academic details to unlock your GPMS workspace.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <Button variant="ghost" size="sm" asChild className="rounded-xl">
                    <Link href="/" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Home
                    </Link>
                  </Button>
                  <div className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    Step 2 of 2
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Complete your workspace access</h2>
                  <p className="text-sm text-muted-foreground">
                    {requiresStudentAcademicFields
                      ? "If you signed in with Google or GitHub, add the remaining academic details below."
                      : "If you signed in with Google or GitHub, add the remaining access details below."}
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-full rounded-full bg-primary" />
                  </div>
                </div>

                {reason === "incomplete" && (
                  <div className="mb-4">
                    <FormAlert
                      type="info"
                      title="Profile required"
                      message={
                        requiresStudentAcademicFields
                          ? "Please complete your profile to continue. Some required academic information is still missing."
                          : "Please complete your profile to continue. This role only needs contact, department, and ID details."
                      }
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {errors.form && (
                    <FormAlert
                      type="error"
                      title="Could not complete profile"
                      message={errors.form}
                    />
                  )}

                  {/* Phone */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold mb-2 block">
                      Phone Number
                    </Label>
                    <div className={`relative transition-all ${focusedField === "phone" ? "ring-2 ring-primary rounded-xl sm:rounded-2xl" : ""}`}>
                      <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+20 1xx xxx xxxx"
                        className={`pl-9 sm:pl-11 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                          errors.phone ? "border-destructive" : focusedField === "phone" ? "border-transparent" : ""
                        }`}
                        value={formData.phone}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                    {errors.phone && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.phone}</p>}
                  </motion.div>

                  {/* Academic ID */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Label htmlFor="academicId" className="text-xs sm:text-sm font-semibold mb-2 block">
                      {requiresStudentAcademicFields ? "Academic ID" : "Academic / Staff ID"}
                    </Label>
                    <div className={`relative transition-all ${focusedField === "academicId" ? "ring-2 ring-primary rounded-xl sm:rounded-2xl" : ""}`}>
                      <IdCard className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input
                        id="academicId"
                        name="academicId"
                        type="text"
                        placeholder={requiresStudentAcademicFields ? "XXXXXXXX" : "Enter your academic or staff ID"}
                        className={`pl-9 sm:pl-11 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                          errors.academicId ? "border-destructive" : focusedField === "academicId" ? "border-transparent" : ""
                        }`}
                        value={formData.academicId}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("academicId")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                    {errors.academicId && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.academicId}</p>}
                  </motion.div>

                  {/* Department and Academic Year */}
                  <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${requiresStudentAcademicFields ? "sm:grid-cols-2" : ""}`}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                      <Label htmlFor="department" className="text-xs sm:text-sm font-semibold mb-2 block">
                        Department
                      </Label>
                      <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
                        <SelectTrigger
                          className={`h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                            errors.department ? "border-destructive" : focusedField === "department" ? "ring-2 ring-primary" : ""
                          }`}
                          onFocus={() => setFocusedField("department")}
                          onBlur={() => setFocusedField(null)}
                        >
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        {/* ✅ F) mapping uses value/label */}
                        <SelectContent className="rounded-xl sm:rounded-2xl">
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.department}</p>}
                    </motion.div>

                    {requiresStudentAcademicFields && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                      <Label htmlFor="academicYear" className="text-xs sm:text-sm font-semibold mb-2 block">
                        Academic Year
                      </Label>
                      <Select value={formData.academicYear} onValueChange={(value) => handleSelectChange("academicYear", value)}>
                        <SelectTrigger
                          className={`h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                            errors.academicYear ? "border-destructive" : focusedField === "academicYear" ? "ring-2 ring-primary" : ""
                          }`}
                          onFocus={() => setFocusedField("academicYear")}
                          onBlur={() => setFocusedField(null)}
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl sm:rounded-2xl">
                          {ACADEMIC_YEARS.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.academicYear && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.academicYear}</p>}
                    </motion.div>
                    )}
                  </div>

                  {/* ✅ E) Preferred Track added */}
                  {requiresStudentAcademicFields ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
                    <Label htmlFor="preferredTrack" className="text-xs sm:text-sm font-semibold mb-2 block">
                      Preferred Track
                    </Label>
                    <Select value={formData.preferredTrack} onValueChange={(value) => handleSelectChange("preferredTrack", value)}>
                      <SelectTrigger
                        className={`h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                          errors.preferredTrack ? "border-destructive" : focusedField === "preferredTrack" ? "ring-2 ring-primary" : ""
                        }`}
                        onFocus={() => setFocusedField("preferredTrack")}
                        onBlur={() => setFocusedField(null)}
                      >
                        <SelectValue placeholder="Select track" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl sm:rounded-2xl">
                        {TRACKS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.preferredTrack && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.preferredTrack}</p>}
                  </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75 }}
                      className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
                    >
                      Academic year and preferred track are only required for student and leader accounts.
                    </motion.div>
                  )}

                  {/* Password */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <Label htmlFor="password" className="text-xs sm:text-sm font-semibold mb-2 block">
                      Password
                    </Label>
                    <div className={`relative transition-all ${focusedField === "password" ? "ring-2 ring-primary rounded-xl sm:rounded-2xl" : ""}`}>
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className={`pl-9 sm:pl-11 pr-9 sm:pr-11 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                          errors.password ? "border-destructive" : focusedField === "password" ? "border-transparent" : ""
                        }`}
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                      />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.password}</p>}

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className="font-medium">{getStrengthText()}</span>
                      </div>
                      <div className="relative">
                        <Progress value={passwordStrength} className="h-2 rounded-full" />
                        <div className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getStrengthColor()}`} style={{ width: `${passwordStrength}%` }} />
                      </div>

                      <AnimatePresence>
                        {passwordFeedback.length > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1">
                            {passwordFeedback.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                                {item}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold mb-2 block">
                      Confirm Password
                    </Label>
                    <div className={`relative transition-all ${focusedField === "confirmPassword" ? "ring-2 ring-primary rounded-xl sm:rounded-2xl" : ""}`}>
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className={`pl-9 sm:pl-11 pr-9 sm:pr-11 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm transition-all ${
                          errors.confirmPassword ? "border-destructive" : focusedField === "confirmPassword" ? "border-transparent" : ""
                        }`}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                      />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                          <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    {errors.confirmPassword && <p className="text-xs sm:text-sm text-destructive mt-1.5">{errors.confirmPassword}</p>}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold group"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving profile...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Finish setup
                          <Check className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </Card>
          </motion.div>
        </div>
        </motion.div>
      </div>
    </div>
  )
}
