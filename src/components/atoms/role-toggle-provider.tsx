"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { UserModel } from "@/types/user"

export type UserRole = "user" | "admin" | "srm"

interface UserRoleContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  toggleRole: () => void
  originalUser: UserModel | null
  effectiveUser: UserModel | null
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(
  undefined
)

export function UserRoleProvider({
  children,
  user,
}: Readonly<{
  children: ReactNode
  user: UserModel | null
}>) {
  const [role, setRole] = useState<UserRole>(() => {
    // 1. Check localStorage first
    if (globalThis.window !== undefined) {
      const savedRole = localStorage.getItem("user-role-override")
      if (
        savedRole === "admin" ||
        savedRole === "user" ||
        savedRole === "srm"
      ) {
        return savedRole as UserRole
      }
    }

    // 2. Default based on actual user roles
    const userRoles = user?.realm_access?.roles ?? []
    const isSystemAdmin = userRoles.includes("admin")
    const isTenantAdmin = userRoles.includes("tenant_admin")
    const isSrm = userRoles.includes("srm")

    if (isSystemAdmin || isTenantAdmin) return "admin"
    if (isSrm) return "srm"
    return "user"
  })

  // Sync role if user changes (e.g. after login) and no override exists
  const [prevUser, setPrevUser] = useState(user)
  if (user !== prevUser) {
    setPrevUser(user)
    if (
      globalThis.window !== undefined &&
      !localStorage.getItem("user-role-override") &&
      user
    ) {
      const userRoles = user?.realm_access?.roles ?? []
      const isAdmin =
        userRoles.includes("admin") || userRoles.includes("tenant_admin")
      const nextRole = isAdmin ? "admin" : "user"
      if (nextRole !== role) {
        setRole(nextRole)
      }
    }
  }

  const toggleRole = React.useCallback(() => {
    const roles: UserRole[] = ["user", "srm", "admin"]
    const currentIndex = roles.indexOf(role)
    const nextRole = roles[(currentIndex + 1) % roles.length]
    setRole(nextRole)
    if (globalThis.window !== undefined) {
      localStorage.setItem("user-role-override", nextRole)
    }
  }, [role])

  const handleSetRole = React.useCallback((newRole: UserRole) => {
    setRole(newRole)
    if (globalThis.window !== undefined) {
      localStorage.setItem("user-role-override", newRole)
    }
  }, [])

  // Calculate effective user based on toggle
  const effectiveUser = React.useMemo(() => {
    if (!user) return null

    const newRoles = (user.realm_access?.roles ?? []).filter(
      (r) => r !== "admin" && r !== "tenant_admin" && r !== "srm"
    )

    if (role === "admin") {
      newRoles.push("admin")
    } else if (role === "srm") {
      newRoles.push("srm")
    }

    return {
      ...user,
      realm_access: {
        ...user.realm_access,
        roles: Array.from(new Set(newRoles)),
      },
    }
  }, [user, role])

  const contextValue = React.useMemo(
    () => ({
      role,
      setRole: handleSetRole,
      toggleRole,
      originalUser: user,
      effectiveUser,
    }),
    [role, handleSetRole, toggleRole, user, effectiveUser]
  )

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRole() {
  const context = useContext(UserRoleContext)
  if (context === undefined) {
    throw new Error("useUserRole must be used within a UserRoleProvider")
  }
  return context
}
