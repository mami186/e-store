"use client"

import { use, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useProduct } from "@/hooks/use-products"
import { useImages, useUploadImage, useDeleteImage, useSetMainImage } from "@/hooks/use-images"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, Trash2, Star, ArrowLeft } from "lucide-react"

export default function ProductImagesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const productId = parseInt(id)
  const router = useRouter()
  const { data: product } = useProduct(productId)
  const { data: images, isLoading } = useImages(productId)
  const uploadImage = useUploadImage(productId)
  const deleteImage = useDeleteImage(productId)
  const setMainImage = useSetMainImage(productId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await uploadImage.mutateAsync({ file })
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push(`/seller/products/${productId}/edit`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Images: {product?.name || `Product #${productId}`}
        </h1>
      </div>

      <div className="mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || uploadImage.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {(!images || images.length === 0) && (
        <p className="text-muted-foreground">No images uploaded yet.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images?.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border">
            <img
              src={img.url}
              alt={img.alt_text || ""}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {!img.is_main && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-9"
                  onClick={() => setMainImage.mutate(img.id)}
                  title="Set as main"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="size-9"
                onClick={() => {
                  if (confirm("Delete this image?")) {
                    deleteImage.mutate(img.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {img.is_main && (
              <div className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                Main
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
