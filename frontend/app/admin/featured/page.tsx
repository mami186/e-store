"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, RefreshCw, Pencil, Trash2, ImageOff } from "lucide-react"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import {
  useAdminFeatured,
  useAdminCreateFeatured,
  useAdminUpdateFeatured,
  useAdminDeleteFeatured,
  useAdminRefreshFeatured,
} from "@/hooks/use-admin"
import type { FeaturedItemResponse, ProductListItem, ProductVariantResponse } from "@/lib/types"

function toLocalDatetimeString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toUtcIso(localStr: string) {
  return new Date(localStr).toISOString()
}

export default function AdminFeaturedPage() {
  const { data: items, isLoading } = useAdminFeatured()
  const createFeatured = useAdminCreateFeatured()
  const updateFeatured = useAdminUpdateFeatured()
  const deleteFeatured = useAdminDeleteFeatured()
  const refreshFeatured = useAdminRefreshFeatured()

  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<FeaturedItemResponse | null>(null)
  const [deleteItem, setDeleteItem] = useState<FeaturedItemResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshFeatured.mutateAsync()
      toast.add({ title: "Featured items refreshed", type: "success" })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Featured Items</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-1 size-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 size-4" />
            Add Featured
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <FeaturedItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => setDeleteItem(item)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <p>No featured items yet.</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 size-4" />
              Add your first featured item
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (data) => {
          await createFeatured.mutateAsync(data)
          setShowCreate(false)
          toast.add({ title: "Featured item created", type: "success" })
        }}
      />

      <EditDialog
        item={editItem}
        onClose={() => setEditItem(null)}
        onSubmit={async (data) => {
          if (!editItem) return
          await updateFeatured.mutateAsync({ id: editItem.id, data })
          setEditItem(null)
          toast.add({ title: "Featured item updated", type: "success" })
        }}
      />

      <DeleteConfirmDialog
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!deleteItem) return
          await deleteFeatured.mutateAsync(deleteItem.id)
          setDeleteItem(null)
          toast.add({ title: "Featured item deleted", type: "success" })
        }}
      />
    </div>
  )
}

function FeaturedItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FeaturedItemResponse
  onEdit: () => void
  onDelete: () => void
}) {
  const imageUrl = item.product?.main_image ?? item.variant?.image ?? null
  const displayName = item.product?.name ?? item.variant?.name ?? "Unknown"
  const subtitle = item.variant ? item.variant.product_name : null
  const now = Date.now()
  const start = new Date(item.start_date).getTime()
  const end = new Date(item.end_date).getTime()
  const isActive = item.is_active && start <= now && end >= now

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <span className="w-8 text-center text-sm font-medium text-muted-foreground">
          #{item.position}
        </span>

        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(item.start_date)} – {formatDate(item.end_date)}
          </p>
        </div>

        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: { product_id?: number; variant_id?: number; position?: number; start_date: string; end_date: string }) => void
}) {
  const [type, setType] = useState<"product" | "variant">("product")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [position, setPosition] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchResults, isLoading: searching } = useQuery<ProductListItem[]>({
    queryKey: ["admin", "product-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return []
      const res = await apiClient.get<ProductListItem[]>("/products", {
        params: { q: debouncedQuery, limit: 5 },
      })
      return res.data
    },
    enabled: debouncedQuery.trim().length > 0,
  })

  const { data: productDetail } = useQuery<{ variants: ProductVariantResponse[] }>({
    queryKey: ["admin", "product-detail", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return { variants: [] }
      const res = await apiClient.get(`/products/${selectedProduct.id}`)
      return res.data
    },
    enabled: !!selectedProduct && type === "variant",
  })

  const resetForm = () => {
    setType("product")
    setSearchQuery("")
    setDebouncedQuery("")
    setSelectedProduct(null)
    setSelectedVariantId("")
    setPosition("")
    setStartDate("")
    setEndDate("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    if (type === "product" && !selectedProduct) return
    if (type === "variant" && (!selectedProduct || !selectedVariantId)) return

    const data: { product_id?: number; variant_id?: number; position?: number; start_date: string; end_date: string } = {
      start_date: toUtcIso(startDate),
      end_date: toUtcIso(endDate),
    }

    if (position) data.position = parseInt(position, 10)
    if (type === "product") {
      data.product_id = selectedProduct!.id
    } else {
      data.variant_id = parseInt(selectedVariantId, 10)
    }

    await onSubmit(data)
    resetForm()
  }

  const variants = productDetail?.variants ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Featured Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup
            value={type}
            onValueChange={(v) => {
              setType(v as "product" | "variant")
              setSelectedProduct(null)
              setSelectedVariantId("")
              setSearchQuery("")
            }}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="product" id="type-product" />
              <Label htmlFor="type-product">Feature a Product</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="variant" id="type-variant" />
              <Label htmlFor="type-variant">Feature a Variant</Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label>{type === "variant" ? "Search Product (to pick a variant from)" : "Search Product"}</Label>
            <Input
              placeholder="Type product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {debouncedQuery && (
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {searching ? (
                  <p className="p-2 text-sm text-muted-foreground">Searching...</p>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                        selectedProduct?.id === p.id ? "bg-muted font-medium" : ""
                      }`}
                      onClick={() => {
                        setSelectedProduct(p)
                        setSelectedVariantId("")
                      }}
                    >
                      {p.main_image && (
                        <img src={p.main_image} alt="" className="size-8 rounded object-cover" />
                      )}
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="p-2 text-sm text-muted-foreground">No products found</p>
                )}
              </div>
            )}
            {selectedProduct && (
              <p className="text-xs text-green-600">
                Selected: {selectedProduct.name}
              </p>
            )}
          </div>

          {type === "variant" && selectedProduct && (
            <div className="space-y-2">
              <Label>Variant</Label>
              <Select value={selectedVariantId} onValueChange={(val) => setSelectedVariantId(val ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.variant_name} — ${v.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Position (optional — auto-assigns to last)</Label>
            <Input
              type="number"
              min={1}
              placeholder="Leave empty for last position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={!startDate || !endDate || (type === "product" && !selectedProduct) || (type === "variant" && (!selectedProduct || !selectedVariantId))}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({
  item,
  onClose,
  onSubmit,
}: {
  item: FeaturedItemResponse | null
  onClose: () => void
  onSubmit: (data: { position?: number; start_date?: string; end_date?: string }) => void
}) {
  const [position, setPosition] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (!item) return
    setPosition(String(item.position))
    setStartDate(toLocalDatetimeString(new Date(item.start_date)))
    setEndDate(toLocalDatetimeString(new Date(item.end_date)))
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    const data: { position?: number; start_date?: string; end_date?: string } = {}
    if (position) data.position = parseInt(position, 10)
    if (startDate) data.start_date = toUtcIso(startDate)
    if (endDate) data.end_date = toUtcIso(endDate)
    onSubmit(data)
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Featured Item</DialogTitle>
        </DialogHeader>
        {item && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                type="number"
                min={1}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: FeaturedItemResponse | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Featured Item</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this featured item? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
