import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: 'default' | 'icon'
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme, useCustomBrandThemes } = useTheme()
  const { t } = useTranslation()
  const isDark = resolvedTheme === "dark"

  const handleToggle = (checked: boolean) => {
    if (useCustomBrandThemes) return
    setTheme(checked ? "dark" : "light")
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        disabled={useCustomBrandThemes}
        onClick={() => {
          if (useCustomBrandThemes) return
          setTheme(isDark ? 'light' : 'dark')
        }}
        aria-label={t('theme.toggle')}
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300',
          'border-[var(--wms-brand-ring)] bg-[var(--wms-app-panel)] text-[var(--wms-brand-primary)] shadow-[0_0_14px_var(--wms-brand-shadow)] backdrop-blur-xl',
          'hover:border-[var(--wms-brand-primary)] hover:bg-[var(--wms-brand-soft)] hover:shadow-[0_0_20px_var(--wms-brand-shadow)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wms-brand-ring)]',
          useCustomBrandThemes && 'pointer-events-none opacity-50',
        )}
      >
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', useCustomBrandThemes && 'opacity-50')}>
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        disabled={useCustomBrandThemes}
        onCheckedChange={handleToggle}
        aria-label={t('theme.toggle')}
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
