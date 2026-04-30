"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { authApi } from "@/lib/api/auth"
import { mapApiUserToUiUser } from "@/lib/api/mappers"
import {
  authSocialButtonBaseClass,
  authSocialButtonClasses,
  authSocialIconClass,
} from "@/components/auth/social-button-styles"


import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Users,
  Zap,
  BarChart3,
  Moon,
  Sun,
  Github,
  AlertCircle,
  ShieldCheck,
  Check,
  Clock,
  HelpCircle,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter, useSearchParams } from "next/navigation"
import { users } from "@/data/users"
import Link from "next/link"
import { useTheme } from "next-themes"
import { FormAlert } from "@/components/ui/form-alert"
import { getRateLimitInfo } from "@/lib/api/rateLimit"
import { isUserProfileIncomplete } from "@/lib/auth/profile-completion"

const features = [
  {
    title: "Role-based workspace",
    description: "Open the tools that match your student, leader, supervisor, or admin role",
    icon: Users,
  },
  {
    title: "Milestones and progress",
    description: "Track reviews, submissions, and deadlines from one clear dashboard",
    icon: BarChart3,
  },
  {
    title: "Team coordination",
    description: "Keep meetings, updates, and task ownership visible for the whole team",
    icon: Zap,
  },
  {
    title: "GitHub context",
    description: "Connect repository activity with your project workflow and reviews",
    icon: Github,
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotEmailError, setForgotEmailError] = useState("")
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [forgotStep, setForgotStep] = useState<"email" | "verify" | "reset" | "success">("email")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [forgotResendTimer, setForgotResendTimer] = useState(0)
  const [forgotVerifyLoading, setForgotVerifyLoading] = useState(false)
  const [resetPassword, setResetPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetPasswordError, setResetPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [resetPasswordStrength, setResetPasswordStrength] = useState(0)
  const [mounted, setMounted] = useState(false)
  // ✅ Email verification UI (for EMAIL_NOT_VERIFIED case)
const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
const [showVerifyEmailDialog, setShowVerifyEmailDialog] = useState(false)
const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""])
const [verifyError, setVerifyError] = useState("")
const [verifyLoading, setVerifyLoading] = useState(false)
const [verifyResendTimer, setVerifyResendTimer] = useState(0)
const [alertMsg, setAlertMsg] = useState<string | null>(null)
const [loginCooldown, setLoginCooldown] = useState(0)

