"use client"

import { useState } from "react"
import {
  useAdminRestrictions,
  useAdminRestrictUser,
  useAdminLiftRestriction,
  useAdminRestrictionReasons,
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
import { Ban, Plus, Unlock } from "lucide-react"

const statusColors: Record<string, string> = {
  active: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  lifted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export default function AdminRestrictionsPage() {
  const { data: restrictions, isLoading } = useAdminRestrictions()
  const { data: reasons } = useAdminRestrictionReasons()
  const restrictUser = useAdminRestrictUser()
  const liftRestriction = useAdminLiftRestriction()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    userId: "",
    reasonId: "",
    description: "",
    penaltyDays: "",
    subvariantIds: "",
  })

  const handleRestrict = async (e: React.FormEvent) => {
    e.preventDefault()
    await restrictUser.mutateAsync({
      userId: parseInt(form.userId),
      data: {
        reason_id: parseInt(form.reasonId),
        description: form.description || undefined,
        penalty_days: form.penaltyDays ? parseInt(form.penaltyDays) : undefined,
        subvariant_ids: form.subvariantIds
          ? form.subvariantIds.split(",").map(Number)
          : [],
      },
    })
    setShowForm(false)
    setForm({
      userId: "",
      reasonId: "",
      description: "",
      penaltyDays: "",
      subvariantIds: "",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restrictions</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Restrict User
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {restrictions?.length === 0 && (
            <div className="text-center py-12">
              <Ban className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No restrictions.
              </p>
            </div>
          )}
          {restrictions?.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      User #{r.user_id} — {r.reason_text}
                    </p>
                    {r.description && (
                      <p className="text-sm text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Since {formatDate(r.created_at)}</span>
                      {r.penalty_days && <span>{r.penalty_days} days</span>}
                      {r.products.length > 0 && (
                        <span>{r.products.length} product(s) affected</span>
                      )}
                    </div>
                    <Badge className={statusColors[r.status] || ""}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Badge>
                  </div>
                  {r.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => liftRestriction.mutate(r.id)}
                    >
                      <Unlock className="h-4 w-4 mr-1" />
                      Lift
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Restrict User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRestrict} className="space-y-4">
                <div className="space-y-1">
                  <Label>User ID *</Label>
                  <Input
                    type="number"
                    required
                    value={form.userId}
                    onChange={(e) =>
                      setForm({ ...form, userId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reason *</Label>
                  <select
                    required
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                    value={form.reasonId}
                    onChange={(e) =>
                      setForm({ ...form, reasonId: e.target.value })
                    }
                  >
                    <option value="">Select reason...</option>
                    {reasons?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.reason_text}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Penalty (days)</Label>
                    <Input
                      type="number"
                      value={form.penaltyDays}
                      onChange={(e) =>
                        setForm({ ...form, penaltyDays: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>SubVariant IDs</Label>
                    <Input
                      value={form.subvariantIds}
                      onChange={(e) =>
                        setForm({ ...form, subvariantIds: e.target.value })
                      }
                      placeholder="1,2,3"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Restrict
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
