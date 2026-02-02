"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { loadRemoteConfig, getAppConfig } from "@/config"
import type { AppConfig } from "@/config"

// Create context with synchronous fallback local config
const ConfigContext = createContext<AppConfig>(getAppConfig())

interface ConfigProviderProps {
  children: React.ReactNode
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(getAppConfig())

  useEffect(() => {
    loadRemoteConfig().then((remote) => {
      setConfig({ ...remote })
    })
  }, [])

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(ConfigContext)
}
