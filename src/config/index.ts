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
import { ConfigCacheManager } from "@/config/config-cache"

// CONFIG LOADER WITH CACHING
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

// Remote URLs
const REMOTE_URLS: Partial<Record<keyof AppConfig, string | undefined>> = {
  auth: process.env.NEXT_PUBLIC_REMOTE_AUTH_URL,
  ui: process.env.NEXT_PUBLIC_REMOTE_UI_URL,
  theme: process.env.NEXT_PUBLIC_REMOTE_THEME_URL,
  sidebar: process.env.NEXT_PUBLIC_REMOTE_SIDEBAR_URL,
}

/**
 * Helper to merge configs while maintaining type safety
 */
const mergeConfig = <T extends object>(base: T, remote: T): T => ({
  ...base,
  ...remote,
})

/**
 * Main config loader with multi-layer caching
 */
export async function loadRemoteConfig() {
  // Load all configs in parallel with caching
  const [remoteAuth, remoteUI, remoteTheme, remoteSidebar] = await Promise.all([
    ConfigCacheManager.getConfig<AuthConfig>(
      "auth",
      REMOTE_URLS.auth,
      appConfig.auth
    ),
    ConfigCacheManager.getConfig<UIConfig>("ui", REMOTE_URLS.ui, appConfig.ui),
    ConfigCacheManager.getConfig<ThemeConfig>(
      "theme",
      REMOTE_URLS.theme,
      appConfig.theme
    ),
    ConfigCacheManager.getConfig<SidebarConfig>(
      "sidebar",
      REMOTE_URLS.sidebar,
      appConfig.sidebar
    ),
  ])

  // Merge safely with reference changes for React reactivity
  appConfig.auth = mergeConfig(appConfig.auth, remoteAuth)
  appConfig.ui = mergeConfig(appConfig.ui, remoteUI)
  appConfig.theme = mergeConfig(appConfig.theme, remoteTheme)
  appConfig.sidebar = mergeConfig(appConfig.sidebar, remoteSidebar)

  if (process.env.NODE_ENV !== "production") {
    console.log("[CONFIG] Final Config:", appConfig)
  }

  return appConfig
}

/**
 * Lazy load a single config on-demand (not required at startup)
 */
export async function lazyLoadConfigPart<K extends keyof AppConfig>(
  key: K
): Promise<AppConfig[K]> {
  const url = REMOTE_URLS[key]
  const fallback = appConfig[key]

  const config = await ConfigCacheManager.getConfig<AppConfig[K]>(
    key,
    url,
    fallback
  )

  ;(appConfig as any)[key] = config
  return config
}

export function clearConfigCache() {
  ConfigCacheManager.clearAllCache()
}
