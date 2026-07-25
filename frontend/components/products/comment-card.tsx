"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Flag, MessageCircle, Star, User } from "lucide-react"
import type { CommentResponse } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useCreateComment } from "@/hooks/use-comments"
import { ReportDialog } from "@/components/products/report-dialog"

interface CommentCardProps {
  comment: CommentResponse
  productId: number
  depth?: number
}

export function CommentCard({ comment, productId, depth = 0 }: CommentCardProps) {
  const { isAuthenticated } = useAuthStore()
  const createComment = useCreateComment(productId)
  const [showReply, setShowReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [showReport, setShowReport] = useState(false)

  const hasReplies = comment.replies && comment.replies.length > 0

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    await createComment.mutateAsync({
      content: replyContent.trim(),
      parent_comment_id: comment.id,
    })
    setReplyContent("")
    setShowReply(false)
    setShowReplies(true)
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
            {comment.rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= comment.rating!
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

        {comment.image_url && (
          <img
            src={comment.image_url}
            alt="Comment attachment"
            className="mb-2 max-h-48 rounded object-cover"
          />
        )}

        <p className="text-sm">{comment.content}</p>

        <div className="mt-2 flex items-center gap-3">
          {isAuthenticated && depth === 0 && (
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
          {hasReplies && (
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
              {comment.replies.length} repl{comment.replies.length !== 1 ? "ies" : "y"}
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
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!replyContent.trim() || createComment.isPending}>
                {createComment.isPending ? "Posting..." : "Post Reply"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowReply(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {hasReplies && showReplies && (
        <div className="mt-1 space-y-1">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} productId={productId} depth={depth + 1} />
          ))}
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