const formatSec = (s: number) => {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, "0")}`
}

useEffect(() => {
  if (loginCooldown <= 0) return
  const t = setInterval(() => setLoginCooldown((v) => Math.max(0, v - 1)), 1000)
  return () => clearInterval(t)
}, [loginCooldown])

useEffect(() => {
  // when cooldown ends, remove the alert automatically
  if (loginCooldown === 0) {
    // keep it only if you want
    // setAlertMsg(null)
  }
}, [loginCooldown])

// resend countdown
useEffect(() => {
  if (verifyResendTimer <= 0) return
  const t = setTimeout(() => setVerifyResendTimer((s) => s - 1), 1000)
  return () => clearTimeout(t)
}, [verifyResendTimer])

const handleVerifyCodeChange = (index: number, value: string) => {
  if (value.length > 1) return
  if (value && !/^\d$/.test(value)) return

  const next = [...verifyCode]
  next[index] = value
  setVerifyCode(next)

  if (value && index < 5) {
    const el = document.getElementById(`verify-email-${index + 1}`) as HTMLInputElement | null
    el?.focus()
  }
}

const openVerifyDialog = async () => {
  const trimmedEmail = email.trim()
  setVerifyError("")
  setVerifyCode(["", "", "", "", "", ""])
  setShowVerifyEmailDialog(true)

  // send code when opening
  try {
    setVerifyLoading(true)
    await authApi.sendVerification({ email: trimmedEmail })
    setVerifyResendTimer(60)
  } catch (err: any) {
    setVerifyError(err?.message ?? "Failed to send verification code")
  } finally {
    setVerifyLoading(false)
  }
}

useEffect(() => {
  if (forgotResendTimer <= 0) return
  const t = setTimeout(() => setForgotResendTimer((s) => s - 1), 1000)
  return () => clearTimeout(t)
}, [forgotResendTimer])

const resendForgotCode = async () => {
  try {
    setForgotVerifyLoading(true)
    setForgotEmailError("")
    await authApi.forgotPassword({ email: forgotEmail.trim() })
    setForgotResendTimer(60)
  } catch (err: any) {
    setForgotEmailError(err?.message ?? "Failed to resend reset code")
  } finally {
    setForgotVerifyLoading(false)
  }
}

const resendVerifyCode = async () => {
  const trimmedEmail = email.trim()
  try {
    setVerifyLoading(true)
    setVerifyError("")
    await authApi.sendVerification({ email: trimmedEmail })
    setVerifyResendTimer(60)
  } catch (err: any) {
    setVerifyError(err?.message ?? "Failed to resend verification code")
  } finally {
    setVerifyLoading(false)
  }
}

const submitVerifyEmail = async () => {
  const trimmedEmail = email.trim()
  const code = verifyCode.join("")

  if (!password) {
    setVerifyError("Please enter your password first, then verify.")
    return
  }
  if (verifyCode.some((d) => !d)) {
    setVerifyError("Please enter the complete 6-digit code")
    return
  }

  try {
    setVerifyLoading(true)
    setVerifyError("")

    // 1) verify email
    await authApi.verifyEmail({ email: trimmedEmail, code })

    // 2) auto login after verification
    const result = await authApi.login({ email: trimmedEmail, password, rememberMe })

    setAuth({
      accessToken: result.token,
      user: mapApiUserToUiUser(result.user),
      rememberSession: rememberMe,
    })

    setNeedsEmailVerification(false)
    setError("")
    setShowVerifyEmailDialog(false)

    setLoginSuccess(true)
    setTimeout(() => router.push("/dashboard"), 800)
  } catch (err: any) {
    setVerifyError(err?.message ?? "Invalid or expired code. Please try again.")
  } finally {
    setVerifyLoading(false)
  }
}

 const { setCurrentUser, setAuth, accessToken, currentUser, hasHydrated } = useAuthStore()

  const router = useRouter()
  const searchParams = useSearchParams()

useEffect(() => {
  if (!hasHydrated) return
  if ((accessToken || currentUser) && !isUserProfileIncomplete(currentUser)) {
    router.replace("/dashboard")
  }
}, [hasHydrated, accessToken, currentUser, router])

useEffect(() => {
  const forgot = searchParams.get("forgot")
  if (forgot === "1") {
    setShowForgotPassword(true)
    setForgotStep("email")

    const emailFromUrl = searchParams.get("email")
    if (emailFromUrl) setForgotEmail(emailFromUrl)
  }
}, [searchParams])

  const { theme, setTheme } = useTheme()


  useEffect(() => {
    setMounted(true)
  }, [])

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError("")
    return true
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required")
      return false
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return false
    }
    setPasswordError("")
    return true
  }

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  // ✅ hard-block requests while rate-limited (prevents Enter key bypass)
if (loginCooldown > 0) {
  setAlertMsg(`Please wait ${formatSec(loginCooldown)} before trying again.`)
  return
}

  setError("")
  setAlertMsg(null) 
  setNeedsEmailVerification(false)

  const trimmedEmail = email.trim()

  const emailOk = validateEmail(trimmedEmail)
  const passOk = validatePassword(password)
  if (!emailOk || !passOk) return

  setIsLoading(true)

  try {
    const result = await authApi.login({
      email: trimmedEmail,
      password,
      rememberMe,
    })

    setAuth({
      accessToken: result.token,
      user: mapApiUserToUiUser(result.user),
      rememberSession: rememberMe,
    })

    setLoginSuccess(true)
    setTimeout(() => router.push("/dashboard"), 1000)
  } catch (err: any) {
    // demo fallback
    const demoUser = users.find((u) => u.email === trimmedEmail)
    if (demoUser && password === "demo123") {
      setCurrentUser(demoUser)
      setLoginSuccess(true)
      setTimeout(() => router.push("/dashboard"), 1000)
      return
    }
const rl = getRateLimitInfo(err)
if (rl) {
  setError("")
  setAlertMsg(`${rl.message} You can try again in ${formatSec(rl.retryAfterSec)}.`)
  setLoginCooldown(rl.retryAfterSec)
  return
}




   if (err?.code === "EMAIL_NOT_VERIFIED") {
  setNeedsEmailVerification(true)
  setError("Email not verified. Click Verify now to receive/enter the code.")
  return
}


    if (err?.code === "NO_PASSWORD") {
      setError("This account doesn't have a password set. Reset your password or sign in with Google/GitHub.")
      return
    }

    if (err?.code === "INVALID_CREDENTIALS" || err?.status === 401) {
      setError("Invalid email or password")
      return
    }

  

    setError(err?.message ?? "We're having trouble signing you in. Please try again.")
  } finally {
    setIsLoading(false)
  }
}




   const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"

    if (provider === "gmail" || provider === "google") {
      window.location.href = `${base}/auth/google?flow=login`

      return
    }

    if (provider === "github") {
      window.location.href = `${base}/auth/github?flow=login`
      return
    }

    setIsLoading(false)
    setError("Unsupported provider")
  }


  if (loginSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 gradient-bg -z-10" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex p-4 sm:p-6 rounded-full bg-green-500/20 mb-4 sm:mb-6"
          >
            <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl sm:text-3xl font-bold mb-2"
          >
            Login Successful!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm sm:text-base text-muted-foreground"
          >
            Redirecting to your dashboard...
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-1 bg-primary rounded-full mt-4 sm:mt-6 max-w-xs mx-auto"
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background">
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
                <span className="font-bold text-base sm:text-lg group-hover:text-primary">GPMS</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Graduation Project Management</span>
              </div>
            </Link>
          </Button>

          {/* Right side - Theme toggle and navigation */}
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
              variant="ghost"
              size="sm"
              className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm rounded-lg hover:bg-primary/10 transition-colors group"
              asChild
            >
              <Link href="/" title="Back to home">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:text-primary" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Animated background */}
      <div className="absolute inset-0 gradient-bg" />

      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl hidden sm:block"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl hidden sm:block"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 flex min-h-screen mt-16 sm:mt-20">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-1/2 hidden md:flex flex-col justify-center p-6 lg:p-8 xl:p-12 2xl:p-20"
        >
          <div className="glass-card p-6 lg:p-8 xl:p-10 rounded-2xl space-y-6 xl:space-y-8 transition-all hover:-translate-y-0.5 hover:shadow-xl">
            

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-tight mb-4 xl:mb-6 text-foreground">
                Return to your
                <br />
                project workspace
              </h2>
              <p className="text-lg xl:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Sign in to continue managing milestones, submissions, team updates, and supervisor feedback in one
                focused academic workspace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-3 xl:space-y-4 max-w-lg"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  whileHover={{ x: 5 }}
                  className="flex gap-3 group rounded-lg px-2 py-2 hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 transition-all"
                >
                  <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-4 w-4 xl:h-5 xl:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm xl:text-base">{feature.title}</h3>
                    <p className="text-xs xl:text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Login form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            <Card className="glass-card p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl sm:rounded-3xl transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background hover:shadow-xl">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Sign in to GPMS</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Access your workspace, project tasks, and review flow.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Button
                    variant="outline"
                    className={`${authSocialButtonBaseClass} ${authSocialButtonClasses.gmail}`}
                    onClick={() => handleSocialLogin("gmail")}
                    disabled={isLoading}
                  >
                    <svg className={authSocialIconClass} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="3,5 3,19" stroke="#EA4335" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="3,5 12,12" stroke="#FBBC05" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="21,5 12,12" stroke="#34A853" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="21,5 21,19" stroke="#4285F4" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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
                    onClick={() => handleSocialLogin("github")}
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
                  <span className="bg-card px-2 sm:px-3 text-muted-foreground">or sign in with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <motion.div
                      animate={{ scale: emailError ? 1.02 : 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@university.edu"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (emailError) validateEmail(e.target.value)
                        }}
                        onBlur={() => validateEmail(email)}
                        className={`h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl pl-9 sm:pl-10 text-sm transition-colors hover:bg-secondary/50 focus:bg-card ${
                          emailError ? "border-destructive focus:ring-destructive" : ""
                        }`}
                      />
                    </motion.div>
                  </div>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-destructive"
                    >
                      {emailError}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs sm:text-sm">
                      Password
                    </Label>
                    <motion.button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[10px] sm:text-xs text-primary hover:underline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Forgot password?
                    </motion.button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <motion.div
                      animate={{ scale: passwordError ? 1.02 : 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (passwordError) validatePassword(e.target.value)
                        }}
                        onBlur={() => validatePassword(password)}
                        className={`h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-10 sm:pr-12 text-sm transition-colors hover:bg-secondary/50 focus:bg-card ${
                          passwordError ? "border-destructive focus:ring-destructive" : ""
                        }`}
                      />
                    </motion.div>
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </motion.button>
                  </div>
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-destructive"
                    >
                      {passwordError}
                    </motion.p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-xs sm:text-sm cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                </div>
{alertMsg && <FormAlert type="error" title="Please slow down" message={alertMsg} />}

               <AnimatePresence mode="wait">
  {error && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-start gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"
    >
      <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />

      <div className="flex-1">
        <div className="leading-relaxed">{error}</div>

        {needsEmailVerification && (
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 focus-visible:ring-rose-500/30"
              onClick={openVerifyDialog}
              disabled={isLoading}
            >
              Verify now
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>


                <motion.div
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                 

                 <Button
  type="submit"
  className="w-full h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all"
  disabled={isLoading || loginCooldown > 0}
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
  ) : loginCooldown > 0 ? (
    <>Try again in {formatSec(loginCooldown)}</>
  ) : (
    <>
      Sign In
      <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
    </>
  )}
</Button>

                </motion.div>
              </form>

              {/* Security badges */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Protected session</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Email verification</span>
                </div>
              </div>

              <div className="mt-5 sm:mt-7">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl sm:rounded-2xl border bg-gradient-to-r from-primary/10 to-secondary/10 p-3 sm:p-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm sm:text-base font-semibold">Need an account?</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Don&apos;t have an account yet? Create one to join your team and start tracking milestones.
                    </p>
                  </div>
                  <Button asChild className="w-full sm:w-auto rounded-lg sm:rounded-xl">
                    <Link href="/register">
                      Create Account
                      <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open)
        if (!open) {
          setForgotStep("email")
          setForgotEmail("")
          setForgotEmailError("")
          setVerificationCode(["", "", "", "", "", ""])
          setResetPassword("")
          setConfirmPassword("")
          setResetPasswordError("")
          setConfirmPasswordError("")
        }
      }}>
        <DialogContent className="w-[94vw] max-w-md mx-auto rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              Recover Your Account
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Step 1: Email Entry */}
            {forgotStep === "email" && (
              <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                  Enter your email address and we&apos;ll help you regain access to your account.
                </DialogDescription>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!forgotEmail) {
                    setForgotEmailError("Email is required")
                    return
                  }
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  if (!emailRegex.test(forgotEmail)) {
                    setForgotEmailError("Please enter a valid email address")
                    return
                  }
                 try {
  setIsLoading(true)
  setForgotEmailError("")
  setVerificationCode(["", "", "", "", "", ""])
  await authApi.forgotPassword({ email: forgotEmail.trim() })
  setForgotStep("verify")
  setForgotResendTimer(60)
} catch (err: any) {
  setForgotEmailError(err?.message ?? "Failed to send reset code")
} finally {
  setIsLoading(false)
}

                }} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="forgot-email" className="text-sm font-semibold block">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="student@university.edu"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value)
                          if (forgotEmailError) setForgotEmailError("")
                        }}
                        className={`h-12 sm:h-13 rounded-xl pl-12 pr-4 text-base transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 ${
                          forgotEmailError ? "border-destructive focus:ring-destructive/20" : ""
                        }`}
                      />
                    </div>
                    {forgotEmailError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive font-medium">
                        {forgotEmailError}
                      </motion.p>
                    )}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border border-blue-200/30 dark:border-blue-900/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Recovery Options Available</p>
                        <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-300">
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-blue-600" />
                            <span>Email verification code</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-blue-600" />
                            <span>Security questions</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-blue-600" />
                            <span>Support team assistance</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 text-sm font-medium bg-transparent hover:bg-muted transition-colors"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Send Code
                          <Mail className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 2: Verification Code */}
            {forgotStep === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="space-y-1">
                  <DialogDescription className="text-base text-muted-foreground">
                    We&apos;ve sent a 6-digit code to <strong className="text-foreground font-semibold">{forgotEmail}</strong>
                  </DialogDescription>
                  <p className="text-sm text-muted-foreground">Enter it below to verify your identity</p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (verificationCode.some(code => !code)) {
                    setForgotEmailError("Please enter all 6 digits")
                    return
                  }
                  const code = verificationCode.join("")
try {
  setIsLoading(true)
  setForgotEmailError("")
  await authApi.verifyResetCode({ email: forgotEmail.trim(), code })
  setForgotStep("reset")
} catch (err: any) {
  setForgotEmailError(err?.message ?? "Invalid reset code")
} finally {
  setIsLoading(false)
}

                }} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">Verification Code</Label>
                    <div
                      className="mx-auto w-full max-w-[360px]"
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text") || ""
                        const digits = text.replace(/\D/g, "").slice(0, 6)
                        if (digits.length === 6) {
                          setVerificationCode(digits.split(""))
                        }
                      }}
                    >
                      <div className="grid grid-cols-6 gap-2 sm:gap-3">
                        {verificationCode.map((digit, index) => (
                          <Input
                            key={index}
                            id={`verify-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            autoFocus={index === 0}
                            value={digit}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value.length <= 1 && /^\d*$/.test(value)) {
                                const next = [...verificationCode]
                                next[index] = value
                                setVerificationCode(next)
                                if (value && index < 5) {
                                  const el = document.getElementById(`verify-${index + 1}`) as HTMLInputElement | null
                                  el?.focus()
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
                                const el = document.getElementById(`verify-${index - 1}`) as HTMLInputElement | null
                                el?.focus()
                              }
                              if (e.key === "ArrowLeft" && index > 0) {
                                const el = document.getElementById(`verify-${index - 1}`) as HTMLInputElement | null
                                el?.focus()
                              }
                              if (e.key === "ArrowRight" && index < 5) {
                                const el = document.getElementById(`verify-${index + 1}`) as HTMLInputElement | null
                                el?.focus()
                              }
                            }}
                            className="h-11 sm:h-12 w-full rounded-xl text-center text-[18px] sm:text-lg font-bold tracking-widest focus-visible:ring-2"
                            aria-label={`Verification code digit ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                    {forgotEmailError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive font-medium text-center">
                        {forgotEmailError}
                      </motion.p>
                    )}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-amber-500/5 to-amber-500/0 border border-amber-200/30 dark:border-amber-900/30 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Code expires in 10 minutes</p>
                        <p className="text-xs text-amber-800 dark:text-amber-300">Didn&apos;t receive it? Check spam or request a new code.</p>
                      </div>
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        className="text-primary hover:underline disabled:opacity-50"
                        onClick={resendForgotCode}
                        disabled={forgotVerifyLoading || forgotResendTimer > 0}
                      >
                        {forgotResendTimer > 0 ? `Resend in ${forgotResendTimer}s` : "Resend code"}
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => setForgotStep("email")}
                      >
                        Change email
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 text-sm font-medium bg-transparent hover:bg-muted transition-colors"
                      onClick={() => setForgotStep("email")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all" 
                      disabled={isLoading || verificationCode.some(d => !d)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Verify Code
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Reset Password */}
            {forgotStep === "reset" && (
              <motion.div key="reset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="space-y-1">
                  <DialogDescription className="text-base text-muted-foreground">
                    Create a new password for your account. Ensure it&apos;s strong and unique.
                  </DialogDescription>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!resetPassword) {
                    setResetPasswordError("Password is required")
                    return
                  }
                  if (resetPassword.length < 8) {
                    setResetPasswordError("Password must be at least 8 characters")
                    return
                  }
                  if (!/[A-Z]/.test(resetPassword)) {
                    setResetPasswordError("Password must contain at least one uppercase letter (A-Z)")
                    return
                  }
                  if (!/[0-9]/.test(resetPassword)) {
                    setResetPasswordError("Password must contain at least one number (0-9)")
                    return
                  }
                  if (!/[^A-Za-z0-9]/.test(resetPassword)) {
                    setResetPasswordError("Password must contain at least one special character (!@#$%^&*)")
                    return
                  }
                  if (resetPassword !== confirmPassword) {
                    setConfirmPasswordError("Passwords don't match")
                    return
                  }
                  const code = verificationCode.join("")
try {
  setIsLoading(true)
  await authApi.resetPassword({
    email: forgotEmail.trim(),
    code,
    password: resetPassword,
    confirmPassword,
  })
  setForgotStep("success")
} catch (err: any) {
  setResetPasswordError(err?.message ?? "Failed to reset password")
} finally {
  setIsLoading(false)
}

                }} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">New Password <span className="text-destructive">*</span></Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type={showResetPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={resetPassword}
                        onChange={(e) => {
                          setResetPassword(e.target.value)
                          setResetPasswordStrength(
                            e.target.value.length >= 12 && /[A-Z]/.test(e.target.value) && /[0-9]/.test(e.target.value) && /[^A-Za-z0-9]/.test(e.target.value) ? 100 : 
                            e.target.value.length >= 8 && /[A-Z]/.test(e.target.value) && /[0-9]/.test(e.target.value) && /[^A-Za-z0-9]/.test(e.target.value) ? 75 : 
                            e.target.value.length >= 6 && /[^A-Za-z0-9]/.test(e.target.value) ? 50 : 25
                          )
                          if (resetPasswordError) setResetPasswordError("")
                        }}
                        className={`h-12 sm:h-13 rounded-xl pl-12 pr-12 text-base transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 ${resetPasswordError ? "border-destructive focus:ring-destructive/20" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showResetPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {resetPasswordError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive font-medium">
                        {resetPasswordError}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">Confirm Password <span className="text-destructive">*</span></Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (confirmPasswordError) setConfirmPasswordError("")
                        }}
                        className={`h-12 sm:h-13 rounded-xl pl-12 pr-12 text-base transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 ${confirmPasswordError ? "border-destructive focus:ring-destructive/20" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive font-medium">
                        {confirmPasswordError}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Password Strength</Label>
                      <span className="text-xs text-muted-foreground">{resetPasswordStrength}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${resetPasswordStrength}%` }}
                        className={`h-full rounded-full ${
                          resetPasswordStrength < 50 ? "bg-red-500" : resetPasswordStrength < 75 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                      />
                    </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-200/30 dark:border-green-900/30 rounded-xl p-4 space-y-3"
                  >
                    <p className="text-sm font-semibold text-green-900 dark:text-green-200">Password Requirements <span className="text-xs font-normal text-green-800 dark:text-green-300">(All Required)</span></p>
                    <ul className="space-y-2">
                      <li className={`flex items-center gap-2 text-sm transition-colors ${
                        resetPassword.length >= 8 ? "text-green-700 dark:text-green-300" : "text-green-600 dark:text-green-400"
                      }`}>
                        <Check className={`h-4 w-4 ${resetPassword.length >= 8 ? "opacity-100" : "opacity-40"}`} />
                        <span>At least 8 characters</span>
                      </li>
                      <li className={`flex items-center gap-2 text-sm transition-colors ${
                        /[A-Z]/.test(resetPassword) ? "text-green-700 dark:text-green-300" : "text-green-600 dark:text-green-400"
                      }`}>
                        <Check className={`h-4 w-4 ${/[A-Z]/.test(resetPassword) ? "opacity-100" : "opacity-40"}`} />
                        <span>One uppercase letter</span>
                      </li>
                      <li className={`flex items-center gap-2 text-sm transition-colors ${
                        /[0-9]/.test(resetPassword) ? "text-green-700 dark:text-green-300" : "text-green-600 dark:text-green-400"
                      }`}>
                        <Check className={`h-4 w-4 ${/[0-9]/.test(resetPassword) ? "opacity-100" : "opacity-40"}`} />
                        <span>One number</span>
                      </li>
                      <li className={`flex items-center gap-2 text-sm transition-colors ${
                        /[^A-Za-z0-9]/.test(resetPassword) ? "text-green-700 dark:text-green-300" : "text-green-600 dark:text-green-400"
                      }`}>
                        <Check className={`h-4 w-4 ${/[^A-Za-z0-9]/.test(resetPassword) ? "opacity-100" : "opacity-40"}`} />
                        <span>One special character (!@#$%^&*)</span>
                      </li>
                    </ul>
                  </motion.div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 text-sm font-medium bg-transparent hover:bg-muted transition-colors"
                      onClick={() => setForgotStep("verify")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || resetPasswordStrength < 75}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Reset Password
                          <Check className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {forgotStep === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1, damping: 15 }}
                  className="inline-flex p-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-2 ring-green-500/30"
                >
                  <CheckCircle2 className="h-14 w-14 text-green-500" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <h4 className="font-bold text-2xl">Password Reset Successful!</h4>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Your password has been updated securely. You can now sign in with your new credentials.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    className="w-full h-12 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotStep("email")
                      setForgotEmail("")
                    }}
                  >
                    Return to Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      {/* ✅ Verify Email Dialog */}
<Dialog
  open={showVerifyEmailDialog}
  onOpenChange={(open) => {
    setShowVerifyEmailDialog(open)
    if (!open) {
      setVerifyError("")
      setVerifyCode(["", "", "", "", "", ""])
    }
  }}
>
  <DialogContent className="w-[94vw] max-w-md mx-auto rounded-2xl p-5 sm:p-6">
    <DialogHeader className="space-y-2">
      <DialogTitle className="text-lg sm:text-xl">Verify your email</DialogTitle>
      <DialogDescription className="leading-relaxed">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium break-all">{email.trim()}</span>
      </DialogDescription>
    </DialogHeader>

    <div className="mt-4 space-y-4">
      {/* Code inputs */}
      <div className="mx-auto w-full max-w-[340px]">
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {verifyCode.map((digit, index) => (
            <Input
              key={index}
              id={`verify-email-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleVerifyCodeChange(index, e.target.value)}
              className="
                h-11 sm:h-12 w-full
                rounded-xl
                text-center
                text-[18px] sm:text-lg
                font-bold
                tracking-widest
                focus-visible:ring-2
              "
              aria-label={`Verification code digit ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {verifyError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
          {verifyError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resendVerifyCode}
          disabled={verifyLoading || verifyResendTimer > 0}
          className="w-full sm:w-auto justify-center sm:justify-start"
        >
          {verifyResendTimer > 0 ? `Resend in ${verifyResendTimer}s` : "Resend code"}
        </Button>

        <Button
          type="button"
          onClick={submitVerifyEmail}
          disabled={verifyLoading || verifyCode.some((d) => !d)}
          className="w-full sm:w-auto"
        >
          {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Login"}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>


    </div>
  )
}
