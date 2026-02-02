"use client"

import { useSession } from "next-auth/react"
import { useAppConfig } from "@/lib/config-provider"

export interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

export function useApi() {
  const { data: session } = useSession()
  const { backendUrl } = useAppConfig()

  const fetcher = async <T = any>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> => {
    const { params, headers: customHeaders, ...restOptions } = options

    // Construct URL
    let url = endpoint.startsWith("http")
      ? endpoint
      : `${backendUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`

    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    // Headers
    const headers = new Headers(customHeaders)
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`)
    }

    const response = await fetch(url, {
      ...restOptions,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
          `API Error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  return {
    fetch: fetcher,
    backendUrl,
  }
}
