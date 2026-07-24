import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { AddressResponse, AddressCreate, AddressUpdate } from "@/lib/types"

export function useAddresses() {
  return useQuery<AddressResponse[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await apiClient.get<AddressResponse[]>("/orders/addresses")
      return res.data
    },
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: AddressCreate) => {
      const res = await apiClient.post<AddressResponse>("/orders/addresses", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddressUpdate }) => {
      const res = await apiClient.put<AddressResponse>(`/orders/addresses/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/orders/addresses/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  })
}
