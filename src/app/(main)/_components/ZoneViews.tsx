"use client"

import React, { useMemo } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DataTable,
  DataTableColumnHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  KanbanBoard,
  type KanbanColumnDef,
  SensitiveDisplay,
} from "crm-base-ui"
import { Eye, BarChart3, Trash, Pencil } from "lucide-react"
import { ZoneStats } from "./ZoneStats"

import { useDataFilter } from "@/hooks/use-data-filter"
import type { GenericItem } from "../types"
import { usePreferencesStore } from "@/store/preferences-store"
import { useCurrentUser } from "@/hooks/use-user"
import { useUserRole } from "@/components/atoms/role-toggle-provider"

interface ZoneViewsProps {
  items: GenericItem[]
  onItemUpdate: (itemId: string, newStatus: string) => Promise<void> | void
  onEdit: (item: GenericItem) => void
  onView: (item: GenericItem) => void
  onDelete: (itemId: string) => void
  schema?: any
  stats: any[]
  activeTab?: string
  onTabChange?: (value: string) => void
  title?: string
}

// Recursive helper to find a value by key anywhere in the object
const findValueByKey = (obj: any, targetKey: string): any => {
  if (!obj || typeof obj !== "object") return undefined
  if (targetKey in obj) return obj[targetKey]
  for (const k in obj) {
    const val = obj[k]
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const found = findValueByKey(val, targetKey)
      if (found !== undefined) return found
    }
  }
  return undefined
}

// Recursive helper to gather all "leaf" keys from an object
const collectLeafKeys = (obj: any, keys: Set<string>) => {
  if (!obj || typeof obj !== "object") return
  for (const k in obj) {
    if (["metadata", "location", "id", "data", "payload"].includes(k)) {
      if (["metadata", "data", "payload", "location"].includes(k)) {
        collectLeafKeys(obj[k], keys)
      }
      continue
    }
    const val = obj[k]
    if (val && typeof val === "object" && !Array.isArray(val)) {
      collectLeafKeys(val, keys)
    } else if (val !== undefined && val !== null) {
      keys.add(k)
    }
  }
}

