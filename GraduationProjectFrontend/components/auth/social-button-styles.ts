export const authSocialButtonBaseClass =
  "w-full h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out group border border-border/60 bg-background/85 text-foreground/90 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm hover:-translate-y-0.5 hover:text-foreground hover:shadow-[0_16px_36px_-24px_rgba(15,23,42,0.32)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"

const neutralAuthSocialHoverClass =
  "hover:border-slate-300/75 hover:bg-slate-950/[0.045] dark:hover:border-slate-600/70 dark:hover:bg-slate-100/[0.08] focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700"

export const authSocialButtonClasses = {
  gmail: neutralAuthSocialHoverClass,
  github: neutralAuthSocialHoverClass,
} as const

export const authSocialIconClass =
  "h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105"
