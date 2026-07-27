import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { SellerResponse, SellerApply, SellerUpdate } from "@/lib/types"

export function useSellerProfile() {
  return useQuery<SellerResponse | null>({
    queryKey: ["seller", "me"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<SellerResponse>("/sellers/me")
        return res.data
      } catch {
        return null
      }
    },
  })
}

export function useSeller(userId: number) {
  return useQuery<SellerResponse>({
    queryKey: ["seller", userId],
    queryFn: async () => {
      const res = await apiClient.get<SellerResponse>(`/sellers/${userId}`)
      return res.data
    },
    enabled: !!userId,
  })
}

export function useApplySeller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SellerApply) => {
      const res = await apiClient.post<SellerResponse>("/sellers/apply", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "me"] }),
  })
}

export function useUpdateSeller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SellerUpdate) => {
      const res = await apiClient.put<SellerResponse>("/sellers/me", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "me"] }),
  })
}