export function ZoneViews({
  items,
  onItemUpdate,
  onEdit,
  onView,
  onDelete,
  activeTab,
  onTabChange,
  schema,
  stats,
  title = "Items",
}: ZoneViewsProps) {
  const { role } = useUserRole()
  const settings = usePreferencesStore((state) =>
    role === "admin"
      ? state.adminSettings
      : role === "srm"
        ? state.srmSettings
        : state.userSettings
  )
  const { isKanbanEnabled, isListEnabled } = settings
  const { isAdminMode } = usePreferencesStore()

  const { filteredData } = useDataFilter(items)
  const { user } = useCurrentUser()
  const canReveal =
    user?.role === "admin" || user?.role === "manager" || isAdminMode

  const reversedFilteredData = useMemo(
    () => [...filteredData].reverse(),
    [filteredData]
  )

  const kanbanColumns: KanbanColumnDef[] = useMemo(
    () => [
      { id: "New", title: "New" },
      { id: "In Progress", title: "In Progress" },
      { id: "Pending", title: "Pending" },
      { id: "Completed", title: "Completed" },
    ],
    []
  )

  const kanbanItems = useMemo(
    () => filteredData.map((item) => ({ ...item, id: item.id })),
    [filteredData]
  )

  const columns = useMemo(() => {
    if (!items || items.length === 0) {
      return [
        {
          accessorKey: "id",
          header: ({ column }: any) => (
            <DataTableColumnHeader column={column} title="ID" />
          ),
          cell: ({ row }: any) => (
            <div className="font-medium">{row.getValue("id")}</div>
          ),
        },
        {
          accessorKey: "status",
          header: ({ column }: any) => (
            <DataTableColumnHeader column={column} title="Status" />
          ),
        },
        {
          id: "actions",
          header: () => <div className="text-right">Actions</div>,
          cell: () => null,
        },
      ]
    }

    const allKeysSet = new Set<string>()
    items.forEach((l) => collectLeafKeys(l, allKeysSet))
    const allKeys = Array.from(allKeysSet)

    const preferredOrder = ["id", "status", "name", "email", "created_at"]
    const sortedKeys = [...allKeys].sort((a, b) => {
      const indexA = preferredOrder.indexOf(a)
      const indexB = preferredOrder.indexOf(b)
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return a.localeCompare(b)
    })

    const result: any[] = []

    if (allKeysSet.has("id")) {
      result.push({
        accessorKey: "id",
        header: ({ column }: any) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }: any) => (
          <div className="font-medium">{row.getValue("id")}</div>
        ),
      })
    }

    if (allKeysSet.has("status")) {
      result.push({
        accessorKey: "status",
        header: ({ column }: any) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }: any) => {
          const status = row.getValue("status")
          const style =
            status === "Completed"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
            >
              {status as string}
            </span>
          )
        },
      })
    }

    const ignoredKeys = new Set([
      "id",
      "status",
      "metadata",
      "location",
      "created_at",
      "updated_at",
    ])
    const fieldIdToLabel: Record<string, string> = {}
    if (schema?.pages) {
      schema.pages.forEach((page: any) => {
        page.fields?.forEach((field: any) => {
          if (field.id && field.label) fieldIdToLabel[field.id] = field.label
        })
      })
    }

    sortedKeys.forEach((key) => {
      if (ignoredKeys.has(key)) return
      result.push({
        id: key,
        accessorFn: (row: any) => findValueByKey(row, key),
        header: ({ column }: any) => {
          const title =
            fieldIdToLabel[key] ||
            key.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
          return <DataTableColumnHeader column={column} title={title} />
        },
        cell: ({ row }: any) => {
          const value = row.getValue(key)
          return (
            <div className="max-w-[200px] truncate">{String(value ?? "")}</div>
          )
        },
      })
    })

    result.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const item = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              title="View Details"
              onClick={(e) => {
                e.stopPropagation()
                onView(item)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Delete"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item.id)
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    })

    return result
  }, [items, onView, onEdit, onDelete, schema])

  return (
    <Card className="rounded-xl shadow-sm border-border/50">
      <Tabs
        defaultValue="list"
        value={activeTab}
        onValueChange={onTabChange}
        className="w-full"
      >
        <div className="flex flex-row items-center justify-between border-b px-6 pb-4">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-semibold whitespace-nowrap">
              Recent {title}
            </CardTitle>
          </CardHeader>
          <TabsList>
            {isListEnabled && <TabsTrigger value="list">List View</TabsTrigger>}
            {isKanbanEnabled && (
              <TabsTrigger value="kanban">Kanban View</TabsTrigger>
            )}
            {role === "admin" && (
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-3.5 w-3.5" /> Performance
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        <CardContent className="p-6">
          {role === "admin" && (
            <TabsContent value="stats" className="mt-0 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold">Performance Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time metrics and status distribution.
                  </p>
                </div>
              </div>
              <ZoneStats stats={stats} />
            </TabsContent>
          )}

          <TabsContent value="list" className="mt-0">
            <div className="w-full overflow-x-auto max-w-[85vw] 2xl:max-w-full">
              <DataTable
                columns={columns}
                data={reversedFilteredData}
                searchKey="id"
              />
            </div>
          </TabsContent>
          <TabsContent value="kanban" className="mt-0 h-[650px]">
            <KanbanBoard
              items={kanbanItems}
              columns={kanbanColumns}
              onItemUpdate={(id, status) => onItemUpdate(String(id), status)}
              onItemClick={onView}
              renderCard={(item: any) => (
                <div className="space-y-2">
                  <div className="font-medium text-sm line-clamp-1">
                    {findValueByKey(item, "name") || item.id}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {findValueByKey(item, "email") || ""}
                  </div>
                </div>
              )}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
