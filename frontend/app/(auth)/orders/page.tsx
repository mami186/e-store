"use client"

import Link from "next/link"
import { useOrders } from "@/hooks/use-orders"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Package } from "lucide-react"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">No orders yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          When you place an order, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <p className="font-medium">Order #{order.id}</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
              <p className="text-sm text-muted-foreground">
                {order.items.length} item{order.items.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right space-y-1">
              <Badge className={statusColors[order.status] || ""}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <p className="font-semibold">{formatCurrency(order.total)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
