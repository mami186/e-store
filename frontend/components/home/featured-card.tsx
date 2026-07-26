import Link from "next/link"
import { ImageOff } from "lucide-react"
import type { FeaturedItemResponse } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface FeaturedCardProps {
  item: FeaturedItemResponse
}

export function FeaturedCard({ item }: FeaturedCardProps) {
  if (item.product) {
    const p = item.product
    const priceDisplay =
      p.min_price && p.max_price
        ? p.min_price === p.max_price
          ? formatCurrency(p.min_price)
          : `${formatCurrency(p.min_price)} – ${formatCurrency(p.max_price)}`
        : null

    return (
      <Link
        href={`/products/${p.id}`}
        className="group flex flex-col rounded-lg border bg-card transition-all hover:shadow-md min-w-[200px] w-[200px]"
      >
        <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
          {p.main_image ? (
            <img
              src={p.main_image}
              alt={p.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 p-3">
          <h3 className="text-sm font-medium line-clamp-2">{p.name}</h3>
          {priceDisplay && <p className="text-sm font-semibold">{priceDisplay}</p>}
        </div>
      </Link>
    )
  }

  if (item.variant) {
    const v = item.variant
    return (
      <Link
        href={`/products/${v.product_id}`}
        className="group flex flex-col rounded-lg border bg-card transition-all hover:shadow-md min-w-[200px] w-[200px]"
      >
        <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
          {v.image ? (
            <img
              src={v.image}
              alt={v.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 p-3">
          <p className="text-xs text-muted-foreground line-clamp-1">{v.product_name}</p>
          <h3 className="text-sm font-medium line-clamp-2">{v.name}</h3>
          <p className="text-sm font-semibold">{formatCurrency(v.price)}</p>
        </div>
      </Link>
    )
  }

  return null
}
