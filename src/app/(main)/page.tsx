"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "crm-base-ui"
import { Plus } from "lucide-react"

import { GenericDialog } from "./_components/GenericDialog"
import { getAppName, getArtifact, getWorkflow } from "./actions"
import { useFormRendererStore } from "@/store/form-renderer-store"
import { DialogMode } from "./types"

export default function Home() {
  const [appName, setAppName] = useState("MFE Application")
  const [rawAppName, setRawAppName] = useState("mfe-template")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")

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

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const name = await getAppName()
        if (!isMounted) return

        setRawAppName(name)
        // Format name: "mfe-template" -> "Mfe Template"
        const formattedName = name
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
        setAppName(formattedName)

        // Derive artifact ID from name (e.g. "mfe-template" -> "mfe_template")
        // Ensuring strictly lowercase and underscores for keys if that's the convention
        const artifactId = name.toLowerCase().replaceAll("-", "_")

        const artifact = await getArtifact(artifactId)
        // Fallback or specific check?
        // If artifact is not found, we might want to try exact name

        if (isMounted && artifact?.workflow_id?.length) {
          const workflowId = artifact.workflow_id[0]
          const workflow = await getWorkflow(workflowId)

          if (isMounted && workflow?.data) {
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
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [setSchema, setAsDefaultWorkflow])

  const openDialog = useCallback(
    (mode: DialogMode) => {
      setDialogMode(mode)
      resetStore({ keepSchema: true })
      setFormValues({})
      setDialogOpen(true)
    },
    [resetStore, setFormValues]
  )

  const handleSubmit = async (data: any) => {
    console.log("Submitting data:", data)
    // Implementation for save would go here
    setDialogOpen(false)
  }

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to {appName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This module is configured as <strong>{rawAppName}</strong>.
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground">
            <li>Dynamic Workflow Loading</li>
            <li>Role Management</li>
            <li>Component Library Integration</li>
          </ul>
        </CardContent>
      </Card>

      <GenericDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        activeSchema={activeSchema}
        notes={[]}
        onSubmit={handleSubmit}
        onAddNote={() => {}}
        title="Item"
      />
    </div>
  )
}
