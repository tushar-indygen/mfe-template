export interface UIHeaderConfig {
  component: string
  showLogo: boolean
  showBrandName: boolean
  rightComponents: string[]
}

export interface LoginFieldConfig {
  type: string
  placeholder: string
  required: boolean
  icon: string
  showToggle?: boolean
  validation?: {
    enabled: boolean
    pattern?: string
    errorMessage?: string
  }
}

export interface LoginConfig {
  title: string
  subtitle?: string | null
  animation?: {
    enabled: boolean
    type?: string
  }
  fields: {
    email: LoginFieldConfig
    password: LoginFieldConfig
  }
  features: {
    forgotPassword: boolean
    rememberMe: boolean
  }
  submitButton: {
    label: string
    loadingLabel: string
  }
}

export interface UserMenuItem {
  id: string
  type: "separator" | "item"
  label?: string
  icon?: string
  action?: "navigate" | "logout" | "custom"
  route?: string
  className?: string
  enabled?: boolean
  iconClassName?: string
}

export interface UIConfig {
  branding: {
    logoSrc: string
    logoAlt: string
    brandName: string
    shortName: string
  }
  header: {
    component: string
    showLogo: boolean
    showBrandName: boolean
    rightComponents: string[]
  }
  login: LoginConfig
  userMenu: {
    items: UserMenuItem[]
  }
}

export interface ColorConfig {
  primary: string
  background: string
  foreground: string
  muted: string
  border: string
}

export interface ThemeConfig {
  default: string
  themes: {
    light: {
      colors: ColorConfig
    }
    dark: {
      colors: ColorConfig
    }
  }
}
export interface AuthConfig {
  provider: string
  baseUrl: string
  redirects: {
    afterLogin: string
    afterLogout: string
    unauthorized: string
  }
  publicRoutes: Array<string>
  session: {
    cookieName: string
    maxAge: number
  }
}

export interface SidebarMenuItem {
  label: string
  path: string
  icon: string
  roles?: string[]
  adminOnly?: boolean
  hidden?: boolean
}

export interface SidebarConfig {
  menus: SidebarMenuItem[]
}
