"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { PageHeader, Button } from "crm-base-ui"
import { Plus } from "lucide-react"

import { ZoneDialog } from "./_components/ZoneDialog"
import { ZoneViews } from "./_components/ZoneViews"
import {
  getAppInfo,
  getArtifact,
  getWorkflow,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  addNote,
} from "./actions"
import { useFormRendererStore } from "@/store/form-renderer-store"
import { DialogMode, GenericItem, Note } from "./types"

export default function Home() {
  const [appName, setAppName] = useState("MFE Application")
  const [rawAppName, setRawAppName] = useState("mfe-template")
  const [artifactId, setArtifactId] = useState("mfe_template")
  const [items, setItems] = useState<GenericItem[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [activeTab, setActiveTab] = useState("list")

  // Zustand Store for Dynamic Workflows
  const {
    resetStore,
    setAsDefaultWorkflow,
    setSchema,
    setFormValues,
    schema,
    defaultWorkflowSchema,
  } = useFormRendererStore()

  const activeSchema = schema || defaultWorkflowSchema

  const loadData = useCallback(async () => {
    try {
      const info = await getAppInfo()
      setRawAppName(info.appId)
      setAppName(info.appName)

      const derivedArtifactId = info.appId
        .toLowerCase()
        .replaceAll(/[-\s]/g, "_")
      setArtifactId(derivedArtifactId)

      // Load items
      const fetchedItems = await getItems(derivedArtifactId)
      setItems(fetchedItems)

      // Load artifact and workflow
      const artifact = await getArtifact(derivedArtifactId)
      if (artifact?.workflow_id?.length) {
        const workflowId = artifact.workflow_id[0]
        const workflow = await getWorkflow(workflowId)

        if (workflow?.data) {
          const workflowSchema = {
            ...workflow.data,
            metadata: {
              ...(workflow.metadata || {}),
              id: workflow.id,
              formId: workflow.id,
            },
          }
          setSchema(workflowSchema)
          setAsDefaultWorkflow(workflow.id, workflowSchema)
        }
      }
    } catch (error) {
      console.error("Failed to load app data:", error)
    }
  }, [setSchema, setAsDefaultWorkflow])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openDialog = useCallback(
    (mode: DialogMode, item: GenericItem | null = null) => {
      setDialogMode(mode)
      setSelectedItem(item)
      resetStore({ keepSchema: true })
      setFormValues(item || {})
      setDialogOpen(true)
    },
    [resetStore, setFormValues]
  )

  const handleDialogSubmit = async (data: any) => {
    try {
      if (dialogMode === "create") {
        const result = await addItem(artifactId, data)
        if (result.success) {
          setItems((prev) => [result.item as GenericItem, ...prev])
        }
      } else if (dialogMode === "edit" && selectedItem) {
        const result = await updateItem(artifactId, {
          ...data,
          id: selectedItem.id,
        })
        if (result.success) {
          setItems((prev) =>
            prev.map((i) => (i.id === selectedItem.id ? { ...i, ...data } : i))
          )
        }
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to submit:", error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const result = await deleteItem(artifactId, itemId)
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
      }
    }
  }

  const handleStatusUpdate = async (itemId: string, newStatus: string) => {
    const item = items.find((i) => i.id === itemId)
    if (item) {
      const result = await updateItem(artifactId, {
        ...item,
        status: newStatus,
      })
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
        )
      }
    }
  }

  const handleAddNote = async (noteData: {
    item_id: string
    content: string
    created_by: string
  }) => {
    const result = await addNote(artifactId, noteData)
    if (result.success) {
      setNotes((prev) => [result.note as Note, ...prev])
    }
  }

  // Placeholder stats - in a real app these would come from the API
  const stats = useMemo(
    () => [
      { label: "Total Items", value: items.length },
      {
        label: "Active",
        value: items.filter((i) => i.status !== "Completed").length,
      },
      {
        label: "Completed",
        value: items.filter((i) => i.status === "Completed").length,
      },
    ],
    [items]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <PageHeader
          title={appName}
          description={`Dashboard for managing ${appName}.`}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => openDialog("create")}
            className="gap-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <ZoneViews
        items={items}
        onItemUpdate={handleStatusUpdate}
        onEdit={(item) => openDialog("edit", item)}
        onView={(item) => openDialog("view", item)}
        onDelete={handleDeleteItem}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        schema={activeSchema}
        stats={stats}
        title={appName}
      />

      <ZoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        item={selectedItem}
        notes={notes}
        activeSchema={activeSchema}
        onSubmit={handleDialogSubmit}
        onAddNote={handleAddNote}
        onEdit={() => selectedItem && openDialog("edit", selectedItem)}
        onView={() => selectedItem && openDialog("view", selectedItem)}
        title={appName}
      />
    </div>
  )
}
