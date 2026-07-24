import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { ProductListItem, ProductResponse, ProductFilters } from "@/lib/types"

export function useProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.category) params.set("category", filters.category)
  if (filters.seller_id) params.set("seller_id", String(filters.seller_id))
  if (filters.sort_by) params.set("sort_by", filters.sort_by)
  if (filters.order) params.set("order", filters.order)
  if (filters.skip) params.set("skip", String(filters.skip))
  if (filters.limit) params.set("limit", String(filters.limit))

  return useQuery<ProductListItem[]>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const res = await apiClient.get<ProductListItem[]>(`/products?${params}`)
      return res.data
    },
  })
}

export function useProduct(id: number) {
  return useQuery<ProductResponse>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await apiClient.get<ProductResponse>(`/products/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}
