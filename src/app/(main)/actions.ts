"use server"

import { auth } from "@/auth"
import fs from "node:fs/promises"
import path from "node:path"

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

        return data
    } catch (error) {
        console.error("Failed to get items:", error)
        return []
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
