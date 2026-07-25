"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Star } from "lucide-react"
import type { CommentResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useComments, useCreateComment } from "@/hooks/use-comments"
import { useUpsertRating, useRatingStats } from "@/hooks/use-ratings"
import { RatingBreakdown } from "@/components/products/rating-breakdown"
import { CommentCard } from "@/components/products/comment-card"

interface ReviewSectionProps {
  productId: number
}

function UserRatingWidget({ productId }: { productId: number }) {
  const { isAuthenticated } = useAuthStore()
  const upsertRating = useUpsertRating(productId)
  const { data: stats } = useRatingStats(productId)
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  if (!isAuthenticated) return null

  const handleRate = async (star: number) => {
    if (submitting) return
    setSubmitting(true)
    try {
      await upsertRating.mutateAsync({ rating: star })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-2 border-t pt-6">
      <h3 className="text-sm font-medium">Your Rating</h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="transition-colors disabled:opacity-50"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            disabled={submitting}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hovered || (stats?.average ? Math.round(stats.average) : 0))
                  ? "fill-current text-amber-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { isAuthenticated } = useAuthStore()
  const createComment = useCreateComment(productId)

  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(productId, selectedRating)
  const [content, setContent] = useState("")

  const comments = data?.pages.flatMap((p) => p) ?? []

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await createComment.mutateAsync({ content: content.trim() })
    setContent("")
  }

  return (
    <div className="grid gap-8 md:grid-cols-[300px_1fr]">
      {/* Left — Rating Breakdown + User Rating + Write Review */}
      <div>
        <RatingBreakdown
          productId={productId}
          selectedRating={selectedRating}
          onSelectRating={setSelectedRating}
        />

        <UserRatingWidget productId={productId} />

        {isAuthenticated && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t pt-6">
            <h3 className="text-sm font-medium">Write a Review</h3>
            <Textarea
              placeholder="Share your thoughts about this product..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createComment.isPending}
            >
              {createComment.isPending ? "Posting..." : "Post Review"}
            </Button>
          </form>
        )}
      </div>

      {/* Right — Comment List */}
      <div className="space-y-4">
        {selectedRating && (
          <p className="text-sm text-muted-foreground">
            Showing reviews from users who rated {selectedRating} star{selectedRating !== 1 ? "s" : ""}
          </p>
        )}

        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}

        <div className="space-y-3">
          {comments.map((comment, i) => (
            <div key={comment.id} ref={i === comments.length - 1 ? lastRef : null}>
              <CommentCard comment={comment} productId={productId} />
            </div>
          ))}
        </div>

        {isFetchingNextPage && (
          <p className="text-center text-sm text-muted-foreground">Loading more...</p>
        )}
      </div>
    </div>
  )
}
