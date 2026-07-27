"use client"

import { useState } from "react"
import { useReportProduct } from "@/hooks/use-products"

interface ProductReportDialogProps {
  productId: number
  productName: string
  onClose: () => void
}

export function ProductReportDialog({ productId, productName, onClose }: ProductReportDialogProps) {
  const report = useReportProduct()
  const [reason, setReason] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    await report.mutateAsync({ productId, data: { reason_text: reason } })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-2 text-lg font-semibold">Report Submitted</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for your report. Our moderators will review it shortly.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-semibold">Report Product</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Report &ldquo;{productName}&rdquo; to our moderation team.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Reason *</label>
            <textarea
              className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why you are reporting this product..."
              required
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
