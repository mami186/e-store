"use client"

import { useState } from "react"
import {
  useAdminSellers,
  useAdminVerifySeller,
} from "@/hooks/use-admin"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function AdminSellersPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data: sellers, isLoading } = useAdminSellers(filter)
  const verifySeller = useAdminVerifySeller()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sellers</h1>
        <div className="flex gap-2">
          {["all", "pending", "verified", "rejected"].map((f) => (
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
          {sellers?.map((seller) => (
            <Card key={seller.user_id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{seller.shop_name}</p>
                    {seller.shop_description && (
                      <p className="text-sm text-muted-foreground">
                        {seller.shop_description}
                      </p>
                    )}
                    <Badge
                      className={
                        statusColors[seller.verification_status] || ""
                      }
                    >
                      {seller.verification_status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Since {formatDate(seller.created_at)}
                    </p>
                  </div>
                  {seller.verification_status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() =>
                          verifySeller.mutate({
                            userId: seller.user_id,
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
                          verifySeller.mutate({
                            userId: seller.user_id,
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
