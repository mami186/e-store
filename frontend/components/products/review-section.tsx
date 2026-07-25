"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Star } from "lucide-react"
import type { CommentResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useComments, useCreateComment } from "@/hooks/use-comments"
import { useUpsertRating } from "@/hooks/use-ratings"
import { RatingBreakdown } from "@/components/products/rating-breakdown"
import { CommentCard } from "@/components/products/comment-card"

interface ReviewSectionProps {
  productId: number
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { isAuthenticated } = useAuthStore()
  const createComment = useCreateComment(productId)
  const upsertRating = useUpsertRating(productId)

  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(productId, selectedRating)
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)

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
    if (!content.trim() || !rating) return
    await createComment.mutateAsync({ content: content.trim(), rating })
    setContent("")
    setRating(0)
  }

  return (
    <div className="grid gap-8 md:grid-cols-[300px_1fr]">
      {/* Left — Rating Breakdown */}
      <div>
        <RatingBreakdown
          productId={productId}
          selectedRating={selectedRating}
          onSelectRating={setSelectedRating}
        />

        {isAuthenticated && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t pt-6">
            <h3 className="text-sm font-medium">Write a Review</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-colors"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(rating === star ? 0 : star)}
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= (hovered || rating)
                        ? "fill-current text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">{rating} / 5</span>
              )}
            </div>
            <Textarea
              placeholder="Write your review..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || !rating || createComment.isPending}
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
            Showing reviews with {selectedRating} star{selectedRating !== 1 ? "s" : ""}
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
