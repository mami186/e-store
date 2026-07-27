"use client"

import { use } from "react"
import Link from "next/link"
import { Store, Package, Calendar, BadgeCheck, ImageOff } from "lucide-react"
import { useSeller } from "@/hooks/use-seller"
import { useSellerProducts } from "@/hooks/use-seller-products"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const userId = parseInt(id, 10)

  const { data: seller, isLoading: sellerLoading, error: sellerError } = useSeller(userId)
  const { data: products, isLoading: productsLoading } = useSellerProducts(userId)

  if (sellerLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (sellerError || !seller) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Store className="mx-auto mb-4 size-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Seller not found</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Shop Header */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted">
            <Store className="size-7 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{seller.shop_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                Joined {formatDate(seller.created_at)}
              </span>
              <Badge
                variant={seller.verification_status === "verified" ? "default" : "secondary"}
                className="inline-flex items-center gap-1"
              >
                <BadgeCheck className="size-3" />
                {seller.verification_status === "verified" ? "Verified" : "Pending"}
              </Badge>
            </div>
            {seller.shop_description && (
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                {seller.shop_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="mb-4 text-lg font-semibold inline-flex items-center gap-2">
        <Package className="size-5" />
        Products
      </h2>

      {productsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products?.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group flex flex-col rounded-lg border bg-card transition-all hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                {product.main_image ? (
                  <img
                    src={product.main_image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
                <p className="text-sm font-semibold">
                  {product.min_price && product.max_price
                    ? product.min_price === product.max_price
                      ? formatCurrency(product.min_price)
                      : `${formatCurrency(product.min_price)} – ${formatCurrency(product.max_price)}`
                    : null}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      )}
    </div>
  )
}
