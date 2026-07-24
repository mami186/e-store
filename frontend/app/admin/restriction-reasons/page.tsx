"use client"

import { useState } from "react"
import {
  useAdminRestrictionReasons,
  useAdminCreateRestrictionReason,
} from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Gavel } from "lucide-react"

export default function AdminRestrictionReasonsPage() {
  const { data: reasons, isLoading } = useAdminRestrictionReasons()
  const createReason = useAdminCreateRestrictionReason()
  const [showForm, setShowForm] = useState(false)
  const [reasonText, setReasonText] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createReason.mutateAsync({ reason_text: reasonText })
    setReasonText("")
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restriction Reasons</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Reason
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {reasons?.length === 0 && (
            <div className="text-center py-12">
              <Gavel className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No restriction reasons defined.
              </p>
            </div>
          )}
          {reasons?.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 text-sm">{r.reason_text}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>New Restriction Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Reason text</Label>
                  <Input
                    required
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Save
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
