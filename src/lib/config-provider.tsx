"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getAppConfig, getSidebarConfigFromLocalStorage } from "@/config"
import type { AppConfig } from "@/config"

// Create context with synchronous fallback local config
const ConfigContext = createContext<AppConfig>(getAppConfig())

interface ConfigProviderProps {
  children: React.ReactNode
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(getAppConfig())

  useEffect(() => {
    const storedSidebar = getSidebarConfigFromLocalStorage()
    if (storedSidebar) {
      setConfig((prev) => ({ ...prev, sidebar: storedSidebar }))
    }
  }, [])

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(ConfigContext)
}
