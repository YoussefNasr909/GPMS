"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { useAuthStore } from "@/lib/stores/auth-store"
import { mapApiUserToUiUser } from "@/lib/api/mappers"
import { isUserProfileIncomplete } from "@/lib/auth/profile-completion"

type OAuthParams = {
  token: string | null
  error: string | null
  provider: string | null
}

function getOAuthErrorContent(error: string | null) {
  switch (error) {
    case "OAUTH_NOT_REGISTERED":
      return {
        title: "No account found",
        message: "We couldn't find an account linked to this email. Create an account first, then sign in.",
      }
    case "EMAIL_ALREADY_EXISTS":
      return {
        title: "Account already exists",
        message: "This email is already registered. Please sign in instead.",
      }
    case "OAUTH_STATE_MISMATCH":
      return {
        title: "Sign-in expired",
        message: "Your sign-in session expired or failed a security check. Please try again.",
      }
    case "OAUTH_NOT_CONFIGURED":
      return {
        title: "Provider unavailable",
        message: "This sign-in provider is not available right now. Try another sign-in method.",
      }
    default:
      return {
        title: "Sign in failed",
        message: "Something went wrong during sign in. Please try again.",
      }
  }
}

export default function OAuthCallback() {
  const router = useRouter()
  const { accessToken, hasHydrated, setAccessToken, setCurrentUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  const params = useMemo<OAuthParams>(() => {
    if (typeof window === "undefined") {
      return { token: null, error: null, provider: null }
    }

    const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : ""
    const search = new URLSearchParams(hash)

    return {
      token: search.get("token"),
      error: search.get("error"),
      provider: search.get("provider"),
    }
  }, [])

  useEffect(() => {
    if (params.error) return
    if (!hasHydrated) return
    if (accessToken) return

    if (params.token) {
      setAccessToken(params.token)
      window.history.replaceState({}, document.title, "/oauth/callback")
    }
  }, [hasHydrated, accessToken, params.error, params.token, setAccessToken])

  useEffect(() => {
    if (params.error) return
    if (!hasHydrated) return

    const token = accessToken || params.token
    if (!token) {
      setLoading(false)
      router.replace("/login")
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const apiUser = await authApi.me()
        if (cancelled) return

        setCurrentUser(mapApiUserToUiUser(apiUser))

        if (isUserProfileIncomplete(apiUser)) {
          router.replace("/complete-profile?reason=incomplete")
          return
        }

        router.replace("/dashboard")
      } catch {
        logout()
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hasHydrated, accessToken, params.error, params.token, router, setCurrentUser, logout])

  if (params.error) {
    const { title, message } = getOAuthErrorContent(params.error)
    const providerLabel =
      params.provider === "google" ? "Google" : params.provider === "github" ? "GitHub" : "OAuth"

    const registerOAuthUrl =
      params.provider === "google"
        ? "/api/v1/auth/google?flow=register"
        : params.provider === "github"
          ? "/api/v1/auth/github?flow=register"
          : "/register"

    const loginOAuthUrl =
      params.provider === "google"
        ? "/api/v1/auth/google?flow=login"
        : params.provider === "github"
          ? "/api/v1/auth/github?flow=login"
          : "/login"

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <div className="text-xl font-semibold">{title}</div>

              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{message}</div>

              <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm">
                <div className="font-medium mb-1">What you can do:</div>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {params.error === "OAUTH_NOT_REGISTERED" ? (
                    <>
                      <li>Register a new account using {providerLabel}.</li>
                      <li>Then come back and sign in.</li>
                    </>
                  ) : params.error === "EMAIL_ALREADY_EXISTS" ? (
                    <>
                      <li>Sign in using your email/password or {providerLabel}.</li>
                      <li>If you forgot your password, use &quot;Forgot password&quot;.</li>
                    </>
                  ) : (
                    <>
                      <li>Try again.</li>
                      <li>If the problem continues, use a different sign-in method.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {params.error === "OAUTH_NOT_REGISTERED" ? (
                  <>
                    <Button className="w-full" onClick={() => (window.location.href = registerOAuthUrl)}>
                      Register with {providerLabel}
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => router.replace("/login")}>
                      Back to Login
                    </Button>
                  </>
                ) : params.error === "EMAIL_ALREADY_EXISTS" ? (
                  <>
                    <Button className="w-full" onClick={() => router.replace("/login")}>
                      Go to Login
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => router.replace("/login?forgot=1")}>
                      Forgot password
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" onClick={() => (window.location.href = loginOAuthUrl)}>
                      Try again with {providerLabel}
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => router.replace("/login")}>
                      Back to Login
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-6 rounded-2xl flex items-center gap-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {loading ? "Signing you in..." : "Done"}
      </Card>
    </div>
  )
}
