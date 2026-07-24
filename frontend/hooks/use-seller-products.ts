import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import type {
  ProductListItem,
  ProductResponse,
  ProductCreate,
  ProductUpdate,
  VariantCreate,
  VariantUpdate,
  SubVariantCreate,
  SubVariantUpdate,
} from "@/lib/types"

export function useSellerProducts(sellerId: number) {
  return useQuery<ProductListItem[]>({
    queryKey: ["seller-products", sellerId],
    queryFn: async () => {
      const res = await apiClient.get<ProductListItem[]>("/products", {
        params: { seller_id: sellerId },
      })
      return res.data
    },
    enabled: !!sellerId,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      const res = await apiClient.post<ProductResponse>("/products", data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-products"] }),
  })
}

export function useUpdateProduct(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ProductUpdate) => {
      const res = await apiClient.put<ProductResponse>(`/products/${productId}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-products"] })
      qc.invalidateQueries({ queryKey: ["product", productId] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productId: number) => {
      await apiClient.delete(`/products/${productId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-products"] }),
  })
}

export function useCreateVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: number
      data: VariantCreate
    }) => {
      const res = await apiClient.post(`/products/${productId}/variants`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product"] }),
  })
}

export function useUpdateVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      data,
    }: {
      productId: number
      variantId: number
      data: VariantUpdate
    }) => {
      const res = await apiClient.put(
        `/products/${productId}/variants/${variantId}`,
        data,
      )
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product"] }),
  })
}

export function useDeleteVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
    }: {
      productId: number
      variantId: number
    }) => {
      await apiClient.delete(`/products/${productId}/variants/${variantId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product"] }),
  })
}

export function useCreateSubVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      data,
    }: {
      productId: number
      variantId: number
      data: SubVariantCreate
    }) => {
      const res = await apiClient.post(
        `/products/${productId}/variants/${variantId}/subvariants`,
        data,
      )
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product"] }),
  })
}

export function useUpdateSubVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      subvariantId,
      data,
    }: {
      productId: number
      variantId: number
      subvariantId: number
      data: SubVariantUpdate
    }) => {
      const res = await apiClient.put(
        `/products/${productId}/variants/${variantId}/subvariants/${subvariantId}`,
        data,
      )
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product"] }),
  })
}

export function useDeleteSubVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      subvariantId,
    }: {
      productId: number
      variantId: number
      subvariantId: number
    }) => {
      await apiClient.delete(
        `/products/${productId}/variants/${variantId}/subvariants/${subvariantId}`,
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product"] }),
  })
}
