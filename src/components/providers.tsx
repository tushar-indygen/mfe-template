"use client"

import { ConfigProvider } from "@/lib/config-provider"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfigProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </ConfigProvider>
    </SessionProvider>
  )
}
