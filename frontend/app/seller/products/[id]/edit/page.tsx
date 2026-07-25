"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useProduct } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import {
  useUpdateProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useCreateSubVariant,
  useUpdateSubVariant,
  useDeleteSubVariant,
} from "@/hooks/use-seller-products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, Save } from "lucide-react"

let keyCounter = 0
const newKey = () => `k_${++keyCounter}`

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const productId = parseInt(id)
  const router = useRouter()
  const { data: product, isLoading } = useProduct(productId)
  const { data: categories } = useCategories()
  const updateProduct = useUpdateProduct(productId)
  const createVariant = useCreateVariant()
  const updateVariant = useUpdateVariant()
  const deleteVariant = useDeleteVariant()
  const createSubVariant = useCreateSubVariant()
  const updateSubVariant = useUpdateSubVariant()
  const deleteSubVariant = useDeleteSubVariant()

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [categoryId, setCategoryId] = useState<number | "">("")
  const [status, setStatus] = useState("draft")
  const [loaded, setLoaded] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!product) {
    return <div className="p-6 text-muted-foreground">Product not found</div>
  }

  if (!loaded) {
    setName(product.name)
    setShortDescription(product.short_description || "")
    setLongDescription(product.long_description || "")
    setCategoryId(product.category?.id ?? "")
    setStatus(product.status)
    setLoaded(true)
  }

  const handleSaveProduct = async () => {
    await updateProduct.mutateAsync({
      name: name || undefined,
      short_description: shortDescription || undefined,
      long_description: longDescription || undefined,
      category_id: categoryId || undefined,
      status: status as "draft" | "published" | "archived" | undefined,
    })
  }

  const handleAddVariant = async () => {
    await createVariant.mutateAsync({
      productId,
      data: { sku: "", variant_name: "New Variant", price: 0, stock: 0 },
    })
  }

  const [editSubForm, setEditSubForm] = useState<Record<string, string>>({})

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Button onClick={handleSaveProduct} disabled={updateProduct.isPending}>
          <Save className="h-4 w-4 mr-1" />
          {updateProduct.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Product name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Short Description</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                rows={3}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Long Description</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                rows={6}
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : "")}
              >
                <option value="">None</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variants</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={handleAddVariant}>
              <Plus className="h-4 w-4 mr-1" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {product.variants?.length === 0 && (
              <p className="text-sm text-muted-foreground">No variants yet.</p>
            )}

            <Button variant="outline" size="sm" onClick={() => router.push(`/seller/products/${productId}/images`)}>
              Manage Images
            </Button>

            <Separator />

            {product.variants?.map((v, vi) => (
              <div
                key={v.id}
                className="rounded-lg border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variant {vi + 1}: {v.variant_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => {
                      if (confirm("Delete this variant?")) {
                        deleteVariant.mutate({ productId, variantId: v.id })
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={editSubForm[`v_${v.id}_name`] ?? v.variant_name}
                      onChange={(e) =>
                        setEditSubForm({ ...editSubForm, [`v_${v.id}_name`]: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>SKU</Label>
                    <Input
                      value={editSubForm[`v_${v.id}_sku`] ?? v.sku}
                      onChange={(e) =>
                        setEditSubForm({ ...editSubForm, [`v_${v.id}_sku`]: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editSubForm[`v_${v.id}_price`] ?? v.price}
                      onChange={(e) =>
                        setEditSubForm({ ...editSubForm, [`v_${v.id}_price`]: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={editSubForm[`v_${v.id}_stock`] ?? v.stock}
                      onChange={(e) =>
                        setEditSubForm({ ...editSubForm, [`v_${v.id}_stock`]: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await updateVariant.mutateAsync({
                      productId,
                      variantId: v.id,
                      data: {
                        variant_name: editSubForm[`v_${v.id}_name`] ?? v.variant_name,
                        sku: editSubForm[`v_${v.id}_sku`] ?? v.sku,
                        price: parseFloat(editSubForm[`v_${v.id}_price`] ?? String(v.price)),
                        stock: parseInt(editSubForm[`v_${v.id}_stock`] ?? String(v.stock)),
                      },
                    })
                    const clean = { ...editSubForm }
                    delete clean[`v_${v.id}_name`]
                    delete clean[`v_${v.id}_sku`]
                    delete clean[`v_${v.id}_price`]
                    delete clean[`v_${v.id}_stock`]
                    setEditSubForm(clean)
                  }}
                >
                  Save Variant
                </Button>

                <Separator />

                {/* Subvariants */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Sub-variants</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={async () => {
                        await createSubVariant.mutateAsync({
                          productId,
                          variantId: v.id,
                          data: { sku: "", subvariant_name: "New", stock: 0 },
                        })
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {v.subvariants?.map((s) => (
                    <div key={s.id} className="grid grid-cols-5 gap-2 items-end">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          size={1}
                          value={editSubForm[`sv_${s.id}_name`] ?? s.subvariant_name}
                          onChange={(e) =>
                            setEditSubForm({ ...editSubForm, [`sv_${s.id}_name`]: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">SKU</Label>
                        <Input
                          size={1}
                          value={editSubForm[`sv_${s.id}_sku`] ?? s.sku}
                          onChange={(e) =>
                            setEditSubForm({ ...editSubForm, [`sv_${s.id}_sku`]: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          size={1}
                          type="number"
                          step="0.01"
                          value={editSubForm[`sv_${s.id}_price`] ?? (s.effective_price !== s.price ? s.effective_price : s.price || "")}
                          onChange={(e) =>
                            setEditSubForm({ ...editSubForm, [`sv_${s.id}_price`]: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={async () => {
                            await updateSubVariant.mutateAsync({
                              productId,
                              variantId: v.id,
                              subvariantId: s.id,
                              data: {
                                subvariant_name: editSubForm[`sv_${s.id}_name`] ?? s.subvariant_name,
                                sku: editSubForm[`sv_${s.id}_sku`] ?? s.sku,
                                price: editSubForm[`sv_${s.id}_price`]
                                  ? parseFloat(editSubForm[`sv_${s.id}_price`])
                                  : undefined,
                              },
                            })
                            const clean = { ...editSubForm }
                            delete clean[`sv_${s.id}_name`]
                            delete clean[`sv_${s.id}_sku`]
                            delete clean[`sv_${s.id}_price`]
                            setEditSubForm(clean)
                          }}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => {
                            if (confirm("Delete this subvariant?")) {
                              deleteSubVariant.mutate({
                                productId,
                                variantId: v.id,
                                subvariantId: s.id,
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/seller/products")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
