"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { useProducts } from "@/hooks/use-products"
import { ProductGrid } from "@/components/products/product-grid"
import { Pagination } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LIMIT = 20

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "")

  const q = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const sortBy = (searchParams.get("sort_by") || "created_at") as "created_at" | "name"
  const order = (searchParams.get("order") || "desc") as "asc" | "desc"
  const page = parseInt(searchParams.get("page") || "1", 10)

  const skip = (page - 1) * LIMIT

  const { data: products, isLoading } = useProducts({
    q, category, sort_by: sortBy, order, skip, limit: LIMIT,
  })

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      router.push(`/search?${params}`)
    },
    [searchParams, router],
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput, page: "1" })
  }

  return (
    <>
      <div className="mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-md"
          />
        </form>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {q ? `Results for "${q}"` : category ? `Category: ${category}` : "All products"}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={`${sortBy}-${order}`}
              onValueChange={(val) => {
                if (val) {
                  const [s, o] = val.split("-")
                  updateParams({ sort_by: s, order: o, page: "1" })
                }
              }}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest</SelectItem>
                <SelectItem value="name-asc">Name: A–Z</SelectItem>
                <SelectItem value="name-desc">Name: Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ProductGrid products={products ?? []} isLoading={isLoading} />

      <div className="mt-8">
        <Pagination page={page} totalPages={10} onPageChange={(p) => updateParams({ page: String(p) })} />
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Suspense fallback={<ProductGrid products={[]} isLoading />}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
