"use client"

import Link from "next/link"
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react"

export default function CartPage() {
  const { data: cart, isLoading } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse products and add items to your cart.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = "/search"}>
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <Button variant="ghost" size="sm" onClick={() => clearCart.mutate()}>
          Clear all
        </Button>
      </div>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-lg border p-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="font-medium">{item.variant_name}</p>
                <p className="text-sm text-muted-foreground">{item.subvariant_name}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-md border">
                    <button
                      className="px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      onClick={() => updateItem.mutate({ id: item.id, data: { quantity: item.quantity - 1 } })}
                      disabled={item.quantity <= 1}
                    >
                      –
                    </button>
                    <span className="w-8 text-center text-xs">{item.quantity}</span>
                    <button
                      className="px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      onClick={() => updateItem.mutate({ id: item.id, data: { quantity: item.quantity + 1 } })}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between">
        <Link href="/search" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(cart.total)}</p>
          <Button className="mt-2" onClick={() => window.location.href = "/checkout"}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
