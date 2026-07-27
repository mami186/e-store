"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ImageOff, ImagePlus, Star, X } from "lucide-react"
import type { CommentResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useComments, useCreateComment, useUploadCommentImage } from "@/hooks/use-comments"
import { useUpsertRating, useRatingStats, useUserRating } from "@/hooks/use-ratings"
import { RatingBreakdown } from "@/components/products/rating-breakdown"
import { CommentCard } from "@/components/products/comment-card"

interface ReviewSectionProps {
  productId: number
}

function UserRatingWidget({ productId }: { productId: number }) {
  const { isAuthenticated } = useAuthStore()
  const upsertRating = useUpsertRating(productId)
  const { data: stats } = useRatingStats(productId)
  const { data: userRating } = useUserRating(productId)
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
                star <= (hovered || (userRating?.rating ?? 0))
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
  const uploadImage = useUploadCommentImage(productId)

  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(productId, selectedRating)
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setUploadedUrl(null)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setUploadedUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    let url = uploadedUrl
    if (imageFile && !url) {
      setUploading(true)
      try {
        const result = await uploadImage.mutateAsync(imageFile)
        url = result.url
        setUploadedUrl(url)
      } finally {
        setUploading(false)
      }
    }

    await createComment.mutateAsync({ content: content.trim(), image_url: url ?? undefined })
    setContent("")
    handleRemoveImage()
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ImagePlus className="size-4" />
                Add image
              </button>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || createComment.isPending || uploading}
              >
                {uploading ? "Uploading..." : createComment.isPending ? "Posting..." : "Post Review"}
              </Button>
            </div>
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
