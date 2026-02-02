import NextAuth from "next-auth"
import { authOptions } from "@/lib/next-auth-options"

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
