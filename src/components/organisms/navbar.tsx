"use client"

import { ThemeToggle } from "crm-base-ui"
import UserMenu from "@/components/molecules/user-menu"
import BaseHeader from "@/components/molecules/base-header"
import { useBrandingConfig, useUIConfig } from "@/hooks/use-config"
import { UserModel } from "@/types/user"
import type { UIHeaderConfig } from "@/lib/config/types"
import { RoleToggle } from "@/components/atoms/role-toggle"

export default function Navbar({ user }: Readonly<{ user: UserModel | null }>) {
  const branding = useBrandingConfig()
  const headerConfig = useUIConfig().header as UIHeaderConfig

  const rightComponents = headerConfig.rightComponents.map(
    (componentName: string) => {
      switch (componentName) {
        case "ThemeToggle":
          return <ThemeToggle key="theme-toggle" />
        case "UserMenu":
          return <UserMenu key="user-menu" user={user} />
        default:
          return null
      }
    }
  )

  // Add RoleToggle as the first component in the right list
  rightComponents.unshift(<RoleToggle key="role-toggle" />)

  return (
    <BaseHeader
      logoSrc={headerConfig.showLogo ? branding.logoSrc : undefined}
      logoAlt={branding.logoAlt}
      brandName={headerConfig.showBrandName ? branding.brandName : undefined}
      rightContent={<>{rightComponents}</>}
    />
  )
}
