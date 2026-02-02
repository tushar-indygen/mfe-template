"use client"

import { useEffect } from "react"

export default function LoginPage() {
  useEffect(() => {
    const hostUrl = process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000"
    window.location.replace(`${hostUrl}/`)
  }, [])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
