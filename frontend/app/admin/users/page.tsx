"use client"

import { useState } from "react"
import {
  useAdminUsers,
  useAdminSetUserRole,
  useAdminToggleUserStatus,
  useAdminDeleteUser,
} from "@/hooks/use-admin"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, ShieldOff, Trash2, Search } from "lucide-react"

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers()
  const setRole = useAdminSetUserRole()
  const toggleStatus = useAdminToggleUserStatus()
  const deleteUser = useAdminDeleteUser()
  const [search, setSearch] = useState("")
  const [roleDialog, setRoleDialog] = useState<{
    userId: number
    current: number
  } | null>(null)
  const [newRoleId, setNewRoleId] = useState("")

  const filtered = users?.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium">
                    {user.first_name || user.last_name
                      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                      : user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-xs">
                        {r.name}
                      </Badge>
                    ))}
                    <Badge
                      className={
                        user.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = user.roles[0]?.id ?? 0
                      setRoleDialog({ userId: user.id, current })
                      setNewRoleId(String(current))
                    }}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleStatus.mutate({
                        userId: user.id,
                        isActive: !user.is_active,
                      })
                    }
                  >
                    {user.is_active ? (
                      <ShieldOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Shield className="h-4 w-4 mr-1" />
                    )}
                    {user.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete user ${user.email}?`))
                        deleteUser.mutate(user.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {roleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Set Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Role ID</Label>
                <Input
                  type="number"
                  min={0}
                  max={4}
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  0=User, 1=Seller, 2=Moderator, 3=Admin, 4=Super Admin
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={async () => {
                    await setRole.mutateAsync({
                      userId: roleDialog.userId,
                      roleId: parseInt(newRoleId),
                    })
                    setRoleDialog(null)
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRoleDialog(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
