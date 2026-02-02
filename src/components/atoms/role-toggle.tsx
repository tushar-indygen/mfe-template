"use client"

import * as React from "react"
import { Shield, User, ChevronDown, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "crm-base-ui"
import { useUserRole } from "./role-toggle-provider"

export function RoleToggle() {
  const { role, setRole } = useUserRole()

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return <Shield className="h-4 w-4 text-green-500" />
      case "srm":
        return <UserCheck className="h-4 w-4 text-amber-500" />
      default:
        return <User className="h-4 w-4 text-slate-500" />
    }
  }

  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "Admin"
      case "srm":
        return "SRM"
      default:
        return "User"
    }
  }

  const getRoleStyles = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-500 ring-green-500/20"
      case "srm":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-500 ring-amber-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20 hover:border-slate-500/40 hover:text-slate-500 ring-slate-500/20"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 px-3 py-1 h-8 rounded-full border transition-all duration-300",
            getRoleStyles(role)
          )}
        >
          <div className="relative flex items-center justify-center">
            {getRoleIcon(role)}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {getRoleLabel(role)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[140px]">
        <DropdownMenuItem
          onClick={() => setRole("admin")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">Admin</span>
          {role === "admin" && (
            <div className="ml-auto size-1.5 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setRole("srm")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <UserCheck className="h-4 w-4 text-amber-500" />
          <span className="font-medium">SRM</span>
          {role === "srm" && (
            <div className="ml-auto size-1.5 rounded-full bg-amber-500" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setRole("user")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">User</span>
          {role === "user" && (
            <div className="ml-auto size-1.5 rounded-full bg-muted-foreground/40" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
