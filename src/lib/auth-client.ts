"use client"

import { getSession, signOut } from "next-auth/react"
import authConfig from "@/config/auth.config.json"

// CONSTANTS
const AFTER_LOGOUT =
  authConfig.redirects?.afterLogout ??
  process.env.NEXT_PUBLIC_AFTER_LOGOUT ??
  "/auth/signin"

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

  await signOut({ callbackUrl: AFTER_LOGOUT })
}
