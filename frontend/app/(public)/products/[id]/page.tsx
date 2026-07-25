"use client"

import { use, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProduct } from "@/hooks/use-products"
import { useComments } from "@/hooks/use-comments"
import { useAddToCart } from "@/hooks/use-cart"
import { useAuthStore } from "@/lib/auth-store"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGallery } from "@/components/products/product-gallery"
import { VariantSelector } from "@/components/products/variant-selector"
import { ReviewSection } from "@/components/products/review-section"
import type { SubVariantResponse } from "@/lib/types"

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const productId = parseInt(id, 10)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const addToCart = useAddToCart()

  const { data: product, isLoading, error } = useProduct(productId)
  const { data: comments } = useComments(productId)

  const [selectedSubVariant, setSelectedSubVariant] = useState<SubVariantResponse | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  const price = selectedSubVariant?.effective_price ?? product?.min_price ?? 0
  const stock = selectedSubVariant?.stock ?? 0
  const maxQuantity = Math.min(stock, 99)

  const handleAddToCart = useCallback(async () => {
    if (!selectedSubVariant) return
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    setAdding(true)
    try {
      await addToCart.mutateAsync({
        subvariant_id: selectedSubVariant.id,
        quantity,
      })
      router.push("/cart")
    } finally {
      setAdding(false)
    }
  }, [selectedSubVariant, quantity, isAuthenticated, router, addToCart])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">Product not found</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={product.images} />

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            {product.category && (
              <Badge variant="secondary" className="mt-1">
                {product.category.name}
              </Badge>
            )}
          </div>

          <p className="text-3xl font-bold">{formatCurrency(price)}</p>

          {product.short_description && (
            <p className="text-sm text-muted-foreground">{product.short_description}</p>
          )}

          <Separator />

          {/* Variant selector */}
          {product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              onSelect={(sv) => {
                setSelectedSubVariant(sv)
                setQuantity(1)
              }}
            />
          )}

          {/* Stock info */}
          {selectedSubVariant && (
            <p className="text-sm text-muted-foreground">
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </p>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <button
                className="px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                –
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
              <button
                className="px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity || maxQuantity === 0}
              >
                +
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              disabled={!selectedSubVariant || stock === 0 || adding}
              onClick={handleAddToCart}
            >
              {adding ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      {/* Long Description */}
      {product.long_description && (
        <>
          <Separator className="my-12" />
          <div>
            <h2 className="mb-4 text-lg font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {product.long_description}
            </p>
          </div>
        </>
      )}

      {/* Reviews */}
      <Separator className="my-12" />
      <ReviewSection productId={productId} comments={comments ?? []} />
    </div>
  )
}
