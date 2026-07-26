import Link from "next/link"
import { ImageOff, Star } from "lucide-react"
import type { ProductListItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ProductSearchCardProps {
  product: ProductListItem
}

export function ProductSearchCard({ product }: ProductSearchCardProps) {
  const priceDisplay =
    product.min_price && product.max_price
      ? product.min_price === product.max_price
        ? formatCurrency(product.min_price)
        : `${formatCurrency(product.min_price)} – ${formatCurrency(product.max_price)}`
      : null

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex gap-4 rounded-lg border bg-card p-3 transition-all hover:shadow-md sm:p-4"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-md bg-muted sm:size-24">
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <h3 className="truncate text-sm font-medium sm:text-base">{product.name}</h3>
        {product.avg_rating ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>{product.avg_rating.toFixed(1)}</span>
            <span>({product.rating_count})</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No ratings</span>
        )}
        {priceDisplay && (
          <p className="text-sm font-semibold sm:text-base">{priceDisplay}</p>
        )}
      </div>
    </Link>
  )
}
