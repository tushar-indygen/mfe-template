export interface Note {
    note_id: string
    content: string
    created_by: string
    created_at?: string
    item_id: string
}

export interface GenericItem {
    id: string
    [key: string]: any
}

export type DialogMode = "create" | "edit" | "import" | "view"
