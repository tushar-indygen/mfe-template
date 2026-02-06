"use client"

import { AppSidebar } from "@/components/molecules/app-sidebar"
import Navbar from "@/components/organisms/navbar"
import { Toaster, SidebarInset, SidebarProvider } from "crm-base-ui"
import {
  InfoIcon,
  CheckIcon,
  AlertCircleIcon,
  XIcon,
  LoaderIcon,
} from "lucide-react"
import { UserModel } from "@/types/user"
import {
  UserRoleProvider,
  useUserRole,
} from "@/components/atoms/role-toggle-provider"
import { usePreferencesSync } from "@/store/preferences-store"

function MainLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  usePreferencesSync()
  const { effectiveUser } = useUserRole()

  return (
    <div className="[--header-height:calc(--spacing(10))]">
      <SidebarProvider className="flex flex-col">
        <Navbar user={effectiveUser} />
        <div className="flex flex-1 overflow-hidden w-full">
          <AppSidebar user={effectiveUser} />
          <SidebarInset className="w-full overflow-hidden">
            <main className="w-full max-w-full overflow-x-hidden min-h-screen px-4 py-6 md:px-8 md:py-10 mt-14! pb-0">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <Toaster
        invert={true}
        position="top-right"
        icons={{
          success: <CheckIcon color="green" />,
          info: <InfoIcon color="blue" />,
          warning: <AlertCircleIcon color="yellow" />,
          error: <XIcon color="red" />,
          loading: <LoaderIcon color="blue" />,
        }}
      />
    </div>
  )
}

export default function MainLayoutClient({
  children,
  user,
}: Readonly<{
  children: React.ReactNode
  user: UserModel | null
}>) {
  return (
    <UserRoleProvider user={user}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </UserRoleProvider>
  )
}
