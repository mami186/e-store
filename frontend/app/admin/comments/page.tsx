"use client"

import { useState } from "react"
import { useAdminComments, useAdminUpdateCommentStatus } from "@/hooks/use-admin"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function AdminCommentsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data: comments, isLoading } = useAdminComments(filter)
  const updateStatus = useAdminUpdateCommentStatus()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comments</h1>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <Button
              key={f}
              variant={filter === f || (!filter && f === "all") ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f === "all" ? undefined : f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments?.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm">{c.content}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Product #{c.product_id}</span>
                      <span>User #{c.user_id}</span>
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                    <Badge className={statusColors[c.status] || ""}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.status !== "approved" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({
                            commentId: c.id,
                            status: "approved",
                          })
                        }
                      >
                        Approve
                      </Button>
                    )}
                    {c.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatus.mutate({
                            commentId: c.id,
                            status: "rejected",
                          })
                        }
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
