import { type FieldType } from "@/store/form-renderer-store"

export const DEFAULT_LEAD_SCHEMA = {
  id: "defjnsdkjsnault-lead-schema",
  name: "defjnsdkjsnault Lead Workflow",
  pages: [
    {
      id: "page1",
      title: "Lead Details",
      fields: [
        {
          id: "basic_info",
          type: "basic_info" as FieldType,
          label: "Basic Info",
          required: false,
        },
        {
          id: "lead_details",
          type: "lead_details" as FieldType,
          label: "Lead Details",
          required: false,
        },
      ],
    },
  ],
  metadata: {
    id: "default-lead-schema",
    formId: "default-lead-schema",
    createdAt: new Date().toISOString(),
    createdBy: "system",
    schemaVersion: "1.0",
  },
}
