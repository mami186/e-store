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
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
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
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    setFiles((prev) => [...prev, ...selected])
    setPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))])
    setUploadedUrls((prev) => [...prev, ...selected.map(() => "")])
  }

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const urls: string[] = []
    const toUpload = files.filter((_, i) => !uploadedUrls[i])

    if (toUpload.length > 0) {
      setUploading(true)
      try {
        const results = await Promise.all(toUpload.map((f) => uploadImage.mutateAsync(f)))
        urls.push(...results.map((r) => r.url))
      } finally {
        setUploading(false)
      }
    }

    urls.push(...uploadedUrls.filter(Boolean))
    const allUrls = [...new Set(urls)]

    await createComment.mutateAsync({ content: content.trim(), image_urls: allUrls })
    setContent("")
    setFiles([])
    setPreviews([])
    setUploadedUrls([])
    if (fileInputRef.current) fileInputRef.current.value = ""
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
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

            {previews.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative inline-block">
                    <img
                      src={preview}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
                >
                  <ImagePlus className="size-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ImagePlus className="size-4" />
                Add images
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
