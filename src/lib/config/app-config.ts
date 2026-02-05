import type { AuthConfig, UIConfig, ThemeConfig, SidebarConfig } from "./types"

export type AppConfig = {
  auth: AuthConfig
  ui: UIConfig
  theme: ThemeConfig
  sidebar: SidebarConfig
  backendUrl: string
}

const STORAGE_PREFIX = "CONFIG_CACHE_"

type CacheEntry<T> = { data?: T }

const readFromLocalStorage = <T>(key: keyof AppConfig): T | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T> | T
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return (parsed as CacheEntry<T>).data ?? null
    }
    return parsed as T
  } catch {
    return null
  }
}

// Config values are defined and managed in crm-base.
// These placeholders keep the runtime shape stable until localStorage is populated.
const EMPTY_AUTH: AuthConfig = {
  provider: "",
  baseUrl: "",
  redirects: {
    afterLogin: "",
    afterLogout: "",
    unauthorized: "",
  },
  publicRoutes: [],
  session: {
    cookieName: "",
    maxAge: 0,
  },
}

const EMPTY_UI: UIConfig = {
  branding: {
    logoSrc: "",
    logoAlt: "",
    brandName: "",
    shortName: "",
  },
  header: {
    component: "",
    showLogo: false,
    showBrandName: false,
    rightComponents: [],
  },
  login: {
    title: "",
    subtitle: null,
    animation: {
      enabled: false,
    },
    fields: {
      email: {
        type: "",
        placeholder: "",
        required: false,
        icon: "",
        validation: {
          enabled: false,
        },
      },
      password: {
        type: "",
        placeholder: "",
        required: false,
        icon: "",
        showToggle: false,
        validation: {
          enabled: false,
        },
      },
    },
    features: {
      forgotPassword: false,
      rememberMe: false,
    },
    submitButton: {
      label: "",
      loadingLabel: "",
    },
  },
  userMenu: {
    items: [],
  },
}

const EMPTY_THEME: ThemeConfig = {
  default: "",
  themes: {
    light: {
      colors: {
        primary: "",
        background: "",
        foreground: "",
        muted: "",
        border: "",
      },
    },
    dark: {
      colors: {
        primary: "",
        background: "",
        foreground: "",
        muted: "",
        border: "",
      },
    },
  },
}

const EMPTY_SIDEBAR: SidebarConfig = {
  menus: [],
}

const EMPTY_BACKEND_URL = ""

const buildAppConfig = (): AppConfig => ({
  auth: readFromLocalStorage<AuthConfig>("auth") ?? EMPTY_AUTH,
  ui: readFromLocalStorage<UIConfig>("ui") ?? EMPTY_UI,
  theme: readFromLocalStorage<ThemeConfig>("theme") ?? EMPTY_THEME,
  sidebar: readFromLocalStorage<SidebarConfig>("sidebar") ?? EMPTY_SIDEBAR,
  backendUrl: readFromLocalStorage<string>("backendUrl") ?? EMPTY_BACKEND_URL,
})

export let appConfig: AppConfig = buildAppConfig()

export function getAppConfig(): AppConfig {
  appConfig = buildAppConfig()
  return appConfig
}

export const isConfigStorageKey = (key?: string | null) =>
  !!key && key.startsWith(STORAGE_PREFIX)
