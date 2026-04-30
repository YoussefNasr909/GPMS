"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"

export function FormAlert({
  type = "error",
  title,
  message,
}: {
  type?: "error" | "success" | "info"
  title?: string
  message: string
}) {
  const styles =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : type === "info"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : "border-red-200 bg-red-50 text-red-800"

  const Icon = type === "success" ? CheckCircle2 : AlertCircle

  return (
    <div className={`rounded-xl border p-3 text-sm ${styles}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5" />
        <div className="flex-1">
          {title && <div className="font-semibold">{title}</div>}
          <div className="leading-relaxed">{message}</div>
        </div>
      </div>
    </div>
  )
}
