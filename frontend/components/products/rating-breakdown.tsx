"use client"

import { Star } from "lucide-react"
import { useRatingStats } from "@/hooks/use-ratings"

interface RatingBreakdownProps {
  productId: number
  selectedRating: number | null
  onSelectRating: (rating: number | null) => void
}

export function RatingBreakdown({ productId, selectedRating, onSelectRating }: RatingBreakdownProps) {
  const { data: stats } = useRatingStats(productId)

  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Customer Reviews</h2>
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      </div>
    )
  }

  const maxCount = Math.max(...stats.distribution, 1)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Customer Reviews</h2>

      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold">{stats.average}</span>
        <div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(stats.average)
                    ? "fill-current text-amber-500"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{stats.total} review{stats.total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[star - 1] || 0
          const pct = Math.round((count / stats.total) * 100)
          return (
            <button
              key={star}
              type="button"
              className={`flex items-center gap-2 w-full text-left text-sm py-0.5 rounded px-1 transition-colors ${
                selectedRating === star ? "bg-muted font-medium" : "hover:bg-muted/50"
              }`}
              onClick={() => onSelectRating(selectedRating === star ? null : star)}
            >
              <span className="w-4 text-right">{star}</span>
              <Star className="h-3 w-3 fill-current text-amber-500" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">{pct}%</span>
            </button>
          )
        })}
      </div>

      {selectedRating && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => onSelectRating(null)}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}
