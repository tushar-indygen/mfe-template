"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Building2,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  BookOpen,
} from "lucide-react"
import dynamicIconImports from "lucide-react/dynamicIconImports"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Separator,
  useSidebar,
  Button,
} from "crm-base-ui"

import { useSidebarConfig } from "@/hooks/use-config"
import UserMenu from "./user-menu"
import { UserModel } from "@/types/user"

const toKebabCase = (str: string) =>
  str.replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()

const iconCache = new Map<string, React.ComponentType<any>>()

const getIcon = (name: string) => {
  if (!iconCache.has(name)) {
    const kebabName = toKebabCase(name) as keyof typeof dynamicIconImports
    if (dynamicIconImports[kebabName]) {
      iconCache.set(
        name,
        dynamic(dynamicIconImports[kebabName], {
          ssr: false,
          loading: () => (
            <LayoutList className="h-4 w-4 animate-pulse opacity-50" />
          ),
        })
      )
    } else {
      iconCache.set(name, LayoutList)
    }
  }
  return iconCache.get(name)
}

const isExternal = (path: string) => !path.startsWith("/lead")

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserModel | null }) {
  const { open, toggleSidebar } = useSidebar()
  const sidebar = useSidebarConfig()
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader className="bg-card">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pt-4 bg-card">
        <SidebarGroup>
          <SidebarMenu>
            {sidebar.menus
              .filter((item) => {
                if (item.hidden) return false

                const userRoles = user?.realm_access?.roles ?? []
                const isSystemAdmin = userRoles.includes("admin")
                const isTenantAdmin = userRoles.includes("tenant_admin")
                const isAdmin = isSystemAdmin || isTenantAdmin

                // 1. Check specific roles if defined
                if (item.roles && item.roles.length > 0) {
                  return item.roles.some((role) => userRoles.includes(role))
                }

                // 2. Check generic adminOnly flag
                if (item.adminOnly) {
                  return isAdmin
                }

                return true
              })
              .map((item) => {
                const Icon = getIcon(item.icon) || LayoutList
                let fullPathname = pathname
                if (!pathname.startsWith("/lead")) {
                  fullPathname = pathname === "/" ? "/lead" : `/lead${pathname}`
                }

                const isActive =
                  fullPathname === item.path ||
                  fullPathname?.startsWith(`${item.path}/`)

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      {isExternal(item.path) ? (
                        <a href={item.path}>
                          <Icon width={40} height={40} />
                          <div className="grid flex-1 text-left text-md leading-tight">
                            <span className="truncate font-medium">
                              {item.label}
                            </span>
                          </div>
                        </a>
                      ) : (
                        <Link
                          href={item.path}
                          onClick={(e) => isActive && e.preventDefault()}
                        >
                          <Icon width={40} height={40} />
                          <div className="grid flex-1 text-left text-md leading-tight">
                            <span className="truncate font-medium">
                              {item.label}
                            </span>
                          </div>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

            {/* API Documentation Link for Admins */}
            {user?.realm_access?.roles?.includes("admin") && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href="http://localhost:8888/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen width={40} height={40} />
                    <div className="grid flex-1 text-left text-md leading-tight">
                      <span className="truncate font-medium">
                        API Documentation
                      </span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="bg-card">
        {open && (
          <div className="mx-2 mt-4 mb-2 p-3 rounded-xl bg-muted/40 border border-border/50 space-y-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm border border-border/50">
                <Building2 size={16} className="text-primary/80" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Tenant
                </span>
                <span className="text-sm font-semibold truncate text-foreground/90">
                  {user?.tenant_id || "default"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck size={14} className="text-emerald-500/80" />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Active Roles
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(user?.realm_access?.roles || [])
                  .filter(
                    (r) =>
                      !r.startsWith("default-roles-") &&
                      r !== "offline_access" &&
                      r !== "uma_authorization"
                  )
                  .map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] border border-primary/10 font-bold capitalize"
                    >
                      {role.replace("_", " ")}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}
        <SidebarMenuButton asChild>
          <UserMenu user={user} inSidebar />
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <Button
            variant="ghost"
            type="button"
            onClick={toggleSidebar}
            className="text-md cursor-pointer flex w-full items-center justify-start gap-2"
            aria-label="Toggle Sidebar"
          >
            {open ? <PanelLeftClose /> : <PanelLeftOpen />}
            {open && "Collapse"}
          </Button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
