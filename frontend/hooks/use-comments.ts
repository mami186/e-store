import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { CommentResponse, CommentCreate } from "@/lib/types"

export function useComments(productId: number) {
  return useQuery<CommentResponse[]>({
    queryKey: ["comments", productId],
    queryFn: async () => {
      const res = await apiClient.get<CommentResponse[]>(
        `/products/${productId}/comments`,
      )
      return res.data
    },
    enabled: !!productId,
  })
}

export function useCreateComment(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CommentCreate) => {
      const res = await apiClient.post<CommentResponse>(
        `/products/${productId}/comments`,
        data,
      )
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", productId] }),
  })
}
