import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { ProductListItem, ProductResponse, ProductFilters } from "@/lib/types"

const DEFAULT_LIMIT = 10

export function useProducts(filters: ProductFilters = {}) {
  const buildParams = (skip: number) => {
    const params = new URLSearchParams()
    params.set("skip", String(skip))
    params.set("limit", String(filters.limit ?? DEFAULT_LIMIT))
    if (filters.q) params.set("q", filters.q)
    if (filters.category_id) params.set("category_id", String(filters.category_id))
    if (filters.seller_id) params.set("seller_id", String(filters.seller_id))
    if (filters.sort_by) params.set("sort_by", filters.sort_by)
    if (filters.order) params.set("order", filters.order)
    if (filters.min_price !== undefined) params.set("min_price", String(filters.min_price))
    if (filters.max_price !== undefined) params.set("max_price", String(filters.max_price))
    return params
  }

  return useInfiniteQuery<ProductListItem[]>({
    queryKey: ["products", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = buildParams(pageParam as number)
      const res = await apiClient.get<ProductListItem[]>(`/products?${params}`)
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const limit = filters.limit ?? DEFAULT_LIMIT
      if (lastPage.length < limit) return undefined
      return (lastPageParam as number) + limit
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
