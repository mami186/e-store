"use client"

import { useState } from "react"
import { useAppeals, useCreateAppeal } from "@/hooks/use-appeals"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Scale, Plus } from "lucide-react"

export default function AppealsPage() {
  const { data: appeals, isLoading } = useAppeals()
  const createAppeal = useCreateAppeal()
  const [showForm, setShowForm] = useState(false)
  const [restrictionId, setRestrictionId] = useState("")
  const [reason, setReason] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createAppeal.mutateAsync({
      restriction_id: parseInt(restrictionId),
      reason_text: reason,
    })
    setShowForm(false)
    setRestrictionId("")
    setReason("")
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Appeals</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Appeal
        </Button>
      </div>

      {(!appeals || appeals.length === 0) && (
        <div className="text-center py-16">
          <Scale className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No appeals submitted.</p>
        </div>
      )}

      <div className="space-y-4">
        {appeals?.map((appeal) => (
          <Card key={appeal.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Restriction #{appeal.restriction_id}</p>
                <Badge
                  className={
                    appeal.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : appeal.status === "rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                >
                  {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm">{appeal.appeal_text}</p>
              <p className="text-xs text-muted-foreground">{formatDate(appeal.created_at)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Submit Appeal</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Restriction ID</Label>
                  <Input
                    type="number"
                    required
                    value={restrictionId}
                    onChange={(e) => setRestrictionId(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reason</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={createAppeal.isPending}>
                    Submit
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
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
