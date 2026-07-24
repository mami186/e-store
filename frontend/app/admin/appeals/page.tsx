"use client"

import { useAdminAppeals, useAdminReviewAppeal } from "@/hooks/use-admin"
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

export default function AdminAppealsPage() {
  const { data: appeals, isLoading } = useAdminAppeals()
  const reviewAppeal = useAdminReviewAppeal()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Appeals</h1>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {appeals?.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">
              No appeals submitted.
            </p>
          )}
          {appeals?.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">
                      Appeal for Restriction #{a.restriction_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.appeal_text}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(a.created_at)}</span>
                    </div>
                    <Badge className={statusColors[a.status] || ""}>
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </Badge>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        onClick={() =>
                          reviewAppeal.mutate({
                            appealId: a.id,
                            status: "approved",
                          })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          reviewAppeal.mutate({
                            appealId: a.id,
                            status: "rejected",
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
