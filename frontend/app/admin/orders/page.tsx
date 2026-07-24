"use client"

import { useState } from "react"
import { useAdminOrders, useAdminUpdateOrderStatus } from "@/hooks/use-admin"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data: orders, isLoading } = useAdminOrders(filter)
  const updateStatus = useAdminUpdateOrderStatus()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(
            (f) => (
              <Button
                key={f}
                variant={
                  filter === f || (!filter && f === "all") ? "default" : "outline"
                }
                size="sm"
                onClick={() => setFilter(f === "all" ? undefined : f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ),
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item(s) — {formatCurrency(order.total)}
                    </p>
                    <Badge className={statusColors[order.status] || ""}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <select
                    value={order.status}
                    onChange={async (e) => {
                      await updateStatus.mutateAsync({
                        orderId: order.id,
                        status: e.target.value,
                      })
                    }}
                    className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
