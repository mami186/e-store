"use client"

import { useState } from "react"
import { useAdminProducts, useAdminUpdateProductStatus } from "@/hooks/use-admin"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"


const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
}

export default function AdminProductsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const { data: products, isLoading } = useAdminProducts(filter)
  const updateStatus = useAdminUpdateProductStatus()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          {["all", "draft", "published", "archived"].map((f) => (
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
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {products?.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {p.main_image ? (
                  <img
                    src={p.main_image}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                    No img
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <Badge className={statusColors[p.status] || ""}>
                    {p.status}
                  </Badge>
                  {p.min_price != null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatCurrency(p.min_price)}
                    </span>
                  )}
                </div>
                <select
                  value={p.status}
                  onChange={async (e) => {
                    await updateStatus.mutateAsync({
                      productId: p.id,
                      status: e.target.value,
                    })
                  }}
                  className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
