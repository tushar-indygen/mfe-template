"use client"

import React, { useEffect } from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { useThemeConfig } from "@/hooks/use-config"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeInitializer>{children}</ThemeInitializer>
    </NextThemesProvider>
  )
}

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const themeConfig = useThemeConfig()
  const { theme, resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const cfg = themeConfig

    let active = resolvedTheme || theme || cfg?.default || "light"
    if (!["light", "dark"].includes(active)) {
      active = cfg?.default || "light"
    }

    setTheme?.(active)

    type ThemeName = keyof typeof cfg.themes // "light" | "dark"
    const activeKey = active as ThemeName

    const themeDef = cfg?.themes?.[activeKey]
    const colors = themeDef?.colors

    if (colors && Object.keys(colors).length > 0) {
      const root = document.documentElement

      for (const [key, value] of Object.entries(colors)) {
        root.style.setProperty(`--${key}`, String(value))
        root.style.setProperty(`--color-${key}`, String(value))
      }
    }
  }, [theme, resolvedTheme, themeConfig, setTheme])

  return <>{children}</>
}
