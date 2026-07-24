import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { WishlistResponse, WishlistItemCreate } from "@/lib/types"

export function useWishlist() {
  return useQuery<WishlistResponse>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await apiClient.get<WishlistResponse>("/wishlist")
      return res.data
    },
  })
}

export function useAddToWishlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: WishlistItemCreate) => {
      const res = await apiClient.post<WishlistResponse>("/wishlist", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  })
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiClient.delete<WishlistResponse>(`/wishlist/items/${itemId}`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  })
}
