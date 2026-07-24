import Link from "next/link"
import { ImageOff } from "lucide-react"
import type { ProductListItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ProductCardProps {
  product: ProductListItem
}

export function ProductCard({ product }: ProductCardProps) {
  const priceDisplay =
    product.min_price && product.max_price
      ? product.min_price === product.max_price
        ? formatCurrency(product.min_price)
        : `${formatCurrency(product.min_price)} – ${formatCurrency(product.max_price)}`
      : null

  return (
    <Link
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
        {priceDisplay && (
          <p className="text-sm font-semibold">{priceDisplay}</p>
        )}
      </div>
    </Link>
  )
}
