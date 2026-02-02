"use client"

import {
  LogOut as LogOutIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/auth-client"
import { useUserMenuConfig } from "@/hooks/use-config"
import { type UserModel } from "@/types/user"
import {
  useSidebar,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "crm-base-ui"

interface UserMenuProps {
  user: UserModel | null
  inSidebar?: boolean
}

const iconMap = {
  UserIcon,
  SettingsIcon,
  LogOutIcon,
}

const isExternal = (path: string) => !path.startsWith("/lead")

export default function UserMenu({ user, inSidebar = false }: UserMenuProps) {
  const router = useRouter()
  const menuConfig = useUserMenuConfig()
  const { open } = useSidebar()

  const handleAction = async (action?: string, route?: string) => {
    switch (action) {
      case "logout":
        await logoutUser()
        router.push("/")
        break
      case "navigate":
        if (route) {
          const finalRoute = route.replace(
            "{{HOST_URL}}",
            window.location.origin
          )
          let pathname = finalRoute

          try {
            pathname = new URL(finalRoute, window.location.origin).pathname
          } catch (error) {
            console.error("Invalid URL encountered:", finalRoute, error)
          }

          if (isExternal(pathname)) {
            window.location.assign(finalRoute)
          } else {
            router.push(finalRoute)
          }
        }
        break
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center w-full gap-2 cursor-pointer">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary flex size-full items-center justify-center rounded-full text-primary-foreground">
              {user?.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {inSidebar && open && user?.name && (
            <span className="truncate text-sm font-medium text-muted-foreground capitalize">
              {user.name}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {menuConfig.items.map((item) => {
          if (item.type === "separator") {
            return <DropdownMenuSeparator key={item.id} />
          }

          if (item.enabled === false) return null

          const Icon = item.icon
            ? iconMap[item.icon as keyof typeof iconMap]
            : null

          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleAction(item.action, item.route)}
              className={item.className}
            >
              {Icon && (
                <Icon className={`h-4 w-4 mr-2 ${item.iconClassName}`} />
              )}
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
