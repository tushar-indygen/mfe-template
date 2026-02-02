"use client"

import { type ReactNode, useMemo, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthConfig } from "@/hooks/use-config"
import { useSession, signOut } from "next-auth/react"

export default function AuthGate({ children }: { children: ReactNode }) {
  const { publicRoutes } = useAuthConfig()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  const isPublic = useMemo(() => {
    // Explicitly allow the auth bridge page to prevent loops
    if (pathname.startsWith("/auth/signin")) return true

    // Check config-defined public routes
    return publicRoutes.some((p) => pathname.startsWith(p))
  }, [pathname, publicRoutes])

  useEffect(() => {
    if (status === "loading") return

    if (session?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: window.location.href })
      return
    }

    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") return

    if (!isPublic && !session) {
      const signInUrl = new URL("/auth/signin", window.location.origin)
      signInUrl.searchParams.append("callbackUrl", window.location.href)
      router.replace(signInUrl.toString())
    }
  }, [isPublic, session, status, router])

  // Bypass auth if flag is set
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
    return <>{children}</>
  }

  // If loading or unauthenticated on a protected route, don't render children
  if (status === "loading" || (!isPublic && !session)) return null

  return children
}
