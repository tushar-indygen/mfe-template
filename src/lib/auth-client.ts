"use client"

import { getSession, signOut } from "next-auth/react"
import { getAppConfig } from "@/lib/config/app-config"

const getAfterLogout = () =>
  getAppConfig().auth?.redirects?.afterLogout ?? "/auth/signin"

// HELPERS
const removeLocal = (key: string) => {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

// PUBLIC FUNCTIONS
export async function getCurrentUser<T>() {
  const session = await getSession()
  return (session?.user as T) ?? null
}

export async function logoutUser() {
  removeLocal("activeCall")

  await signOut({ callbackUrl: getAfterLogout() })
}
