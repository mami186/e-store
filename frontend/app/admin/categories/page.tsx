"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import {
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from "@/hooks/use-admin"
import type { CategoryResponse, CategoryCreate, CategoryUpdate } from "@/lib/types"

export default function AdminCategoriesPage() {
  const { data: items, isLoading } = useAdminCategories()
  const createCategory = useAdminCreateCategory()
  const updateCategory = useAdminUpdateCategory()
  const deleteCategory = useAdminDeleteCategory()

  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<CategoryResponse | null>(null)
  const [deleteItem, setDeleteItem] = useState<CategoryResponse | null>(null)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 size-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <CategoryCard
              key={item.id}
              item={item}
              allItems={items}
              onEdit={() => setEditItem(item)}
              onDelete={() => setDeleteItem(item)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <FolderTree className="size-12" />
            <p>No categories yet.</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 size-4" />
              Add your first category
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        items={items ?? []}
        onSubmit={async (form) => {
          const data: CategoryCreate = {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
          }
          await createCategory.mutateAsync(data)
          setShowCreate(false)
          toast.add({ title: "Category created", type: "success" })
        }}
      />

      <EditDialog
        item={editItem}
        onClose={() => setEditItem(null)}
        items={items ?? []}
        onSubmit={async (form) => {
          if (!editItem) return
          const data: CategoryUpdate = {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
            is_active: form.is_active,
          }
          await updateCategory.mutateAsync({ id: editItem.id, data })
          setEditItem(null)
          toast.add({ title: "Category updated", type: "success" })
        }}
      />

      <DeleteConfirmDialog
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!deleteItem) return
          await deleteCategory.mutateAsync(deleteItem.id)
          setDeleteItem(null)
          toast.add({ title: "Category deleted", type: "success" })
        }}
      />
    </div>
  )
}

function CategoryCard({
  item,
  allItems,
  onEdit,
  onDelete,
}: {
  item: CategoryResponse
  allItems: CategoryResponse[]
  onEdit: () => void
  onDelete: () => void
}) {
  const parent = item.parent_id ? allItems.find((c) => c.id === item.parent_id) : null

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FolderTree className="size-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{item.name}</p>
            {parent && (
              <span className="truncate text-xs text-muted-foreground">
                — in {parent.name}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            /{item.slug}
            {item.description && <> — {item.description}</>}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Created {formatDate(item.created_at)}
          </p>
        </div>

        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
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

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

type CategoryFormData = {
  name: string
  slug: string
  description: string
  parent_id: string
  is_active: boolean
}

function CategoryForm({
  defaults,
  items,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaults?: CategoryFormData & { id: number }
  items: CategoryResponse[]
  onSubmit: (data: CategoryFormData) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [name, setName] = useState(defaults?.name ?? "")
  const [slug, setSlug] = useState(defaults?.slug ?? "")
  const [description, setDescription] = useState(defaults?.description ?? "")
  const [parentId, setParentId] = useState(defaults?.parent_id ?? "")
  const [isActive, setIsActive] = useState(defaults?.is_active ?? true)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManuallyEdited) setSlug(slugify(val))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, slug, description, parent_id: parentId, is_active: isActive })
  }

  const filteredItems = defaults
    ? items.filter((c) => c.id !== defaults.id)
    : items

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true) }} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Parent Category</Label>
        <Select value={parentId} onValueChange={(val) => setParentId(val ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="None (top-level)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None (top-level)</SelectItem>
            {filteredItems.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {defaults !== undefined && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded border" />
          <Label htmlFor="is-active" className="cursor-pointer">Active</Label>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!name || !slug}>{submitLabel}</Button>
      </DialogFooter>
    </form>
  )
}

function CreateDialog({
  open,
  onClose,
  items,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  items: CategoryResponse[]
  onSubmit: (data: CategoryFormData) => void
}) {
  const [key, setKey] = useState(0)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setKey((k) => k + 1); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        <CategoryForm
          key={key}
          items={items}
          onSubmit={onSubmit}
          onCancel={() => { setKey((k) => k + 1); onClose() }}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({
  item,
  onClose,
  items,
  onSubmit,
}: {
  item: CategoryResponse | null
  onClose: () => void
  items: CategoryResponse[]
  onSubmit: (data: CategoryFormData) => void
}) {
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (item) setKey((k) => k + 1)
  }, [item])

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        {item && (
          <CategoryForm
            key={key}
            defaults={{
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description ?? "",
              parent_id: item.parent_id ? String(item.parent_id) : "",
              is_active: item.is_active,
            }}
            items={items}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitLabel="Save"
          />
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
  item: CategoryResponse | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{item?.name}</strong>? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
