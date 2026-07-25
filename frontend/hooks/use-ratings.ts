import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { RatingCreate, RatingStats, RatingResponse } from "@/lib/types"

export function useRatingStats(productId: number) {
  return useQuery<RatingStats>({
    queryKey: ["rating-stats", productId],
    queryFn: async () => {
      const res = await apiClient.get<RatingStats>(`/products/${productId}/comments/rating`)
      return res.data
    },
    enabled: !!productId,
  })
}

export function useUpsertRating(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RatingCreate) => {
      const res = await apiClient.post<RatingResponse>(`/products/${productId}/comments/rating`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rating-stats", productId] })
    },
  })
}
