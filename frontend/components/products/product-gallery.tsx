"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import type { ProductImageResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: ProductImageResponse[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0)
  const active = images[selected]

  if (!images.length) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <ImageOff className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          src={active.url}
          alt={active.alt_text || ""}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-md border bg-muted transition-colors",
                i === selected && "ring-2 ring-primary",
              )}
            >
              <img
                src={img.url}
                alt={img.alt_text || ""}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
