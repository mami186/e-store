"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCategories } from "@/hooks/use-categories"
import { useCreateProduct, useCreateVariant, useCreateSubVariant } from "@/hooks/use-seller-products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

interface VariantForm {
  _key: string
  variant_name: string
  sku: string
  price: string
  stock: string
  subvariants: SubVariantForm[]
}

interface SubVariantForm {
  _key: string
  subvariant_name: string
  sku: string
  price: string
  stock: string
}

let keyCounter = 0
const newKey = () => `k_${++keyCounter}`

export default function NewProductPage() {
  const router = useRouter()
  const { data: categories } = useCategories()
  const createProduct = useCreateProduct()
  const createVariant = useCreateVariant()
  const createSubVariant = useCreateSubVariant()

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [categoryId, setCategoryId] = useState<number | "">("")
  const [variants, setVariants] = useState<VariantForm[]>([])

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        _key: newKey(),
        variant_name: "",
        sku: "",
        price: "",
        stock: "0",
        subvariants: [],
      },
    ])
  }

  const updateVariant = (key: string, field: string, value: string) => {
    setVariants(
      variants.map((v) => (v._key === key ? { ...v, [field]: value } : v)),
    )
  }

  const removeVariant = (key: string) => {
    setVariants(variants.filter((v) => v._key !== key))
  }

  const addSubVariant = (vkey: string) => {
    setVariants(
      variants.map((v) =>
        v._key === vkey
          ? {
              ...v,
              subvariants: [
                ...v.subvariants,
                { _key: newKey(), subvariant_name: "", sku: "", price: "", stock: "0" },
              ],
            }
          : v,
      ),
    )
  }

  const updateSubVariant = (vkey: string, skey: string, field: string, value: string) => {
    setVariants(
      variants.map((v) =>
        v._key === vkey
          ? {
              ...v,
              subvariants: v.subvariants.map((s) =>
                s._key === skey ? { ...s, [field]: value } : s,
              ),
            }
          : v,
      ),
    )
  }

  const removeSubVariant = (vkey: string, skey: string) => {
    setVariants(
      variants.map((v) =>
        v._key === vkey
          ? { ...v, subvariants: v.subvariants.filter((s) => s._key !== skey) }
          : v,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const product = await createProduct.mutateAsync({
      name,
      short_description: shortDescription || undefined,
      long_description: longDescription || undefined,
      category_id: categoryId || undefined,
    })

    for (const v of variants) {
      const variant = await createVariant.mutateAsync({
        productId: product.id,
        data: {
          sku: v.sku,
          variant_name: v.variant_name,
          price: parseFloat(v.price),
          stock: parseInt(v.stock) || 0,
        },
      })

      for (const s of v.subvariants) {
        await createSubVariant.mutateAsync({
          productId: product.id,
          variantId: variant.id,
          data: {
            sku: s.sku,
            subvariant_name: s.subvariant_name,
            price: s.price ? parseFloat(s.price) : undefined,
            stock: parseInt(s.stock) || 0,
          },
        })
      }
    }

    router.push("/seller/products")
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-6">New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Product name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variants</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-1" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {variants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add at least one variant (e.g., Size, Color).
              </p>
            )}

            {variants.map((v, vi) => (
              <div key={v._key} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variant {vi + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => removeVariant(v._key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Variant name *</Label>
                    <Input
                      required
                      value={v.variant_name}
                      onChange={(e) => updateVariant(v._key, "variant_name", e.target.value)}
                      placeholder="e.g. Size"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>SKU</Label>
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(v._key, "sku", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={v.price}
                      onChange={(e) => updateVariant(v._key, "price", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariant(v._key, "stock", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Sub-variants
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => addSubVariant(v._key)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {v.subvariants.map((s, si) => (
                    <div key={s._key} className="grid grid-cols-5 gap-2 items-end">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          size={1}
                          value={s.subvariant_name}
                          onChange={(e) => updateSubVariant(v._key, s._key, "subvariant_name", e.target.value)}
                          placeholder="Small"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">SKU</Label>
                        <Input
                          size={1}
                          value={s.sku}
                          onChange={(e) => updateSubVariant(v._key, s._key, "sku", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          size={1}
                          type="number"
                          step="0.01"
                          value={s.price}
                          onChange={(e) => updateSubVariant(v._key, s._key, "price", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => removeSubVariant(v._key, s._key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={createProduct.isPending}>
            {createProduct.isPending ? "Creating..." : "Create Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/seller/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
