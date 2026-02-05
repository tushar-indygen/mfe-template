"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getAppConfig, isConfigStorageKey } from "@/lib/config/app-config"
import type { AppConfig } from "@/lib/config/app-config"

// Create context with synchronous fallback local config
const ConfigContext = createContext<AppConfig>(getAppConfig())

interface ConfigProviderProps {
  children: React.ReactNode
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(getAppConfig())

  useEffect(() => {
    const refresh = () => {
      setConfig(getAppConfig())
    }

    const handleStorage = (event: StorageEvent) => {
      if (isConfigStorageKey(event.key)) {
        refresh()
      }
    }

    refresh()
    window.addEventListener("storage", handleStorage)
    window.addEventListener("config-refresh", refresh)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("config-refresh", refresh)
    }
  }, [])

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(ConfigContext)
}
