"use client"

import Link from "next/link"
import { useWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist"
import { useAddToCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"

export default function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlist()
  const removeFromWishlist = useRemoveFromWishlist()
  const addToCart = useAddToCart()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save items you love to your wishlist.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>
      <div className="space-y-4">
        {wishlist.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-lg border p-4">
            <div className="flex-1">
              <p className="font-medium">{item.variant_name}</p>
              <p className="text-sm text-muted-foreground">{item.subvariant_name}</p>
              <p className="text-sm font-semibold mt-1">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await addToCart.mutateAsync({ subvariant_id: item.subvariant_id })
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add to Cart
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => removeFromWishlist.mutate(item.id)}
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
