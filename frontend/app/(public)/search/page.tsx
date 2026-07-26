"use client"

import { Suspense, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import { useInView } from "@/hooks/use-in-view"
import { ProductSearchCard } from "@/components/search/product-search-card"
import { SearchFilters } from "@/components/search/search-filters"
import { SortButtons } from "@/components/search/sort-buttons"
import { Skeleton } from "@/components/ui/skeleton"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: categories } = useCategories()

  const q = searchParams.get("q") || undefined
  const categoryIdParam = searchParams.get("category_id")
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null
  const sortBy = (searchParams.get("sort_by") || undefined) as "created_at" | "name" | "rating" | undefined
  const order = (searchParams.get("order") || undefined) as "asc" | "desc" | undefined
  const minPriceParam = searchParams.get("min_price")
  const minPrice = minPriceParam ? Number(minPriceParam) : undefined
  const maxPriceParam = searchParams.get("max_price")
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProducts({
    q,
    category_id: categoryId ?? undefined,
    sort_by: sortBy,
    order,
    min_price: minPrice,
    max_price: maxPrice,
  })

  const products = data?.pages.flat() ?? []

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      router.push(`/search?${params}`)
    },
    [searchParams, router],
  )

  const handleCategoryChange = (id: number | null) => {
    updateParams({ category_id: id ? String(id) : undefined })
  }

  const handleSort = (key: string, dir: "all" | "asc" | "desc") => {
    if (dir === "all") {
      updateParams({ sort_by: undefined, order: undefined })
    } else {
      updateParams({ sort_by: key, order: dir })
    }
  }

  const handlePriceRelease = useCallback(
    (range: [number, number]) => {
      const [lo, hi] = range
      updateParams({
        min_price: lo > 0 ? String(lo) : undefined,
        max_price: hi < 10000 ? String(hi) : undefined,
      })
    },
    [updateParams],
  )

  const { ref: sentinelRef, inView: sentinelInView } = useInView(0.1)

  useEffect(() => {
    if (sentinelInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [sentinelInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const activeSort = sortBy || null
  const activeOrder = order
    ? (order as "asc" | "desc")
    : "all"

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {q ? (
        <div className="mb-6 text-sm text-muted-foreground">
          Results for <span className="font-medium text-foreground">{q}</span>
        </div>
      ) : null}

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <SearchFilters
            categories={categories ?? []}
            selectedCategory={categoryId}
            onCategoryChange={handleCategoryChange}
            priceRange={[minPrice ?? 0, maxPrice ?? 10000]}
            onPriceRelease={handlePriceRelease}
          />
        </aside>

        <div className="flex-1 space-y-4">
          <SortButtons
            options={[
              { key: "price", label: "Price" },
              { key: "name", label: "Name" },
              { key: "rating", label: "Rating" },
            ]}
            active={activeSort}
            direction={activeOrder}
            onSort={handleSort}
          />

          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-lg border p-4">
                    <Skeleton className="size-20 shrink-0 rounded-md sm:size-24" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                ))
              : products.map((product) => (
                  <ProductSearchCard key={product.id} product={product} />
                ))}
            {!isLoading && products.length === 0 && (
              <p className="py-16 text-center text-muted-foreground">No products found</p>
            )}
          </div>

          {hasNextPage && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-4"
            >
              {isFetchingNextPage && (
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 max-w-md" />
        <div className="flex gap-8">
          <div className="hidden w-56 space-y-4 md:block">
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="flex-1 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-lg border p-4">
                <Skeleton className="size-20 shrink-0 rounded-md sm:size-24" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
