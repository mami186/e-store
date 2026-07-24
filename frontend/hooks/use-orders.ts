import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { OrderResponse, CreateOrderRequest } from "@/lib/types"

export function useOrders() {
  return useQuery<OrderResponse[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiClient.get<OrderResponse[]>("/orders")
      return res.data
    },
  })
}

export function useOrder(id: number) {
  return useQuery<OrderResponse>({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await apiClient.get<OrderResponse>(`/orders/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const res = await apiClient.post<OrderResponse>("/orders", data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] })
      qc.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}
