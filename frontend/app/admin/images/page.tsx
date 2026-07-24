"use client"

import { useState } from "react"
import { useAdminImages, useAdminRestoreImage } from "@/hooks/use-admin"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RotateCcw } from "lucide-react"

export default function AdminImagesPage() {
  const [showDeleted, setShowDeleted] = useState(false)
  const { data: images, isLoading } = useAdminImages({
    isDeleted: showDeleted || undefined,
  })
  const restoreImage = useAdminRestoreImage()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Images</h1>
        <div className="flex gap-2">
          <Button
            variant={!showDeleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDeleted(false)}
          >
            Active
          </Button>
          <Button
            variant={showDeleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDeleted(true)}
          >
            Deleted
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images?.map((img) => (
            <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border">
              <img
                src={img.url}
                alt={img.alt_text || ""}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white truncate">
                  {img.alt_text || `Image #${img.id}`}
                </p>
                <p className="text-[10px] text-white/70">
                  {img.variant_id ? `Variant #${img.variant_id}` : ""}
                  {img.subvariant_id
                    ? `${img.variant_id ? " / " : ""}Sub #${img.subvariant_id}`
                    : ""}
                </p>
              </div>
              {img.is_main && (
                <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
                  Main
                </Badge>
              )}
              {img.is_deleted && (
                <Badge
                  variant="destructive"
                  className="absolute right-2 top-2"
                >
                  Deleted
                </Badge>
              )}
              {img.is_deleted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => restoreImage.mutate(img.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
