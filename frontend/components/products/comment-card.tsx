"use client"

import { useState, useRef, useCallback } from "react"
import { ChevronDown, ChevronRight, Flag, ImagePlus, MessageCircle, Star, User, X } from "lucide-react"
import type { CommentResponse } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useCreateComment, useCommentReplies, useUploadCommentImage } from "@/hooks/use-comments"
import { ReportDialog } from "@/components/products/report-dialog"

const MAX_DEPTH = 4

interface CommentCardProps {
  comment: CommentResponse
  productId: number
  depth?: number
}

export function CommentCard({ comment, productId, depth = 0 }: CommentCardProps) {
  const { isAuthenticated } = useAuthStore()
  const createComment = useCreateComment(productId)
  const uploadImage = useUploadCommentImage(productId)
  const [showReply, setShowReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [showReport, setShowReport] = useState(false)
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [replyPreviews, setReplyPreviews] = useState<string[]>([])
  const [replyUploading, setReplyUploading] = useState(false)
  const replyFileRef = useRef<HTMLInputElement>(null)

  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentReplies(productId, comment.id)

  const replies = repliesData?.pages.flatMap((p) => p) ?? []

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastReplyRef = useCallback(
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

  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    setReplyFiles((prev) => [...prev, ...selected])
    setReplyPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))])
  }

  const handleRemoveReplyImage = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index))
    setReplyPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    let urls: string[] = []
    if (replyFiles.length > 0) {
      setReplyUploading(true)
      try {
        const results = await Promise.all(replyFiles.map((f) => uploadImage.mutateAsync(f)))
        urls = results.map((r) => r.url)
      } finally {
        setReplyUploading(false)
      }
    }

    await createComment.mutateAsync({
      content: replyContent.trim(),
      parent_comment_id: comment.id,
      image_urls: urls,
    })
    setReplyContent("")
    setReplyFiles([])
    setReplyPreviews([])
    setShowReply(false)
    setShowReplies(true)
  }

  const allImages = [...(comment.images ?? [])]
  if (comment.image_url && !allImages.some((img) => img.url === comment.image_url)) {
    allImages.unshift({ id: 0, url: comment.image_url })
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-muted pl-4" : ""}>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
              {comment.user_avatar_url ? (
                <img src={comment.user_avatar_url} alt="" className="h-7 w-7 rounded-full" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <span className="text-sm font-medium">{comment.user_name || "Anonymous"}</span>
          </div>
          <div className="flex items-center gap-2">
            {comment.user_rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= comment.user_rating!
                        ? "fill-current text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            )}
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
        </div>

        {allImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {allImages.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt="Comment attachment"
                className="h-24 w-24 rounded object-cover border"
              />
            ))}
          </div>
        )}

        <p className="text-sm">{comment.content}</p>

        <div className="mt-2 flex items-center gap-3">
          {isAuthenticated && depth < MAX_DEPTH && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowReply(!showReply)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
          {isAuthenticated && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowReport(true)}
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </button>
          )}
          {comment.reply_count > 0 && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {comment.reply_count} repl{comment.reply_count !== 1 ? "ies" : "y"}
            </button>
          )}
        </div>

        {showReply && (
          <form onSubmit={handleReply} className="mt-3 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="text-sm"
            />

            <input
              ref={replyFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleReplyImageSelect}
            />

            {replyPreviews.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {replyPreviews.map((preview, i) => (
                  <div key={i} className="relative inline-block">
                    <img
                      src={preview}
                      alt={`Reply image ${i + 1}`}
                      className="h-16 w-16 rounded object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveReplyImage(i)}
                      className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-muted"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => replyFileRef.current?.click()}
                  className="flex size-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
                >
                  <ImagePlus className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => replyFileRef.current?.click()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ImagePlus className="size-3.5" />
                Add images
              </button>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!replyContent.trim() || replyUploading || createComment.isPending}>
                {replyUploading ? "Uploading..." : createComment.isPending ? "Posting..." : "Post Reply"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowReply(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {showReplies && (
        <div className="mt-1 space-y-1">
          {replies.map((reply, i) => (
            <div key={reply.id} ref={i === replies.length - 1 ? lastReplyRef : null}>
              <CommentCard comment={reply} productId={productId} depth={depth + 1} />
            </div>
          ))}
          {isFetchingNextPage && (
            <p className="text-center text-xs text-muted-foreground py-2">Loading more...</p>
          )}
          {hasNextPage && !isFetchingNextPage && (
            <button
              type="button"
              className="ml-6 text-xs text-muted-foreground hover:underline"
              onClick={() => fetchNextPage()}
            >
              Show more replies
            </button>
          )}
        </div>
      )}

      {showReport && (
        <ReportDialog
          productId={productId}
          commentId={comment.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
