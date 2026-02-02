import { useAppConfig } from "@/lib/config-provider"

export function useAuthConfig() {
  const config = useAppConfig()
  return config.auth
}

export function useUIConfig() {
  const config = useAppConfig()
  return config.ui
}

export function useThemeConfig() {
  const config = useAppConfig()
  return config.theme
}

export function useSidebarConfig() {
  return useAppConfig().sidebar
}

export function useBrandingConfig() {
  return useAppConfig().ui.branding
}

export function useLoginConfig() {
  return useAppConfig().ui.login
}

export function useUserMenuConfig() {
  return useAppConfig().ui.userMenu
}

export function useBackendUrl() {
  return useAppConfig().backendUrl
}
