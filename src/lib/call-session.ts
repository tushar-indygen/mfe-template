export type ActiveCall = {
  wsUrl: string
  agentId: string
  callId?: string
  startedAt: number
}

const KEY = "activeCall"

export function getActiveCall(): ActiveCall | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ActiveCall) : null
  } catch {
    return null
  }
}

export function setActiveCall(next: ActiveCall | null) {
  if (typeof window === "undefined") return
  if (!next) {
    window.localStorage.removeItem(KEY)
  } else {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  }
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
}

export function clearActiveCall() {
  setActiveCall(null)
}
