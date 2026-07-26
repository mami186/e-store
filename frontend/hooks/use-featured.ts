import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { FeaturedItemResponse } from "@/lib/types"

export function useFeatured() {
  return useQuery<FeaturedItemResponse[]>({
    queryKey: ["featured"],
    queryFn: async () => {
      const res = await apiClient.get<FeaturedItemResponse[]>("/featured")
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
