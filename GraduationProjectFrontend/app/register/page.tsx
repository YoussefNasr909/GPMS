"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { FormAlert } from "@/components/ui/form-alert"
import {
  authSocialButtonBaseClass,
  authSocialButtonClasses,
  authSocialIconClass,
} from "@/components/auth/social-button-styles"
import { GraduationCap, ArrowLeft, Mail, Lock, User, Award as IdCard, Check, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, Shield, Github, Phone, BookOpen, Users, Sparkles, Target, Trophy, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { authApi } from "@/lib/api/auth"
import { useAuthStore } from "@/lib/stores/auth-store"
import { isUserProfileIncomplete } from "@/lib/auth/profile-completion"


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

const ACADEMIC_YEARS = [
  { value: "YEAR_1", label: "Year 1" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
]


const registerFeatures = [
  { icon: Users, title: "Shared project workspace", description: "Keep students, team leaders, and supervisors aligned from the start", bgColor: "bg-blue-500/10", iconColor: "text-blue-500" },
  { icon: Target, title: "Milestone tracking", description: "Stay on top of deliverables, reviews, and deadlines without extra spreadsheets", bgColor: "bg-purple-500/10", iconColor: "text-purple-500" },
  { icon: Github, title: "GitHub-connected workflow", description: "Link development progress with tasks, reviews, and academic delivery", bgColor: "bg-amber-500/10", iconColor: "text-amber-500" },
  { icon: Shield, title: "Verified academic access", description: "Register with a clear, structured flow built for real academic use", bgColor: "bg-green-500/10", iconColor: "text-green-500" },
]

const successFeatures = [
  { icon: BookOpen, label: "Workspace" },
  { icon: Users, label: "Teams" },
  { icon: Sparkles, label: "Milestones" },
]

export default function RegisterPage() {
  const router = useRouter()
  const { accessToken, currentUser, hasHydrated } = useAuthStore()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    academicId: "",
    department: "",
    academicYear: "",
    tracks: [] as string[],
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (!hasHydrated) return
    if ((accessToken || currentUser) && !isUserProfileIncomplete(currentUser)) {
      router.replace("/dashboard")
    }
  }, [hasHydrated, accessToken, currentUser, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (step === 3 && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else if (resendTimer === 0) {
      setCanResend(true)
    }
  }, [resendTimer, step])

  const calculatePasswordStrength = useCallback((password: string) => {
    let strength = 0
    const feedback: string[] = []

    if (password.length >= 8) {
      strength += 25
    } else {
      feedback.push("At least 8 characters")
    }

    if (/[A-Z]/.test(password)) {
      strength += 25
    } else {
      feedback.push("One uppercase letter")
    }

    if (/[0-9]/.test(password)) {
      strength += 25
    } else {
      feedback.push("One number")
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 25
    } else {
      feedback.push("One special character")
    }

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }, [])

  useEffect(() => {
    calculatePasswordStrength(formData.password)
  }, [formData.password, calculatePasswordStrength])

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

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!formData.email.trim()) newErrors.email = "Email is required"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email"
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
      else {
        const digits = formData.phone.replace(/[^\d]/g, "")
        if (digits.length < 7 || digits.length > 15) {
          newErrors.phone = "Phone must be 7–15 digits"
        }
      }
    } else if (currentStep === 2) {
      const normalizedAcademicId = formData.academicId.replace(/[-\s]/g, "")
      if (!normalizedAcademicId) newErrors.academicId = "Academic ID is required"
      else if (!/^\d{8}$/.test(normalizedAcademicId)) newErrors.academicId = "Academic ID must be 8 digits"
      if (!formData.department) newErrors.department = "Department is required"
      if (!formData.academicYear) newErrors.academicYear = "Academic year is required"
      if (formData.tracks.length === 0) newErrors.tracks = "At least one track is required"
      if (!formData.password) {
        newErrors.password = "Password is required"
      } else if (passwordStrength < 75) {
        newErrors.password = "Please create a stronger password"
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = "You must accept the terms"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

   const handleNext = async () => {
    if (!validateStep(step)) return

    // Step 1 -> Step 2
    if (step !== 2) {
      setStep(step + 1)
      return
    }

    // Step 2 submission => call backend register
    setIsLoading(true)
    setErrors({})

    try {
      await authApi.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        academicId: formData.academicId.trim(),
        department: formData.department as any,
        academicYear: formData.academicYear as any,
        preferredTrack: (formData.tracks[0] ?? "") as any,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.agreeTerms,
        role: "STUDENT" as any,
      })

      // Go to OTP step
      setStep(3)
      setResendTimer(60)
      setCanResend(false)
    } catch (err: any) {
      const code = err?.code
      const msg = err?.message ?? ""
      if (code === "EMAIL_ALREADY_EXISTS" || /email/i.test(msg)) {
        setErrors({ email: "This email is already registered" })
        setStep(1)
        setTimeout(() => {
          const el = document.getElementById("email") as HTMLInputElement | null
          el?.focus()
          el?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 0)
      } else if (code === "ACADEMIC_ID_EXISTS") {
        setErrors({ academicId: "Academic ID already exists" })
      } else if (code === "VALIDATION_ERROR") {
        setErrors({ form: err?.message ?? "Please check your entries" })
      } else {
        setErrors({
          form: err?.message ?? "We couldn't create your account right now. Please review your details and try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

   const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.some((digit) => !digit)) {
      setErrors({ otp: "Please enter complete verification code" })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const code = otp.join("")
      await authApi.verifyEmail({ email: formData.email.trim(), code })

      // After successful verification, show success page with 'Continue to Login'
      setStep(4)
    } catch (err: any) {
      setErrors({ otp: err?.message ?? "Verification failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsLoading(true)
    try {
      await authApi.sendVerification({ email: formData.email.trim() })
      setResendTimer(60)
      setCanResend(false)
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, otp: err?.message ?? "Resend failed" }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialRegister = (provider: string) => {
  setIsLoading(true)
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"

  if (provider === "gmail" || provider === "google") {
    window.location.href = `${base}/auth/google?flow=register`
    return
  }

  if (provider === "github") {
    window.location.href = `${base}/auth/github?flow=register`
    return
  }

  setIsLoading(false)
}


  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-background">
        <div className="fixed inset-0 gradient-bg -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            whileHover={{ scale: 1.08, rotate: 8 }}
            className="inline-flex p-4 sm:p-6 rounded-full bg-green-500/20 mb-4 sm:mb-6 hover:shadow-lg transition"
          >
            <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl sm:text-3xl font-bold mb-2"
          >
            Your GPMS account is ready
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-4"
          >
            Registration is complete. Sign in to open your workspace, join your team, and continue with project milestones.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 sm:space-y-4 px-4"
          >
            <Card className="glass-card p-3 sm:p-4 rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{formData.email}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Your registered email</div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {successFeatures.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{ y: -6, scale: 1.05 }}
                  className="glass-card p-2 sm:p-3 rounded-lg sm:rounded-xl text-center hover:shadow-md"
                >
                  <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mx-auto mb-1" />
                  <div className="text-[10px] sm:text-xs text-muted-foreground">{feature.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild className="w-full h-11 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base" size="lg">
                <Link href="/login">
                  Continue to Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-background">
        <div className="fixed inset-0 gradient-bg -z-10" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="glass-card p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background hover:shadow-xl">
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex p-3 sm:p-4 rounded-full bg-primary/10 mb-3 sm:mb-4"
              >
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Check your email</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Enter the 6-digit verification code we sent to
                <br />
                <span className="font-medium text-foreground break-all">{formData.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4 sm:space-y-6">
              <div>
                <Label className="text-center block mb-2 sm:mb-3 text-xs sm:text-sm">Enter Verification Code</Label>
                <div className="flex gap-1.5 sm:gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      aria-label={`Verification code digit ${index + 1}`}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg sm:rounded-xl ${digit ? "border-primary" : ""}`}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <div className="mt-3">
                    <FormAlert type="error" title="Verification failed" message={errors.otp} />
                  </div>
                )}
              </div>

              <motion.div
                whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <>
                      Verify & Continue
                      <Check className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>

              <div className="text-center space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
                <Button
                  variant="link"
                  className="text-primary text-xs sm:text-sm"
                  onClick={handleResend}
                  disabled={!canResend}
                >
                  {canResend ? "Resend Code" : `Resend in ${resendTimer}s`}
                </Button>
              </div>
            </form>
          </Card>

          <div className="mt-4 sm:mt-6 text-center">
            <Button variant="ghost" onClick={() => setStep(2)} className="text-xs sm:text-sm">
              <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back to Registration
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto w-full">
          {/* Logo */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="group h-9 sm:h-10 px-0 hover:bg-transparent"
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="hidden xs:flex flex-col leading-tight">
                <span className="font-bold text-lg sm:text-xl group-hover:text-primary">GPMS</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Graduation Project Management</span>
              </div>
            </Link>
          </Button>

          {/* Right side - Theme toggle and Login button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 group-hover:text-slate-700 transition-colors" />
                )}
              </motion.button>
            )}
            <Button
              asChild
              size="sm"
              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-110 shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      <div className="flex bg-background pt-[60px] sm:pt-[70px] flex-1">
        <div className="fixed inset-0 gradient-bg -z-10 mt-[60px] sm:mt-[70px]" />

        <motion.div
          className="fixed top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none hidden lg:block"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="fixed bottom-20 left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none hidden lg:block"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
        />

        <div className="w-1/2 hidden md:flex flex-col justify-center p-6 lg:p-8 xl:p-12 2xl:p-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-card p-6 lg:p-8 xl:p-10 rounded-2xl space-y-6 xl:space-y-8 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                Student registration
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-tight text-foreground">
                  Create your
                  <br />
                  project workspace
                </h2>
                <p className="text-base xl:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Start with a focused GPMS account built for final-year projects, team collaboration, milestone reviews,
                  and academic delivery.
                </p>
              </div>
            </div>

            <div className="space-y-3 xl:space-y-4 max-w-xl">
              {registerFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex gap-3 group rounded-lg px-2 py-2 hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 transition-all"
                >
                  <div className={`flex-shrink-0 mt-1 p-2 rounded-lg transition-colors ${feature.bgColor}`}>
                    <feature.icon className={`h-4 w-4 xl:h-5 xl:w-5 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm xl:text-base">{feature.title}</h3>
                    <p className="text-xs xl:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 xl:gap-6 pt-2 xl:pt-4">
              <div className="flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-green-500" />
                <span>Protected onboarding</span>
              </div>
              <div className="flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-blue-500" />
                <span>Built for student teams</span>
              </div>
              <div className="flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm text-muted-foreground">
                <Github className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-amber-500" />
                <span>Workflow-ready setup</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
            

            <Card className="glass-card p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl sm:rounded-3xl transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background hover:shadow-xl">
              <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-colors text-sm sm:text-base shrink-0 ${
                        step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : s}
                    </div>
                    {s < 2 && (
                      <div
                        className={`h-1 flex-1 mx-2 sm:mx-3 rounded transition-colors ${step > s ? "bg-primary" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                  {step === 1 ? "Create your account" : "Academic setup"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {step === 1 ? "Start with your basic student details" : "Add your academic context and secure your workspace"}
                </p>
              </div>

              {errors.form && (
                <div className="mb-4 sm:mb-6">
                  <FormAlert type="error" title="Registration problem" message={errors.form} />
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Button
                        variant="outline"
                        className={`${authSocialButtonBaseClass} ${authSocialButtonClasses.gmail}`}
                        onClick={() => handleSocialRegister("gmail")}
                        disabled={isLoading}
                      >
                        <svg className={authSocialIconClass} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.283 10.356h-8.327v3.057h4.983c-.225 1.368-1.187 2.53-2.517 3.286v3.41h4.082c2.383-2.196 3.75-5.435 3.75-9.055 0-.62-.066-1.221-.184-1.798z" fill="#4285F4"/>
                          <path d="M11.956 21.956c3.378 0 6.205-1.122 8.275-3.057l-4.083-3.41c-1.143.713-2.468 1.196-4.192 1.196-3.214 0-5.924-2.366-6.905-5.519H2.723v3.528C4.565 20.029 7.978 21.956 11.956 21.956z" fill="#34A853"/>
                          <path d="M5.051 14.07c-.275-.913-.435-1.89-.435-2.93 0-1.04.16-2.017.435-2.93V4.682H2.723C1.995 6.092 1.5 7.622 1.5 9.14c0 1.518.495 3.048 1.223 4.458l2.328-3.528z" fill="#FBBC04"/>
                          <path d="M11.956 3.88c2.303 0 4.367.757 5.993 2.193l4.489-4.489C18.143 1.462 15.336 0 11.956 0 7.978 0 4.565 1.927 2.723 4.682l2.328 3.528c.98-3.153 3.691-5.33 6.905-5.33z" fill="#EA4335"/>
                        </svg>
                        Gmail
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Button
                        variant="outline"
                        className={`${authSocialButtonBaseClass} ${authSocialButtonClasses.github}`}
                        onClick={() => handleSocialRegister("github")}
                        disabled={isLoading}
                      >
                        <svg className={authSocialIconClass} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </Button>
                    </motion.div>
                  </div>

                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-[10px] sm:text-xs">
                      <span className="bg-card px-2 sm:px-3 text-muted-foreground">or sign up with email</span>
                    </div>
                  </div>
                </>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-xs sm:text-sm">
                          First Name
                        </Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            placeholder="Ahmed"
                            className={`pl-9 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.firstName ? "border-destructive" : ""}`}
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          />
                        </div>
                        {errors.firstName && (
                          <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs sm:text-sm">
                          Last Name
                        </Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="lastName"
                            placeholder="Mohamed"
                            className={`pl-9 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.lastName ? "border-destructive" : ""}`}
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </div>
                        {errors.lastName && (
                          <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-xs sm:text-sm">
                        Email
                      </Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="student@university.edu"
                          className={`pl-9 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.email ? "border-destructive" : ""}`}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      {errors.email && <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-xs sm:text-sm">
                        Phone Number
                      </Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+20 1xx xxx xxxx"
                          className={`pl-9 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.phone ? "border-destructive" : ""}`}
                          value={formData.phone}
                          maxLength={16}
                          onChange={(e) => {
                            const raw = e.target.value
                            const cleaned = raw.startsWith("+")
                              ? "+" + raw.slice(1).replace(/\D/g, "")
                              : raw.replace(/\D/g, "")
                            setFormData({ ...formData, phone: cleaned.slice(0, 16) })
                          }}
                        />
                      </div>
                      {errors.phone && <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.phone}</p>}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div>
                      <Label htmlFor="academicId" className="text-xs sm:text-sm">
                        Academic ID
                      </Label>
                      <div className="relative mt-1">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="academicId"
                          placeholder="XXXXXXXX"
                          className={`pl-9 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.academicId ? "border-destructive" : ""}`}
                          value={formData.academicId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              academicId: e.target.value.replace(/[^0-9]/g, "").slice(0, 8),
                            })
                          }
                          required
                        />
                      </div>
                      {errors.academicId && (
                        <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.academicId}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm">Department</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData({ ...formData, department: value })}
                        >
                          <SelectTrigger
                            className={`h-10 sm:h-11 rounded-lg sm:rounded-xl mt-1 text-sm ${errors.department ? "border-destructive" : ""}`}
                          >
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept.value} value={dept.value}>
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.department && (
                          <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.department}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Academic Year</Label>
                        <Select
                          value={formData.academicYear}
                          onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                        >
                          <SelectTrigger
                            className={`h-10 sm:h-11 rounded-lg sm:rounded-xl mt-1 text-sm ${errors.academicYear ? "border-destructive" : ""}`}
                          >
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_YEARS.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.academicYear && (
                          <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.academicYear}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm flex items-center gap-1">
                        Preferred Track <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.tracks[0] || ""}
                        onValueChange={(value) => setFormData({ ...formData, tracks: [value] })}
                      >
                        <SelectTrigger
                          className={`h-10 sm:h-11 rounded-lg sm:rounded-xl mt-1 text-sm ${errors.tracks ? "border-destructive" : ""}`}
                        >
                          <SelectValue placeholder="Select Your Track" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRACKS.map((track) => (
                            <SelectItem key={track.value} value={track.value}>
                              {track.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.tracks && (
                        <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.tracks}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-xs sm:text-sm">
                        Password
                      </Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className={`pl-9 pr-10 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.password ? "border-destructive" : ""}`}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.password}</p>
                      )}

                      {formData.password && (
                        <div className="mt-2 space-y-1.5 sm:space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress value={passwordStrength} className="h-1.5 sm:h-2 flex-1" />
                            <span
                              className={`text-[10px] sm:text-xs font-medium ${
                                passwordStrength <= 25
                                  ? "text-red-500"
                                  : passwordStrength <= 50
                                    ? "text-orange-500"
                                    : passwordStrength <= 75
                                      ? "text-yellow-500"
                                      : "text-green-500"
                              }`}
                            >
                              {getStrengthText()}
                            </span>
                          </div>
                          {passwordFeedback.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {passwordFeedback.map((feedback) => (
                                <span
                                  key={feedback}
                                  className="text-[9px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded"
                                >
                                  {feedback}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">
                        Confirm Password
                      </Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className={`pl-9 pr-10 h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm ${errors.confirmPassword ? "border-destructive" : ""}`}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                          <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-[10px] sm:text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Checkbox
                          id="terms"
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                          className={errors.agreeTerms ? "border-destructive" : ""}
                        />
                        <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                          I agree to the{" "}
                          <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                {step > 1 && (
                  <Button
                    variant="outline"
                    className="flex-1 h-11 sm:h-12 rounded-lg sm:rounded-xl bg-transparent text-sm"
                    onClick={() => setStep(step - 1)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1 h-11 sm:h-12 rounded-lg sm:rounded-xl text-sm"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : step === 2 ? (
                    <>
                      Create Account
                      <Check className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </Card>

            <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Protected sign-up</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Email verification</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
