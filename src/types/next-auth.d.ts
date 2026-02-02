import "next-auth"
import "next-auth/jwt"
import { ProviderType } from "next-auth/providers/index"

// Declare custom types for NextAuth modules
declare module "next-auth" {
  interface Session {
    user: {
      sub: string
      // emailVerified must be required and Date | null to match AdapterUser if we can't override
      emailVerified: Date | null
      name: string
      preferred_username: string
      given_name: string
      family_name: string
      email: string
      id: string
      org_name?: string
      telephone?: string
      // Original Keycloak fields can stay optional
      email_verified?: boolean
    }
    error?: string | null
    access_token: string
  }

  interface User {
    sub: string
    // Match AdapterUser exactly
    emailVerified: Date | null
    name: string
    telephone?: string
    preferred_username: string
    org_name?: string
    given_name: string
    family_name: string
    email: string
    id: string
    email_verified?: boolean
  }

  interface Account {
    provider: string
    type: ProviderType
    id: string
    access_token: string
    refresh_token: string
    idToken?: string
    expires_in: number
    refresh_expires_in: number
    token_type: string
    id_token?: string
    "not-before-policy"?: number
    session_state?: string
    scope?: string
  }

  interface Profile {
    sub?: string
    email_verified?: boolean
    name?: string
    telephone?: string
    preferred_username?: string
    org_name?: string
    given_name?: string
    family_name?: string
    email?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token: string
    refresh_token: string
    refresh_expires_in: number
    expires_in: number
    user: {
      sub: string
      email_verified?: boolean
      emailVerified: Date | null
      name: string
      telephone?: string
      preferred_username: string
      org_name?: string
      given_name: string
      family_name: string
      email: string
      id: string
    }
    error?: string | null
    refresh_token_expired?: number
    access_token_expired?: number
  }
}
