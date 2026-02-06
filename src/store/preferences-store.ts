import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RolePreferences {
  defaultView: "list" | "kanban" | "stats"
  isKanbanEnabled: boolean
  isListEnabled: boolean
}

export interface ModulePreferences {
  userSettings: RolePreferences
  adminSettings: RolePreferences
  srmSettings: RolePreferences
}

interface PreferencesStore {
  userSettings: RolePreferences
  adminSettings: RolePreferences
  srmSettings: RolePreferences
  isAdminMode: boolean
  setAdminMode: (enabled: boolean) => void
  setRolePreference: (
    role: "user" | "admin" | "srm",
    key: keyof RolePreferences,
    value: any
  ) => void
  syncFromModulePreferences: () => void
  // Legacy support
  defaultView: "list" | "kanban" | "stats"
  isKanbanEnabled: boolean
  isListEnabled: boolean
  setDefaultView: (view: "list" | "kanban" | "stats") => void
  setKanbanEnabled: (enabled: boolean) => void
  setListEnabled: (enabled: boolean) => void
}

const defaultRoleSettings: RolePreferences = {
  defaultView: "list",
  isKanbanEnabled: true,
  isListEnabled: true,
}

const getDefaultModulePreferences = (): ModulePreferences => ({
  userSettings: { ...defaultRoleSettings },
  adminSettings: { ...defaultRoleSettings, defaultView: "stats" },
  srmSettings: { ...defaultRoleSettings },
})

const RAW_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "mfe"

const normalizeAppKey = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "")
  return normalized || "mfe"
}

const APP_KEY = normalizeAppKey(RAW_APP_NAME)
const STORAGE_KEY = `${APP_KEY}-preferences`
const MODULE_PREFERENCES_KEYS = ["module-preferences", "module-preference"]

const readModulePreferences = (): ModulePreferences | null => {
  if (typeof window === "undefined") return null

  for (const key of MODULE_PREFERENCES_KEYS) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      const modules = parsed?.state?.modules ?? parsed?.modules
      if (!modules || typeof modules !== "object") continue

      const candidates = [
        APP_KEY,
        RAW_APP_NAME,
        RAW_APP_NAME.toLowerCase(),
        RAW_APP_NAME.replaceAll("-", "_"),
      ]
      for (const candidate of candidates) {
        if (candidate && modules[candidate]) {
          return modules[candidate] as ModulePreferences
        }
      }
    } catch {
      continue
    }
  }
  return null
}

const mergeModulePreferences = (
  modulePrefs: ModulePreferences | null
): ModulePreferences => {
  const defaults = getDefaultModulePreferences()
  if (!modulePrefs) return defaults

  return {
    userSettings: {
      ...defaults.userSettings,
      ...(modulePrefs.userSettings ?? {}),
    },
    adminSettings: {
      ...defaults.adminSettings,
      ...(modulePrefs.adminSettings ?? {}),
    },
    srmSettings: {
      ...defaults.srmSettings,
      ...(modulePrefs.srmSettings ?? {}),
    },
  }
}

const getInitialPreferences = (): ModulePreferences =>
  mergeModulePreferences(readModulePreferences())

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => {
      const initial = getInitialPreferences()
      return {
        userSettings: initial.userSettings,
        adminSettings: initial.adminSettings,
        srmSettings: initial.srmSettings,
      isAdminMode: false,
      setAdminMode: (enabled) => set({ isAdminMode: enabled }),

      setRolePreference: (role, key, value) =>
        set((state) => {
          const roleKey =
            role === "admin"
              ? "adminSettings"
              : role === "srm"
                ? "srmSettings"
                : "userSettings"
          const currentSettings = state[roleKey]
          const newSettings = { ...currentSettings, [key]: value }

          // Validation: For standard users (and SRM), cannot disable both.
          if (role === "user" || role === "srm") {
            if (
              (key === "isKanbanEnabled" &&
                !value &&
                !newSettings.isListEnabled) ||
              (key === "isListEnabled" &&
                !value &&
                !newSettings.isKanbanEnabled)
            ) {
              return state
            }
          }

          // Auto-adjust default view if disabled
          if (
            key === "isKanbanEnabled" &&
            !value &&
            newSettings.defaultView === "kanban"
          ) {
            newSettings.defaultView = role === "admin" ? "stats" : "list"
          }
          if (
            key === "isListEnabled" &&
            !value &&
            newSettings.defaultView === "list"
          ) {
            newSettings.defaultView = role === "admin" ? "stats" : "kanban"
          }

          return { [roleKey]: newSettings }
        }),

      syncFromModulePreferences: () => {
        const modulePrefs = readModulePreferences()
        if (!modulePrefs) return
        const merged = mergeModulePreferences(modulePrefs)
        set((state) => ({
          ...state,
          userSettings: merged.userSettings,
          adminSettings: merged.adminSettings,
          srmSettings: merged.srmSettings,
          defaultView: merged.userSettings.defaultView,
          isKanbanEnabled: merged.userSettings.isKanbanEnabled,
          isListEnabled: merged.userSettings.isListEnabled,
        }))
      },

      // Legacy support implementations
      defaultView: initial.userSettings.defaultView,
      isKanbanEnabled: initial.userSettings.isKanbanEnabled,
      isListEnabled: initial.userSettings.isListEnabled,
      setDefaultView: (view) =>
        set((state) => ({
          defaultView: view,
          userSettings: { ...state.userSettings, defaultView: view },
        })),
      setKanbanEnabled: (enabled) =>
        set((state) => ({
          isKanbanEnabled: enabled,
          userSettings: { ...state.userSettings, isKanbanEnabled: enabled },
        })),
      setListEnabled: (enabled) =>
        set((state) => ({
          isListEnabled: enabled,
          userSettings: { ...state.userSettings, isListEnabled: enabled },
        })),
      }
    },
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        state?.syncFromModulePreferences?.()
      },
    }
  )
)

export function usePreferencesSync() {
  const syncFromModulePreferences = usePreferencesStore(
    (state) => state.syncFromModulePreferences
  )

  useEffect(() => {
    syncFromModulePreferences()

    if (typeof window === "undefined") return
    const handleStorage = (event: StorageEvent) => {
      if (event.key && MODULE_PREFERENCES_KEYS.includes(event.key)) {
        syncFromModulePreferences()
      }
    }
    const handleCustom = () => syncFromModulePreferences()

    window.addEventListener("storage", handleStorage)
    window.addEventListener("module-preferences-refresh", handleCustom)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("module-preferences-refresh", handleCustom)
    }
  }, [syncFromModulePreferences])
}
