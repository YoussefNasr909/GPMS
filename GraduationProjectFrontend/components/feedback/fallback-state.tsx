"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, Compass, Home, LayoutDashboard, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FallbackAction = {
  label: string
  kind: "link" | "back" | "retry"
  href?: string
  variant?: "default" | "outline" | "ghost"
}

type FallbackStateProps = {
  kind: "not-found" | "error"
  mode?: "page" | "panel"
  eyebrow?: string
  title: string
  description: string
  helperText?: string
  actions: FallbackAction[]
  onRetry?: () => void
}

export function FallbackState({
  kind,
  mode = "page",
  eyebrow,
  title,
  description,
  helperText,
  actions,
  onRetry,
}: FallbackStateProps) {
  const router = useRouter()
  const isPanel = mode === "panel"

  return (
    <div
      className={cn(
        "w-full",
        isPanel
          ? "flex min-h-[calc(100dvh-12rem)] items-center justify-center"
          : "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6",
      )}
    >
      {!isPanel && <div className="absolute inset-0 gradient-bg opacity-20" />}

      <section
        className={cn(
          "relative w-full max-w-2xl rounded-[28px] border border-border/70 bg-background/95 shadow-sm backdrop-blur-sm",
          isPanel ? "px-6 py-10 sm:px-8" : "px-6 py-12 sm:px-10",
        )}
      >
        <div className="space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {kind === "not-found" ? <Compass className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>

          <div className="space-y-3">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
            {helperText ? <p className="text-sm leading-6 text-muted-foreground">{helperText}</p> : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {actions.map((action, index) => {
              const variant = action.variant ?? (index === 0 ? "default" : "outline")
              const icon =
                action.kind === "back" ? (
                  <ArrowLeft className="h-4 w-4" />
                ) : action.kind === "retry" ? (
                  <RefreshCcw className="h-4 w-4" />
                ) : action.href === "/" ? (
                  <Home className="h-4 w-4" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )

              if (action.kind === "link" && action.href) {
                return (
                  <Button key={`${action.label}-${index}`} variant={variant} className="h-11 rounded-xl px-5" asChild>
                    <Link href={action.href}>
                      {icon}
                      {action.label}
                    </Link>
                  </Button>
                )
              }

              return (
                <Button
                  key={`${action.label}-${index}`}
                  variant={variant}
                  className="h-11 rounded-xl px-5"
                  onClick={() => {
                    if (action.kind === "back") {
                      router.back()
                      return
                    }

                    if (action.kind === "retry") {
                      onRetry?.()
                    }
                  }}
                >
                  {icon}
                  {action.label}
                </Button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
