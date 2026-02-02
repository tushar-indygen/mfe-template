import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/auth-client"
import type { UserModel } from "@/types/user"

export function useCurrentUser() {
  const [user, setUser] = useState<UserModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser<UserModel>()
        setUser(currentUser)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, isLoading }
}
