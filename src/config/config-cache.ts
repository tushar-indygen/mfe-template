export class ConfigCacheManager {
  private static readonly STORAGE_PREFIX = "CONFIG_CACHE_"
  private static readonly BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"

  static async getConfig<T>(
    configKey: string,
    remoteUrl: string | undefined,
    fallback: T
  ): Promise<T> {
    // Check LocalStorage first
    const cached = this.getFromLocalStorage<T>(configKey)
    if (cached) {
      return cached
    }

    // Fetch from Backend API
    try {
      const remoteData = await this.fetchFromBackend<T>(configKey, fallback)
      this.setToLocalStorage(configKey, remoteData)
      return remoteData
    } catch (err) {
      console.warn(`[CONFIG] Fetch failed for ${configKey}`, err)
      return fallback
    }
  }

  private static getFromLocalStorage<T>(configKey: string): T | null {
    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${configKey}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private static setToLocalStorage<T>(configKey: string, data: T) {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${configKey}`,
        JSON.stringify(data)
      )
    } catch (err) {
      console.error(`[CONFIG] Save failed for ${configKey}`, err)
    }
  }

  private static async fetchFromBackend<T>(
    configKey: string,
    fallback: T
  ): Promise<T> {
    try {
      const url = `${this.BACKEND_URL}/configs/${configKey}`
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        console.warn(`[CONFIG] Backend returned ${res.status} for ${configKey}`)
        return fallback
      }

      const json = await res.json()

      // Backend returns: { name: string, data: {...}, updatedAt: string }
      // We want just the data part
      const data = json?.data ?? json

      if (
        !data ||
        (typeof data === "object" && Object.keys(data).length === 0)
      ) {
        return fallback
      }
      return data as T
    } catch (err) {
      console.error(`[CONFIG] Error fetching from backend:`, err)
      return fallback
    }
  }

  static clearAllCache() {
    if (typeof window === "undefined") return
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}
