"use client"

import { useState } from "react"
import { useReportComment } from "@/hooks/use-comments"

const REPORT_REASONS = [
  "Spam or advertising",
  "Offensive or inappropriate",
  "Harassment or bullying",
  "False information",
  "Conflict of interest",
  "Other",
]

interface ReportDialogProps {
  productId: number
  commentId: number
  onClose: () => void
}

export function ReportDialog({ productId, commentId, onClose }: ReportDialogProps) {
  const report = useReportComment(productId)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    await report.mutateAsync({ commentId, data: { reason, description: description || undefined } })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">Report Comment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Reason *</label>
            <select
              className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Select a reason</option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional details..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
              disabled={!reason || report.isPending}
            >
              {report.isPending ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
