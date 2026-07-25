import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { CategoryResponse } from "@/lib/types"

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get<CategoryResponse[]>("/categories")
      return res.data
    },
  })
}
