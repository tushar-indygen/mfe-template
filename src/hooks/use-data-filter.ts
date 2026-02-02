import { useState, useMemo } from "react"

export function useDataFilter<T>(data: T[]) {
  const [filters, setFilters] = useState<Record<string, string>>({})

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true

        // Handle nested properties (e.g. "location.city")
        const keys = key.split(".")
        let itemValue: any = item
        for (const k of keys) {
          if (itemValue === undefined || itemValue === null) break
          itemValue = (itemValue as any)[k]
        }

        if (itemValue === undefined || itemValue === null) return false

        return String(itemValue).toLowerCase().includes(value.toLowerCase())
      })
    })
  }, [data, filters])

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  return {
    filteredData,
    filters,
    setFilter,
    clearFilters,
  }
}
