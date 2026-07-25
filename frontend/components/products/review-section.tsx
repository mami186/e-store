"use client"

import { useState } from "react"
import { Star, StarHalf } from "lucide-react"
import type { CommentResponse } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useCreateComment } from "@/hooks/use-comments"

interface ReviewSectionProps {
  productId: number
  comments: CommentResponse[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? "fill-current text-amber-500" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewSection({ productId, comments }: ReviewSectionProps) {
  const { isAuthenticated } = useAuthStore()
  const createComment = useCreateComment(productId)
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await createComment.mutateAsync({ content: content.trim(), rating: rating || undefined })
    setContent("")
    setRating(0)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Customer Reviews</h2>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              {comment.rating && <StarRating rating={comment.rating} />}
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        ))}
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="space-y-3">
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
              <span className="ml-2 text-xs text-muted-foreground">
                {rating} / 5
              </span>
            )}
          </div>
          <Textarea
            placeholder="Write a review..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <Button type="submit" size="sm" disabled={!content.trim() || createComment.isPending}>
            {createComment.isPending ? "Posting..." : "Post Review"}
          </Button>
        </form>
      )}
    </div>
  )
}
