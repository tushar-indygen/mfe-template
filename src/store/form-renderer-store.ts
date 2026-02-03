import { create } from "zustand"
import { persist } from "zustand/middleware"

export type FieldType =
  | "welcome"
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "rating"
  | "file_upload"
  | "end"
  | "email"
  | "phone"
  | "name"
  | "address"
  | "date"
  | "number"
  | "url"
  | "ip_address"
  | "slider"
  | "select"
  | "basic_info"
  | "lead_details"
  | "pan_card"
  | "aadhaar"
  | "bank_account"
  | "ifsc"
  | "gstin"

export interface SnippetMeta {
  name: string
  snippetId: string
}

export interface Snippet {
  record: string
  createdAt: string
  snippetMeta: SnippetMeta
}

export interface Field {
  id: string
  type: FieldType
  label: string
  required: boolean
  sensitive?: boolean
  pattern?: string
  validationMessage?: string
  description?: string
  options?: string[]
  min?: number
  max?: number
}

export interface Page {
  id: string
  title: string
  fields: Field[]
}

export interface FormSchema {
  metadata: {
    id: string
    formId: string
    createdAt: string
    createdBy: string
    schemaVersion: string
  }
  pages: Page[]
}

interface FormRendererState {
  schema: FormSchema | null
  currentPageIndex: number
  formValues: Record<string, any>
  errors: Record<string, string>
  snippets: Snippet[]
  showSnippetModal: boolean
  useDynamicForm: boolean
  defaultWorkflowId: string | null
  defaultWorkflowSchema: FormSchema | null

  // Actions
  setSchema: (schema: FormSchema | null) => void
  setCurrentPageIndex: (index: number | ((prev: number) => number)) => void
  setFormValues: (
    values:
      | Record<string, any>
      | ((prev: Record<string, any>) => Record<string, any>)
  ) => void
  setFieldError: (fieldId: string, error: string | null) => void
  setSnippets: (snippets: Snippet[]) => void
  setShowSnippetModal: (show: boolean) => void
  setUseDynamicForm: (use: boolean) => void
  setAsDefaultWorkflow: (id: string | null, schema: FormSchema | null) => void
  handleInputChange: (fieldId: string, value: any) => void
  resetStore: (options?: { keepSchema?: boolean }) => void
}

export const useFormRendererStore = create<FormRendererState>()(
  persist(
    (set) => ({
      schema: null,
      currentPageIndex: 0,
      formValues: {},
      errors: {},
      snippets: [],
      showSnippetModal: false,
      useDynamicForm: false,
      defaultWorkflowId: null,
      defaultWorkflowSchema: null,

      setSchema: (schema) => set({ schema }),
      setCurrentPageIndex: (index) =>
        set((state) => ({
          currentPageIndex:
            typeof index === "function" ? index(state.currentPageIndex) : index,
        })),
      setFormValues: (values) =>
        set((state) => ({
          formValues:
            typeof values === "function" ? values(state.formValues) : values,
        })),
      setFieldError: (fieldId, error) =>
        set((state) => {
          const newErrors = { ...state.errors }
          if (error) {
            newErrors[fieldId] = error
          } else {
            delete newErrors[fieldId]
          }
          return { errors: newErrors }
        }),
      setSnippets: (snippets) => set({ snippets }),
      setShowSnippetModal: (show) => set({ showSnippetModal: show }),
      setUseDynamicForm: (use) => set({ useDynamicForm: use }),
      setAsDefaultWorkflow: (id, schema) =>
        set({
          defaultWorkflowId: id,
          defaultWorkflowSchema: schema,
          useDynamicForm: true,
        }),

      handleInputChange: (fieldId, value) =>
        set((state) => ({
          formValues: {
            ...state.formValues,
            [fieldId]: value,
          },
        })),

      resetStore: (options) =>
        set((state) => ({
          schema: options?.keepSchema ? state.schema : null,
          currentPageIndex: 0,
          formValues: {},
          errors: {},
          showSnippetModal: false,
        })),
    }),
    {
      name: `${process.env.NEXT_PUBLIC_APP_NAME || "mfe"}-form-renderer-storage`,
      partialize: (state) => ({
        schema: state.schema,
        currentPageIndex: state.currentPageIndex,
        formValues: state.formValues,
        errors: state.errors,
        useDynamicForm: state.useDynamicForm,
        defaultWorkflowId: state.defaultWorkflowId,
        defaultWorkflowSchema: state.defaultWorkflowSchema,
      }),
    }
  )
)
