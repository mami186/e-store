import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { CommentResponse, CommentCreate, CommentReportCreate, CommentReportResponse } from "@/lib/types"

export function useComments(productId: number, rating: number | null = null) {
  return useInfiniteQuery<CommentResponse[]>({
    queryKey: ["comments", productId, rating],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { page: String(pageParam), limit: "5" }
      if (rating) params.rating = String(rating)
      const res = await apiClient.get<CommentResponse[]>(`/products/${productId}/comments`, { params })
      return res.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 5 ? (lastPageParam as number) + 1 : undefined,
    enabled: !!productId,
  })
}

export function useCreateComment(productId: number, parentCommentId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CommentCreate) => {
      const res = await apiClient.post<CommentResponse>(`/products/${productId}/comments`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["comments", productId] })
      if (variables.parent_comment_id) {
        qc.invalidateQueries({ queryKey: ["comment-replies", productId, variables.parent_comment_id] })
      }
    },
  })
}

export function useDeleteComment(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: number) => {
      await apiClient.delete(`/products/${productId}/comments/${commentId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", productId] }),
  })
}

export function useCommentReplies(productId: number, commentId: number) {
  return useInfiniteQuery<CommentResponse[]>({
    queryKey: ["comment-replies", productId, commentId],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get<CommentResponse[]>(
        `/products/${productId}/comments/${commentId}/replies`,
        { params: { page: String(pageParam), limit: "5" } },
      )
      return res.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 5 ? (lastPageParam as number) + 1 : undefined,
    enabled: !!productId && !!commentId,
  })
}

export function useUploadCommentImage(productId: number) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const res = await apiClient.post<{ key: string; url: string }>(
        `/products/${productId}/comments/upload-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      return res.data
    },
  })
}

export function useReportComment(productId: number) {
  return useMutation({
    mutationFn: async ({ commentId, data }: { commentId: number; data: CommentReportCreate }) => {
      const res = await apiClient.post<CommentReportResponse>(
        `/products/${productId}/comments/${commentId}/report`,
        data,
      )
      return res.data
    },
  })
}
