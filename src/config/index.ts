import authConfig from "@/config/auth.config.json"
import uiConfig from "@/config/ui.config.json"
import themeConfig from "@/config/theme.config.json"
import sidebarConfig from "@/config/sidebar.config.json"

import type {
  AuthConfig,
  UIConfig,
  ThemeConfig,
  SidebarConfig,
} from "@/config/config.types"

const SIDEBAR_STORAGE_KEY = "CONFIG_CACHE_sidebar"

// LOCAL CONFIG BASE (host owns remote config loading)
export const appConfig = {
  auth: authConfig as AuthConfig,
  ui: uiConfig as UIConfig,
  theme: themeConfig as ThemeConfig,
  sidebar: sidebarConfig as SidebarConfig,
  backendUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api",
}

export type AppConfig = {
  auth: AuthConfig
  ui: UIConfig
  theme: ThemeConfig
  sidebar: SidebarConfig
  backendUrl: string
}

export function getAppConfig(): AppConfig {
  return appConfig
}

export function getSidebarConfigFromLocalStorage(): SidebarConfig | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    if (parsed?.data?.menus) return parsed.data as SidebarConfig
    if (parsed?.menus) return parsed as SidebarConfig

    return null
  } catch {
    return null
  }
}
