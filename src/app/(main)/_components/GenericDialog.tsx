"use client"

import React, { useCallback, useMemo, useState } from "react"
import {
  Label,
  Input,
  Button,
  Textarea,
  Switch,
  KanbanItemDialog,
} from "crm-base-ui"
import { Send, Pencil, Eye } from "lucide-react"

import { useFormRendererStore } from "@/store/form-renderer-store"
import { FormRenderer } from "@/components/FormRenderer"
import { GenericItem, Note, DialogMode } from "../types"

interface GenericDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: DialogMode
  item?: GenericItem | null
  notes: Note[]
  activeSchema: any
  onSubmit: (data: any) => Promise<void> | void
  onAddNote: (note: {
    item_id: string
    content: string
    created_by: string
  }) => void
  onEdit?: () => void
  onView?: () => void
  title?: string
}

export function GenericDialog({
  open,
  onOpenChange,
  mode,
  item,
  notes,
  activeSchema,
  onSubmit,
  onAddNote,
  onEdit,
  onView,
  title = "Item",
}: GenericDialogProps) {
  const isImport = mode === "import"
  const isEdit = mode === "edit"
  const isView = mode === "view"
  const isCreate = mode === "create"

  const [newNote, setNewNote] = useState("")

  const useDynamicForm = useFormRendererStore((s) => s.useDynamicForm)
  const setUseDynamicForm = useFormRendererStore((s) => s.setUseDynamicForm)
  const formValues = useFormRendererStore((s) => s.formValues)

  const itemNotes = useMemo(
    () => (item ? notes.filter((n) => n.item_id === item.id) : ([] as Note[])),
    [item, notes]
  )

  const handleFormRendererSubmit = useCallback(
    async (data: any) => {
      await onSubmit(data)
    },
    [onSubmit]
  )

  const handleAddNoteClick = useCallback(() => {
    if (!newNote.trim() || !item) return
    onAddNote({
      item_id: item.id,
      content: newNote.trim(),
      created_by: "CurrentUser",
    })
    setNewNote("")
  }, [newNote, item, onAddNote])

  const dialogTitle = useMemo(() => {
    if (isImport) return `Import ${title}s`
    if (isEdit) return `Edit ${title}`
    if (isView) return `${title} Details`
    return `Create ${title}`
  }, [isImport, isEdit, isView, title])

  const dialogDescription = useMemo(() => {
    if (isImport) return `Import ${title}s from a CSV file.`
    if (isEdit) return `Edit the details of the existing ${title}.`
    if (isView) return `View ${title} details and notes.`
    return `Add a new ${title} to your list.`
  }, [isImport, isEdit, isView, title])

  const DialogTitleContent = useMemo(() => {
    if ((isView && onEdit) || (isEdit && onView)) {
      return (
        <div className="flex items-center justify-between w-full pr-12">
          <span>{dialogTitle}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={isView ? onEdit : onView}
            className="h-8 w-8"
            title={isView ? `Edit ${title}` : "View Details"}
          >
            {isView ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      )
    }
    return dialogTitle
  }, [isView, isEdit, onEdit, onView, dialogTitle, title])

  return (
    <KanbanItemDialog
      open={open}
      onOpenChange={onOpenChange}
      title={DialogTitleContent as any}
      description={dialogDescription}
      sidebar={
        !isCreate &&
        !isImport && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {itemNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No notes yet.
                </p>
              ) : (
                itemNotes.map((note) => (
                  <div
                    key={note.note_id}
                    className="bg-muted/50 p-3 rounded-md text-sm"
                  >
                    <p className="mb-1">{note.content}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{note.created_by}</span>
                      <span>
                        {new Date(note.created_at || "").toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-auto pt-2 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={handleAddNoteClick}
                disabled={!newNote.trim()}
              >
                <Send className="w-3 h-3 mr-2" /> Add Note
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6 p-2">
        {isCreate && (
          <div className="flex items-center space-x-2 pb-4 border-b">
            <Switch
              id="use-custom-form"
              checked={useDynamicForm}
              onCheckedChange={setUseDynamicForm}
            />
            <Label htmlFor="use-custom-form">Use Custom Workflow</Label>
          </div>
        )}

        {isImport ? (
          <div className="grid gap-3 py-4">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                }}
              >
                Import
              </Button>
            </div>
          </div>
        ) : (
          <div key={`${mode}-${item?.id ?? "new"}`}>
            <FormRenderer
              onComplete={isView ? undefined : handleFormRendererSubmit}
              schema={activeSchema || {}}
              initialValues={formValues}
              readOnly={isView}
            />
          </div>
        )}
      </div>
    </KanbanItemDialog>
  )
}
