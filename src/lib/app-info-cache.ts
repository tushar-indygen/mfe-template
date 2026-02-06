export type AppInfo = {
  appName: string
  appId: string
}

const STORAGE_PREFIX = "APP_INFO_CACHE_"
let inFlight: Promise<AppInfo> | null = null

const getZoneIdFromLocation = () => {
  if (typeof window === "undefined") return "mfe-template"
  const path = window.location.pathname || ""
  const firstSegment = path.split("/").filter(Boolean)[0]
  return firstSegment || "mfe-template"
}

const getCacheKey = () => {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/^\//, "")
  const zoneId = basePath || getZoneIdFromLocation()
  const host = typeof window === "undefined" ? "server" : window.location.host
  return `${STORAGE_PREFIX}${host}_${zoneId}`
}

export const isAppInfoCacheKey = (key: string | null) => {
  if (!key) return false
  if (!key.startsWith(STORAGE_PREFIX)) return false
  return key === getCacheKey()
}

export const readAppInfoCache = (): AppInfo | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(getCacheKey())
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.appName === "string" &&
      typeof parsed.appId === "string"
    ) {
      return parsed as AppInfo
    }
    return null
  } catch {
    return null
  }
}

export const writeAppInfoCache = (info: AppInfo) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(getCacheKey(), JSON.stringify(info))
  } catch (err) {
    console.warn("[APP_INFO] Failed to write cache:", err)
  }
}

export const clearAppInfoCache = () => {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(getCacheKey())
  } catch (err) {
    console.warn("[APP_INFO] Failed to clear cache:", err)
  }
}

export const getCachedAppInfo = async (
  fetcher: () => Promise<AppInfo>,
  options?: { forceRefresh?: boolean }
): Promise<AppInfo> => {
  if (!options?.forceRefresh) {
    const cached = readAppInfoCache()
    if (cached) return cached
    if (inFlight) return inFlight
  }

  inFlight = (async () => {
    const info = await fetcher()
    writeAppInfoCache(info)
    return info
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}
