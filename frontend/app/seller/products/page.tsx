"use client"

import Link from "next/link"
import { useSellerProfile } from "@/hooks/use-seller"
import { useSellerProducts, useDeleteProduct } from "@/hooks/use-seller-products"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Plus, Pencil, Trash2 } from "lucide-react"

const statusBadge: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
}

export default function SellerProductsPage() {
  const { data: profile } = useSellerProfile()
  const { data: products, isLoading } = useSellerProducts(profile?.user_id || 0)
  const deleteProduct = useDeleteProduct()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/seller/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </Link>
      </div>

      {(!products || products.length === 0) && (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No products yet.</p>
          <Link href="/seller/products/new">
            <Button className="mt-4" variant="outline">
              Create your first product
            </Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {products?.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              {product.main_image ? (
                <img
                  src={product.main_image}
                  alt=""
                  className="h-14 w-14 rounded object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-muted text-muted-foreground text-xs">
                  No img
                </div>
              )}
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusBadge[product.status] || ""}>
                    {product.status}
                  </Badge>
                  {product.min_price != null && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(product.min_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Link href={`/seller/products/${product.id}/edit`}>
                <Button variant="ghost" size="icon" className="size-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/seller/products/${product.id}/images`}>
                <Button variant="ghost" size="icon" className="size-8" title="Manage images">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  if (confirm("Delete this product?")) {
                    deleteProduct.mutate(product.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
