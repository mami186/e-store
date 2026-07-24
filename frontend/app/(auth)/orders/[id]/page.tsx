"use client"

import { use } from "react"
import Link from "next/link"
import { useOrder } from "@/hooks/use-orders"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: order, isLoading } = useOrder(parseInt(id))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <Badge className={statusColor[order.status] || ""}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-8">
        Placed on {formatDate(order.created_at)}
      </p>

      {/* Items */}
      <div className="space-y-3 mb-8">
        <h2 className="font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="text-sm text-muted-foreground">
                {item.variant_name} / {item.subvariant_name} × {item.quantity}
              </p>
            </div>
            <p className="font-medium">{formatCurrency(item.total_price)}</p>
          </div>
        ))}
      </div>

      <Separator className="mb-8" />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Shipping address */}
        <div>
          <h2 className="font-semibold mb-2">Shipping Address</h2>
          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p className="font-medium">{order.address.full_name}</p>
            <p className="text-muted-foreground">{order.address.street}</p>
            <p className="text-muted-foreground">
              {order.address.city}, {order.address.state} {order.address.postal_code}
            </p>
            <p className="text-muted-foreground">{order.address.country}</p>
          </div>
        </div>

        {/* Price summary */}
        <div>
          <h2 className="font-semibold mb-2">Order Summary</h2>
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          {order.notes && (
            <p className="mt-3 text-sm text-muted-foreground">
              Notes: {order.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
