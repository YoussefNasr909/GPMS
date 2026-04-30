"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { UserRole } from "@/types"
import { useAuthStore } from "@/lib/stores/auth-store"
import { users } from "@/data/users"

const roles: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Supervisor Doctor" },
  { value: "ta", label: "Teaching Assistant" },
  { value: "leader", label: "Student (Leader)" },
  { value: "member", label: "Student (Member)" },
]

export function RoleSwitcher() {
  const { currentUser, setCurrentUser } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || "member")

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    // Find first user with this role
    const user = users.find((u) => u.role === role)
    if (user) {
      setCurrentUser(user)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <span className="text-xs font-medium">{roles.find((r) => r.value === selectedRole)?.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            className="flex items-center justify-between"
          >
            <span>{role.label}</span>
            {selectedRole === role.value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
