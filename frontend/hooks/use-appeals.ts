import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type { AppealResponse, AppealCreate } from "@/lib/types"

export function useAppeals() {
  return useQuery<AppealResponse[]>({
    queryKey: ["appeals"],
    queryFn: async () => {
      const res = await apiClient.get<AppealResponse[]>("/auth/appeals")
      return res.data
    },
  })
}

export function useCreateAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: AppealCreate) => {
      const res = await apiClient.post<AppealResponse>("/auth/appeals", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appeals"] }),
  })
}
