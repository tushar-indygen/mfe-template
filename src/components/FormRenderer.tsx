"use client"

import React, {
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react"
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SensitiveDisplay,
} from "crm-base-ui"
import { Upload, ChevronRight, ChevronLeft, X } from "lucide-react"
import {
  useFormRendererStore,
  type Field,
  type FormSchema,
} from "@/store/form-renderer-store"
// import { useApi } from "@/hooks"

// JSONBIN constants removed. Using process.env.NEXT_PUBLIC_REMOTE_FORM_COLLECTION_URL

interface Snippet {
  record: string
  snippetMeta: {
    name: string
  }
  createdAt: string
}

interface FormRendererProps {
  onComplete?: (data: any) => void
  resetOnMount?: boolean
  preserveSchema?: boolean
  initialValues?: Record<string, any>
  readOnly?: boolean
  schema?: FormSchema | null
}

const AlertDialog: React.FC<{
  open: boolean
  title: string
  description: string
  onOpenChange: (open: boolean) => void
}> = ({ open, title, description, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={() => onOpenChange(false)}>OK</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

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

const DEFAULT_PATTERNS: Record<string, string> = {
  pan_card: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
  aadhaar: "^[2-9]{1}[0-9]{11}$",
  bank_account: "^\\d{9,18}$",
  ifsc: "^[A-Z]{4}0[A-Z0-9]{6}$",
  gstin: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
}

export const FormRenderer = ({
  onComplete,
  resetOnMount = false,
  preserveSchema = false,
  initialValues,
  readOnly = false,
  schema: propSchema,
}: FormRendererProps = {}) => {
  const {
    schema: storeSchema,
    setSchema,
    currentPageIndex,
    formValues,
    snippets,
    showSnippetModal,
    setCurrentPageIndex,
    setFormValues,
    setSnippets,
    setShowSnippetModal,
    handleInputChange: storeHandleInputChange,
    resetStore,
    setAsDefaultWorkflow,
    setUseDynamicForm,
    useDynamicForm,
    errors,
    setFieldError,
  } = useFormRendererStore()

  // const { fetch: apiFetch } = useApi()

  const schema = propSchema || storeSchema

  const [showDialog, setShowDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogDescription, setDialogDescription] = useState("")
  const [isSetDefaultChecked, setIsSetDefaultChecked] = useState(false)

  // Reset store on mount if requested
  useEffect(() => {
    if (resetOnMount) {
      resetStore({ keepSchema: preserveSchema })
    }
  }, [resetOnMount, resetStore, preserveSchema])

  // Set initial values if provided
  useEffect(() => {
    if (initialValues) {
      setFormValues(initialValues)
    }
  }, [initialValues, setFormValues])

  const handleInputChange = (fieldId: string, value: any) => {
    storeHandleInputChange(fieldId, value)

    // Find the field definition to check for pattern
    const field = schema?.pages
      .flatMap((p) => p.fields)
      .find((f) => f.id === fieldId)

    if (field) {
      const pattern = field.pattern || DEFAULT_PATTERNS[field.type]
      if (pattern) {
        const regex = new RegExp(pattern)
        if (value && !regex.test(String(value))) {
          setFieldError(fieldId, field.validationMessage || "Invalid")
        } else {
          setFieldError(fieldId, null)
        }
      }
    }
  }

  const showAlert = useCallback((title: string, description: string) => {
    setDialogTitle(title)
    setDialogDescription(description)
    setShowDialog(true)
  }, [])

  const resetFormWithSchema = useCallback(
    (data: any) => {
      if (data?.pages && Array.isArray(data.pages)) {
        setSchema(data)
        setCurrentPageIndex(0)
        setFormValues({})
      } else {
        showAlert("Invalid Schema", "Invalid schema format.")
      }
    },
    [setSchema, setCurrentPageIndex, setFormValues, showAlert]
  )

  const handleImportFromRemote = useCallback(async () => {
    try {
      // Use Server Action to fetch workflows
      const { getWorkflows } = await import("@/app/(main)/actions")
      const json = await getWorkflows()

      if (Array.isArray(json)) {
        setSnippets(json)
        setIsSetDefaultChecked(false)
        setShowSnippetModal(true)
        return
      }

      const data =
        json?.record && typeof json.record === "object" ? json.record : json
      resetFormWithSchema(data)
    } catch (error) {
      console.error("Error importing from remote URL:", error)
      showAlert("Import Error", "Failed to import from remote URL.")
    }
  }, [resetFormWithSchema, setSnippets, setShowSnippetModal, showAlert])

  const handleLoadSnippet = useCallback(
    async (recordId: string) => {
      try {
        const { getWorkflow } = await import("@/app/(main)/actions")
        const json = await getWorkflow(recordId)
        const data =
          json?.record && typeof json.record === "object" ? json.record : json

        resetFormWithSchema(data)
        if (isSetDefaultChecked) {
          console.log("Setting as default:", recordId)
          setAsDefaultWorkflow(recordId, data)
          setUseDynamicForm(false)
        }
        setShowSnippetModal(false)
      } catch (error) {
        console.error("Error loading snippet:", error)
        showAlert("Load Error", "Failed to load snippet.")
      }
    },
    [
      resetFormWithSchema,
      setShowSnippetModal,
      showAlert,
      isSetDefaultChecked,
      setAsDefaultWorkflow,
      setUseDynamicForm,
    ]
  )

  useEffect(() => {
    // If no schema is currently loaded...
    if (!schema) {
      // Auto-loading defaults is disabled in favor of explicitly passing schema via props
      // or showing the Import screen when in "Custom Mode".
      /*
      console.log(
        "Auto-loading default. Schema present:",
        !!defaultWorkflowSchema,
        "ID:",
        defaultWorkflowId
      )
      if (defaultWorkflowSchema) {
        // ...and we have a cached default schema, use it immediately!
        resetFormWithSchema(defaultWorkflowSchema)
      } else if (defaultWorkflowId) {
        // ...otherwise fallback to fetching by ID
        handleLoadSnippet(defaultWorkflowId)
      }
      */
    } else if (
      initialValues &&
      Object.keys(initialValues).length > 0 &&
      Object.keys(formValues).length === 0
    ) {
      // If schema is loaded (e.g. default persisted) but we have fresh initialValues and empty formValues, set them.
      // This handles the case where default schema was already in store, but we opened a specific lead.
      setFormValues(initialValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const handleFileUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        resetFormWithSchema(data)
      } catch (error) {
        console.error("Error parsing JSON:", error)
        showAlert("Parse Error", "Failed to parse JSON file")
      }
    },
    [resetFormWithSchema, showAlert]
  )

  const renderWelcomeEndField = (field: Field) => {
    if (!field?.label && !field?.description) return null

    return (
      <div className={`text-center ${field.type === "end" ? "py-2" : ""}`}>
        <h2 className="text-2xl font-bold mb-2">{field.label}</h2>
        <p className="text-muted-foreground">{field.description}</p>
      </div>
    )
  }

  const renderSimpleInput = (
    field: Field,
    placeholder: string,
    type?: React.InputHTMLAttributes<HTMLInputElement>["type"]
  ) => {
    if (field.sensitive) {
      return (
        <div className="space-y-1">
          <SensitiveDisplay
            isEditable={!readOnly}
            placeholder={placeholder}
            value={
              formValues[field.id] !== undefined
                ? formValues[field.id]
                : findValueByKey(formValues, field.id) || ""
            }
            onValueChange={(val) => handleInputChange(field.id, val)}
            disabled={readOnly}
            inputClassName={errors[field.id] ? "border-red-500" : ""}
          />
          {errors[field.id] && (
            <p className="text-xs text-red-500">{errors[field.id]}</p>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <Input
          id={field.id}
          type={type}
          placeholder={placeholder}
          value={
            formValues[field.id] !== undefined
              ? formValues[field.id]
              : findValueByKey(formValues, field.id) || ""
          }
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          required={field.required}
          disabled={readOnly}
          className={errors[field.id] ? "border-red-500" : ""}
        />
        {errors[field.id] && (
          <p className="text-xs text-red-500">{errors[field.id]}</p>
        )}
      </div>
    )
  }

  const renderNameField = (field: Field) => (
    <div className="grid grid-cols-2 gap-2">
      <Input
        id={field.id}
        placeholder="First Name"
        value={
          formValues[`${field.id}_first`] !== undefined
            ? formValues[`${field.id}_first`]
            : findValueByKey(formValues, `${field.id}_first`) || ""
        }
        onChange={(e) => handleInputChange(`${field.id}_first`, e.target.value)}
        required={field.required}
        disabled={readOnly}
      />
      <Input
        placeholder="Last Name"
        value={
          formValues[`${field.id}_last`] !== undefined
            ? formValues[`${field.id}_last`]
            : findValueByKey(formValues, `${field.id}_last`) || ""
        }
        onChange={(e) => handleInputChange(`${field.id}_last`, e.target.value)}
        required={field.required}
        disabled={readOnly}
      />
    </div>
  )

  const renderAddressField = (field: Field) => (
    <div className="space-y-2">
      <Input
        id={field.id}
        placeholder="Street Address"
        value={formValues[`${field.id}_street`] || ""}
        onChange={(e) =>
          handleInputChange(`${field.id}_street`, e.target.value)
        }
        required={field.required}
        disabled={readOnly}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="City"
          value={formValues[`${field.id}_city`] || ""}
          onChange={(e) =>
            handleInputChange(`${field.id}_city`, e.target.value)
          }
          required={field.required}
          disabled={readOnly}
        />
        <Input
          placeholder="State / Province"
          value={formValues[`${field.id}_state`] || ""}
          onChange={(e) =>
            handleInputChange(`${field.id}_state`, e.target.value)
          }
          required={field.required}
          disabled={readOnly}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Postal / Zip Code"
          value={formValues[`${field.id}_zip`] || ""}
          onChange={(e) => handleInputChange(`${field.id}_zip`, e.target.value)}
          required={field.required}
          disabled={readOnly}
        />
        <Input
          placeholder="Country"
          value={formValues[`${field.id}_country`] || ""}
          onChange={(e) =>
            handleInputChange(`${field.id}_country`, e.target.value)
          }
          required={field.required}
          disabled={readOnly}
        />
      </div>
    </div>
  )

  const renderBasicInfoField = (field: Field) => {
    const value = (formValues[field.id] || {}) as any
    const update = (patch: Partial<typeof value>) =>
      handleInputChange(field.id, { ...value, ...patch })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>First Name</Label>
            <Input
              placeholder="First Name"
              value={value.first_name || ""}
              onChange={(e) => update({ first_name: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2">
            <Label>Last Name</Label>
            <Input
              placeholder="Last Name"
              value={value.last_name || ""}
              onChange={(e) => update({ last_name: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <SensitiveDisplay
              isEditable={!readOnly}
              placeholder="Email"
              value={value.email || ""}
              onValueChange={(val) => update({ email: val })}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <SensitiveDisplay
              isEditable={!readOnly}
              placeholder="Phone"
              value={value.phone || ""}
              onValueChange={(val) => update({ phone: val })}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderLeadDetailsField = (field: Field) => {
    const value = (formValues[field.id] || {}) as any
    const update = (patch: Partial<typeof value>) =>
      handleInputChange(field.id, { ...value, ...patch })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={value.status || "New"}
              onValueChange={(v) => update({ status: v })}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Source</Label>
            <Input
              value={value.source || ""}
              onChange={(e) => update({ source: e.target.value })}
              placeholder="Source"
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2">
            <Label>Assigned RM ID</Label>
            <Input
              value={value.assigned_rm_id || ""}
              onChange={(e) => update({ assigned_rm_id: e.target.value })}
              placeholder="Assigned RM ID"
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2">
            <Label>Lead Score</Label>
            <Input
              type="number"
              value={value.lead_score || ""}
              onChange={(e) => update({ lead_score: e.target.value })}
              placeholder="Lead Score"
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2 col-span-2">
            <Label>Product Interest</Label>
            <Input
              value={value.product_interest || ""}
              onChange={(e) => update({ product_interest: e.target.value })}
              placeholder="Product Interest"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderField = (field: Field) => {
    switch (field.type) {
      case "welcome":
      case "end":
        return renderWelcomeEndField(field)

      case "short_text":
        return renderSimpleInput(field, "Short answer text")

      case "email":
        return renderSimpleInput(field, "name@example.com", "email")

      case "url":
        return renderSimpleInput(field, "https://example.com", "url")

      case "phone":
        return renderSimpleInput(field, "+91 0000000000", "tel")

      case "ip_address":
        return renderSimpleInput(field, "192.168.1.1")

      case "number":
        return renderSimpleInput(field, "0", "number")

      case "long_text":
        return (
          <textarea
            id={field.id}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Long answer text"
            value={
              formValues[field.id] !== undefined
                ? formValues[field.id]
                : findValueByKey(formValues, field.id) || ""
            }
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            disabled={readOnly}
          />
        )

      case "date":
        return renderSimpleInput(field, "", "date")

      case "select":
        return (
          <select
            id={field.id}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={
              formValues[field.id] !== undefined
                ? formValues[field.id]
                : findValueByKey(formValues, field.id) || ""
            }
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            disabled={readOnly}
          >
            <option value="">Select an option</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )

      case "multiple_choice":
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}-${i}`}
                  name={field.id}
                  value={opt}
                  checked={
                    (formValues[field.id] !== undefined
                      ? formValues[field.id]
                      : findValueByKey(formValues, field.id)) === opt
                  }
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="h-4 w-4 border-primary text-primary ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  disabled={readOnly}
                />
                <label
                  htmlFor={`${field.id}-${i}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
        )

      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => !readOnly && handleInputChange(field.id, star)}
                className={`text-2xl focus:outline-none transition-colors ${
                  (formValues[field.id] !== undefined
                    ? formValues[field.id]
                    : findValueByKey(formValues, field.id) || 0) >= star
                    ? "text-yellow-400"
                    : "text-muted-foreground/30 hover:text-yellow-200"
                } ${readOnly ? "cursor-not-allowed opacity-70" : ""}`}
                disabled={readOnly}
              >
                ★
              </button>
            ))}
          </div>
        )

      case "slider":
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {field.min ?? 0}
            </span>
            <input
              id={field.id}
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              value={
                formValues[field.id] !== undefined
                  ? formValues[field.id]
                  : (findValueByKey(formValues, field.id) ?? field.min ?? 0)
              }
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full"
              disabled={readOnly}
            />
            <span className="text-sm text-muted-foreground">
              {field.max ?? 100}
            </span>
            <span className="text-sm font-medium w-8 text-center">
              {formValues[field.id] ?? field.min ?? 0}
            </span>
          </div>
        )

      case "name":
        return renderNameField(field)

      case "address":
        return renderAddressField(field)

      case "file_upload":
        return (
          <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-sm hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="text-center">
              <Upload className="h-6 w-6 mx-auto mb-2" />
              <span>Click to upload file</span>
            </div>
          </div>
        )

      case "basic_info":
        return renderBasicInfoField(field)

      case "lead_details":
        return renderLeadDetailsField(field)

      case "pan_card":
        return renderSimpleInput(field, "ABCDE1234F")

      case "aadhaar":
        return renderSimpleInput(field, "XXXX-XXXX-1234")

      case "bank_account":
        return renderSimpleInput(field, "XXXXXXXXXX1234")

      case "ifsc":
        return renderSimpleInput(field, "SBIN0001234")

      case "gstin":
        return renderSimpleInput(field, "22AAAAA0000A1Z5")

      default:
        return (
          <div className="text-red-500">
            Unsupported field type: {field.type}
          </div>
        )
    }
  }

  if (!schema) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 border-2 border-dashed rounded-lg">
        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Import Custom Lead Workflow
        </h3>
        <p className="text-muted-foreground mb-4 text-center max-w-sm">
          Import a JSON file exported from the Workflow Builder
        </p>
        <div className="flex gap-4">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="max-w-xs"
          />
          <Button onClick={handleImportFromRemote} variant="outline">
            Import from Remote
          </Button>
        </div>

        {showSnippetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto border border-border relative">
              <button
                onClick={() => setShowSnippetModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Select a Template</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="set-default"
                    checked={isSetDefaultChecked}
                    onChange={(e) => setIsSetDefaultChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label
                    htmlFor="set-default"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Set selected as default
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                {(snippets as Snippet[]).map((snippet) => (
                  <div
                    key={snippet.record}
                    className="border border-border p-3 rounded hover:bg-accent cursor-pointer flex justify-between items-center transition-colors"
                    onClick={() => handleLoadSnippet(snippet.record)}
                  >
                    <div>
                      <div className="font-medium">
                        {snippet.snippetMeta.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(snippet.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <AlertDialog
          open={showDialog}
          title={dialogTitle}
          description={dialogDescription}
          onOpenChange={setShowDialog}
        />
      </div>
    )
  }

  const currentPage = schema.pages[currentPageIndex]
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === schema.pages.length - 1

  const handleNext = () => {
    if (isLastPage) {
      if (onComplete) {
        onComplete(formValues)
      } else {
        showAlert("Lead Captured", "Lead captured successfully")
      }
      return
    }

    setCurrentPageIndex((p) => Math.min(schema.pages.length - 1, p + 1))
  }

  return (
    <div className="w-full">
      {!propSchema && (
        <div className="flex justify-end mb-4">
          {useDynamicForm && (
            <Button variant="outline" size="sm" onClick={() => resetStore()}>
              Import New Lead Workflow
            </Button>
          )}
        </div>
      )}

      <div className="space-y-6">
        {currentPage.fields.map((field: Field) => {
          if (field.type === "welcome" || field.type === "end") {
            return <div key={field.id}>{renderField(field)}</div>
          }

          return (
            <div key={field.id} className="grid w-full gap-1.5">
              <div className="space-y-1">
                <label
                  htmlFor={field.id}
                  className="text-lg font-bold tracking-tight text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </label>
                {field.description && (
                  <p className="text-[0.8rem] text-muted-foreground">
                    {field.description}
                  </p>
                )}
              </div>
              {renderField(field)}
            </div>
          )
        })}
      </div>

      <DialogFooter className="pt-4 border-t mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
          disabled={isFirstPage}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button onClick={handleNext}>
          {isLastPage ? "Capture Lead" : "Next"}
          {!isLastPage && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </DialogFooter>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Page {currentPageIndex + 1} of {schema.pages.length}
      </div>

      <AlertDialog
        open={showDialog}
        title={dialogTitle}
        description={dialogDescription}
        onOpenChange={setShowDialog}
      />
    </div>
  )
}
