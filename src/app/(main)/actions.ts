"use server"

import { auth } from "@/auth"
import fs from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"

const GATEWAY_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost"

async function getAuthHeaders(xMethod?: "GET" | "POST" | "PUT" | "DELETE") {
    const session = await auth()
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-User": JSON.stringify({
            sub: "alice",
            tenant_id: "default",
            realm_access: { roles: ["admin", "editor"] },
        }),
    }
    if (xMethod) {
        headers["X-Method"] = xMethod
    }
    if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
    }
    return headers
}

export async function getAppName() {
    try {
        const packageJsonPath = path.join(process.cwd(), "package.json")
        const fileContent = await fs.readFile(packageJsonPath, "utf-8")
        const packageJson = JSON.parse(fileContent)
        return packageJson.name
    } catch (error) {
        console.error("Failed to read package.json:", error)
        return "mfe-template"
    }
}

export async function getArtifactId() {
    const basePath = process.env.BASE_PATH || ""
    if (basePath) {
        // Remove leading slash and handle potential multi-segment paths
        return basePath.replace(/^\//, "")
    }

    try {
        const name = await getAppName()
        return name.toLowerCase().replace(/[\s]/g, "-")
    } catch (error) {
        return "mfe-template"
    }
}

export async function getItems(artifactId: string) {
    try {
        const headers = await getAuthHeaders()
        const res = await fetch(`${GATEWAY_URL}/events/crud`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                action: "LIST",
                artifact_id: artifactId,
            }),
            cache: "no-store",
        })

        if (!res.ok) {
            console.error("API Error fetching items", res.status)
            return []
        }

        const json = await res.json()
        const data = Array.isArray(json) ? json : json.data

        if (!Array.isArray(data)) {
            console.warn("API returned non-array for items list:", json)
            return []
        }

        // Map data to ensure consistent id field
        return data.map((record: any) => {
            const fields = record.data || record
            return {
                ...fields,
                id: record.id || fields.id || fields.lead_id,
                created_at: record.created_at || fields.created_at,
                status: record.status || fields.status,
            }
        })
    } catch (error) {
        console.error("Failed to get items:", error)
        return []
    }
}

export async function addItem(artifactId: string, itemData: any) {
    try {
        const payload = {
            action: "SAVE",
            artifact_id: artifactId,
            data: itemData,
        }

        const headers = await getAuthHeaders()
        const res = await fetch(`${GATEWAY_URL}/events/crud`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`)
        }

        const json = await res.json()
        revalidatePath("/")
        return {
            success: true,
            item: { ...itemData, id: json.id },
        }
    } catch (error) {
        console.error("Failed to add item:", error)
        return { success: false, error: "Failed to add item" }
    }
}

export async function updateItem(artifactId: string, itemData: any) {
    try {
        const { id, ...rest } = itemData
        const payload = {
            action: "UPDATE",
            artifact_id: artifactId,
            id: id,
            data: {
                id: id,
                data: rest,
            },
        }

        const headers = await getAuthHeaders()
        const res = await fetch(`${GATEWAY_URL}/events/crud`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`)
        }

        revalidatePath("/")
        return { success: true, item: itemData }
    } catch (error) {
        console.error("Failed to update item:", error)
        return { success: false, error: "Failed to update item" }
    }
}

export async function deleteItem(artifactId: string, itemId: string) {
    try {
        const payload = {
            action: "DELETE",
            artifact_id: artifactId,
            id: itemId,
        }

        const headers = await getAuthHeaders()
        const res = await fetch(`${GATEWAY_URL}/events/crud`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`)
        }

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete item:", error)
        return { success: false, error: "Failed to delete item" }
    }
}

export async function addNote(artifactId: string, noteData: {
    item_id: string
    content: string
    created_by: string
}) {
    try {
        const payload = {
            action_id: "act_add_note", // Assuming this is the standard action_id for notes
            artifact_id: artifactId,
            payload: noteData,
        }

        const headers = await getAuthHeaders("POST")
        const res = await fetch(`${GATEWAY_URL}/events/trigger`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`)
        }

        const json = await res.json()
        revalidatePath("/")
        return { success: true, note: { ...noteData, note_id: json.id } }
    } catch (error) {
        console.error("Failed to add note:", error)
        return { success: false, error: "Failed to add note" }
    }
}

export async function getArtifact(id: string) {
    try {
        const headers = await getAuthHeaders("GET")
        const res = await fetch(`${GATEWAY_URL}/metadata/artifacts/${id}`, {
            method: "POST",
            headers,
            cache: "no-store",
        })

        if (!res.ok) {
            console.error("API Error fetching artifact", res.status)
            return null
        }

        return await res.json()
    } catch (error) {
        console.error("Failed to get artifact:", error)
        return null
    }
}

export async function getWorkflow(id: string) {
    try {
        const headers = await getAuthHeaders("GET")
        const res = await fetch(`${GATEWAY_URL}/metadata/workflows/${id}`, {
            method: "POST",
            headers,
            cache: "no-store",
        })

        if (!res.ok) {
            console.error("API Error fetching workflow", res.status)
            return null
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error("Failed to get workflow:", error)
        return null
    }
}

export async function getWorkflows() {
    try {
        const headers = await getAuthHeaders("GET")
        const res = await fetch(`${GATEWAY_URL}/metadata/workflows`, {
            method: "POST",
            headers,
            cache: "no-store",
        })

        if (!res.ok) {
            console.error("API Error fetching workflows", res.status)
            return []
        }

        return await res.json()
    } catch (error) {
        console.error("Failed to get workflows:", error)
        return []
    }
}

