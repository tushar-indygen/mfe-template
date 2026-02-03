import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RolePreferences {
  defaultView: "list" | "kanban" | "stats"
  isKanbanEnabled: boolean
  isListEnabled: boolean
}

interface PreferencesStore {
  userSettings: RolePreferences
  adminSettings: RolePreferences
  isAdminMode: boolean
  setAdminMode: (enabled: boolean) => void
  setRolePreference: (
    role: "user" | "admin",
    key: keyof RolePreferences,
    value: any
  ) => void
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

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      userSettings: { ...defaultRoleSettings },
      adminSettings: { ...defaultRoleSettings, defaultView: "stats" },
      isAdminMode: false,
      setAdminMode: (enabled) => set({ isAdminMode: enabled }),

      setRolePreference: (role, key, value) =>
        set((state) => {
          const roleKey = role === "user" ? "userSettings" : "adminSettings"
          const currentSettings = state[roleKey]
          const newSettings = { ...currentSettings, [key]: value }

          // Validation: For standard users, cannot disable both.
          if (role === "user") {
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

      // Legacy support implementations
      defaultView: "list",
      isKanbanEnabled: true,
      isListEnabled: true,
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
    }),
    {
      name: `${process.env.NEXT_PUBLIC_APP_NAME || "mfe"}-preferences`,
    }
  )
)
