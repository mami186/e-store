import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type {
  UserResponse,
  SellerResponse,
  ProductListItem,
  OrderResponse,
  CommentResponse,
  ReportResponse,
  RestrictionReasonResponse,
  RestrictionReasonCreate,
  RestrictionResponse,
  CreateRestrictionRequest,
  AppealResponse,
  AdminProductImageResponse,
  FeaturedItemResponse,
  FeaturedItemCreate,
  FeaturedItemUpdate,
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
} from "@/lib/types"

// ─── Users ───
export function useAdminUsers(skip = 0, limit = 50) {
  return useQuery<UserResponse[]>({
    queryKey: ["admin", "users", { skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<UserResponse[]>("/admin/users", {
        params: { skip, limit },
      })
      return res.data
    },
  })
}

export function useAdminSetUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      await apiClient.put(`/admin/users/${userId}/role`, null, {
        params: { role_id: roleId },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  })
}

export function useAdminToggleUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      await apiClient.put(`/admin/users/${userId}/status`, null, {
        params: { is_active: isActive },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/admin/users/${userId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  })
}

// ─── Sellers ───
export function useAdminSellers(
  verificationStatus?: string,
  skip = 0,
  limit = 50,
) {
  return useQuery<SellerResponse[]>({
    queryKey: ["admin", "sellers", { verificationStatus, skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<SellerResponse[]>("/admin/sellers", {
        params: { verification_status: verificationStatus || undefined, skip, limit },
      })
      return res.data
    },
  })
}

export function useAdminVerifySeller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      await apiClient.put(`/admin/sellers/${userId}/verify`, null, {
        params: { status },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sellers"] }),
  })
}

// ─── Products ───
export function useAdminProducts(status?: string, skip = 0, limit = 50) {
  return useQuery<ProductListItem[]>({
    queryKey: ["admin", "products", { status, skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<ProductListItem[]>("/admin/products", {
        params: { status: status || undefined, skip, limit },
      })
      return res.data
    },
  })
}

export function useAdminUpdateProductStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, status }: { productId: number; status: string }) => {
      await apiClient.put(`/admin/products/${productId}/status`, null, {
        params: { status },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  })
}

// ─── Orders ───
export function useAdminOrders(status?: string, skip = 0, limit = 50) {
  return useQuery<OrderResponse[]>({
    queryKey: ["admin", "orders", { status, skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<OrderResponse[]>("/admin/orders", {
        params: { status: status || undefined, skip, limit },
      })
      return res.data
    },
  })
}

export function useAdminUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiClient.put(`/admin/orders/${orderId}/status`, null, {
        params: { status },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  })
}

// ─── Comments ───
export function useAdminComments(status?: string, skip = 0, limit = 50) {
  return useQuery<CommentResponse[]>({
    queryKey: ["admin", "comments", { status, skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<CommentResponse[]>("/admin/comments", {
        params: { status: status || undefined, skip, limit },
      })
      return res.data
    },
  })
}

export function useAdminUpdateCommentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: number; status: string }) => {
      await apiClient.put(`/admin/comments/${commentId}/status`, null, {
        params: { status },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "comments"] }),
  })
}

// ─── Reports ───
export function useAdminReports(status?: string, skip = 0, limit = 50) {
  return useQuery<ReportResponse[]>({
    queryKey: ["admin", "reports", { status, skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<ReportResponse[]>("/admin/reports", {
        params: { status: status || undefined, skip, limit },
      })
      return res.data
    },
  })
}

export function useAdminUpdateReportStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      await apiClient.put(`/admin/reports/${reportId}/status`, null, {
        params: { status },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  })
}

// ─── Restriction Reasons ───
export function useAdminRestrictionReasons() {
  return useQuery<RestrictionReasonResponse[]>({
    queryKey: ["admin", "restriction-reasons"],
    queryFn: async () => {
      const res = await apiClient.get<RestrictionReasonResponse[]>(
        "/admin/restriction-reasons",
      )
      return res.data
    },
  })
}

export function useAdminCreateRestrictionReason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RestrictionReasonCreate) => {
      const res = await apiClient.post<RestrictionReasonResponse>(
        "/admin/restriction-reasons",
        data,
      )
      return res.data
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "restriction-reasons"] }),
  })
}

// ─── Restrictions ───
export function useAdminRestrictions(
  status?: string,
  userId?: number,
  skip = 0,
  limit = 50,
) {
  return useQuery<RestrictionResponse[]>({
    queryKey: ["admin", "restrictions", { status, userId, skip, limit }],
    queryFn: async () => {
      const res = await apiClient.get<RestrictionResponse[]>("/admin/restrictions", {
        params: {
          status: status || undefined,
          user_id: userId || undefined,
          skip,
          limit,
        },
      })
      return res.data
    },
  })
}

export function useAdminRestrictUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number
      data: CreateRestrictionRequest
    }) => {
      const res = await apiClient.post(`/admin/users/${userId}/restrict`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "restrictions"] })
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })
}

export function useAdminLiftRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (restrictionId: number) => {
      await apiClient.put(`/admin/restrictions/${restrictionId}/lift`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "restrictions"] }),
  })
}

// ─── Appeals ───
export function useAdminAppeals() {
  return useQuery<AppealResponse[]>({
    queryKey: ["admin", "appeals"],
    queryFn: async () => {
      const res = await apiClient.get<AppealResponse[]>(
        `/auth/appeals`,
      )
      return res.data
    },
  })
}

export function useAdminReviewAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ appealId, status }: { appealId: number; status: string }) => {
      await apiClient.post(`/admin/appeals/${appealId}/review`, null, {
        params: { status },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "appeals"] }),
  })
}

// ─── Images ───
export function useAdminImages(
  params?: { isDeleted?: boolean; productId?: number },
) {
  return useQuery<AdminProductImageResponse[]>({
    queryKey: ["admin", "images", params],
    queryFn: async () => {
      const res = await apiClient.get<AdminProductImageResponse[]>(
        "/admin/products/images",
        {
          params: {
            is_deleted: params?.isDeleted,
            product_id: params?.productId,
          },
        },
      )
      return res.data
    },
  })
}

export function useAdminRestoreImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: number) => {
      await apiClient.put(`/admin/products/images/${imageId}/restore`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "images"] }),
  })
}

// ─── Featured Items ───

export function useAdminFeatured() {
  return useQuery<FeaturedItemResponse[]>({
    queryKey: ["admin", "featured"],
    queryFn: async () => {
      const res = await apiClient.get<FeaturedItemResponse[]>("/admin/featured")
      return res.data
    },
  })
}

export function useAdminCreateFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: FeaturedItemCreate) => {
      const res = await apiClient.post<FeaturedItemResponse>("/admin/featured", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "featured"] }),
  })
}

export function useAdminUpdateFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FeaturedItemUpdate }) => {
      const res = await apiClient.put<FeaturedItemResponse>(`/admin/featured/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "featured"] }),
  })
}

export function useAdminDeleteFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/featured/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "featured"] }),
  })
}

export function useAdminRefreshFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/admin/featured/refresh")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "featured"] }),
  })
}

export function useAdminCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await apiClient.get<CategoryResponse[]>("/categories/all")
      return res.data
    },
  })
}

export function useAdminCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CategoryCreate) => {
      const res = await apiClient.post<CategoryResponse>("/categories", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  })
}

export function useAdminUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryUpdate }) => {
      const res = await apiClient.put<CategoryResponse>(`/categories/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  })
}

export function useAdminDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/categories/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  })
}
