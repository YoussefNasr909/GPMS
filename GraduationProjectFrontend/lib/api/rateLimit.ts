export function getRateLimitInfo(err: any): null | { message: string; retryAfterSec: number } {
  const data = err?.response?.data || err?.data || err
  const status = err?.response?.status ?? err?.status

  const code = String(data?.code ?? "")
  const isRateLimited = status === 429 || code.startsWith("RATE_LIMIT")

  if (!isRateLimited) return null

  // Prefer backend value
  let retry = Number(data?.retryAfterSec)

  // Fallbacks (in case)
  if (!Number.isFinite(retry)) {
    const ra = err?.response?.headers?.["retry-after"]
    retry = Number(ra)
  }

  if (!Number.isFinite(retry) || retry < 1) retry = 60

  const friendly =
    code === "RATE_LIMIT_LOGIN"
      ? "Too many login attempts."
      : code === "RATE_LIMIT_REGISTER"
      ? "Too many registration attempts."
      : code === "RATE_LIMIT_FORGOT_PASSWORD"
      ? "Too many reset requests."
      : code === "RATE_LIMIT_OTP"
      ? "Too many verification attempts."
      : "Too many requests."

  return { message: friendly, retryAfterSec: retry }
}
