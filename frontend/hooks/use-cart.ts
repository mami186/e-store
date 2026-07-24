import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { CartResponse, CartItemCreate, CartItemUpdate } from "@/lib/types"

export function useCart() {
  return useQuery<CartResponse>({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await apiClient.get<CartResponse>("/cart")
      return res.data
    },
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CartItemCreate) => {
      const res = await apiClient.post<CartResponse>("/cart", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CartItemUpdate }) => {
      const res = await apiClient.put<CartResponse>(`/cart/items/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<CartResponse>(`/cart/items/${id}`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  })
}
