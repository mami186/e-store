import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { ProductImageResponse } from "@/lib/types"

export function useImages(productId: number) {
  return useQuery<ProductImageResponse[]>({
    queryKey: ["images", productId],
    queryFn: async () => {
      const res = await apiClient.get<ProductImageResponse[]>(
        `/products/${productId}/images`,
      )
      return res.data
    },
    enabled: !!productId,
  })
}

export function useUploadImage(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      variant_id,
      subvariant_id,
      alt_text,
    }: {
      file: File
      variant_id?: number
      subvariant_id?: number
      alt_text?: string
    }) => {
      const form = new FormData()
      form.append("file", file)
      if (variant_id) form.append("variant_id", String(variant_id))
      if (subvariant_id) form.append("subvariant_id", String(subvariant_id))
      if (alt_text) form.append("alt_text", alt_text)
      const res = await apiClient.post(`/products/${productId}/images`, form)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", productId] }),
  })
}

export function useDeleteImage(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: number) => {
      await apiClient.delete(`/products/${productId}/images/${imageId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", productId] }),
  })
}

export function useSetMainImage(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: number) => {
      await apiClient.put(`/products/${productId}/images/${imageId}/main`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images", productId] }),
  })
}
