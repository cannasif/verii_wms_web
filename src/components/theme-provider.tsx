/* eslint-disable react-refresh/only-export-components */
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  BRAND_THEME_CLASS_PREFIX,
  BRAND_THEME_STORAGE_KEY,
  type BrandTheme,
  brandThemes,
  getBrandThemeClass,
  isBrandTheme,
} from "@/lib/brand-themes"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  brandThemeStorageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: Exclude<Theme, "system">
  brandTheme: BrandTheme
  setTheme: (theme: Theme) => void
  setBrandTheme: (theme: BrandTheme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  brandTheme: "v3rii",
  setTheme: () => null,
  setBrandTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function getResolvedTheme(theme: Theme): Exclude<Theme, "system"> {
  if (theme !== "system") return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeClass(theme: Theme): Exclude<Theme, "system"> {
  const root = window.document.documentElement
  const resolvedTheme = getResolvedTheme(theme)

  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  root.dataset.theme = resolvedTheme

  return resolvedTheme
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  brandThemeStorageKey = BRAND_THEME_STORAGE_KEY,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<Theme, "system">>(() => getResolvedTheme(
    (localStorage.getItem(storageKey) as Theme) || defaultTheme
  ))
  const [brandTheme, setBrandTheme] = useState<BrandTheme>(() => {
    const stored = localStorage.getItem(brandThemeStorageKey)
    return isBrandTheme(stored) ? stored : "v3rii"
  })

  useEffect(() => {
    setResolvedTheme(applyThemeClass(theme))
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setResolvedTheme(applyThemeClass('system'))
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    const themeClasses = brandThemes.map((item) => item.className)
    root.classList.remove(...themeClasses)
    root.classList.add(getBrandThemeClass(brandTheme))
    root.dataset.brandTheme = brandTheme
  }, [brandTheme])

  const setThemeAndStore = useCallback((nextTheme: Theme) => {
    localStorage.setItem(storageKey, nextTheme)
    setTheme(nextTheme)
  }, [storageKey])

  const setBrandThemeAndStore = useCallback((nextTheme: BrandTheme) => {
    const root = window.document.documentElement
    root.classList.forEach((className) => {
      if (className.startsWith(BRAND_THEME_CLASS_PREFIX)) {
        root.classList.remove(className)
      }
    })
    localStorage.setItem(brandThemeStorageKey, nextTheme)
    setBrandTheme(nextTheme)
  }, [brandThemeStorageKey])

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    brandTheme,
    setTheme: setThemeAndStore,
    setBrandTheme: setBrandThemeAndStore,
  }), [theme, resolvedTheme, brandTheme, setThemeAndStore, setBrandThemeAndStore])

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
