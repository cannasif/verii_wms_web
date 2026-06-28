import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: 'default' | 'icon'
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateIsDark = () => {
      if (theme === "dark") {
        setIsDark(true)
      } else if (theme === "light") {
        setIsDark(false)
      } else {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
      }
    }

    updateIsDark()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => updateIsDark()
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={t('theme.toggle')}
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300',
          'border-sky-400/20 bg-slate-900/80 text-cyan-300 shadow-[0_0_14px_rgba(56,132,246,0.20)] backdrop-blur-xl',
          'hover:border-cyan-400/50 hover:bg-slate-900 hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(56,132,246,0.40)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35',
        )}
      >
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-label={t('theme.toggle')}
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
