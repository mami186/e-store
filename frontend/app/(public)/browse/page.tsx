"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { X, ChevronDown, ImageOff, Filter, RotateCcw, Star } from "lucide-react"
import type { FeaturedItemResponse } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, useCarousel } from "@/components/ui/carousel"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import { useFeatured } from "@/hooks/use-featured"
import { useInView } from "@/hooks/use-in-view"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { RangeSlider } from "@/components/ui/range-slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: categories } = useCategories()
  const { data: featured, isLoading: featuredLoading } = useFeatured()

  const sortBy = (searchParams.get("sort_by") || undefined) as "created_at" | "name" | undefined
  const order = (searchParams.get("order") || undefined) as "asc" | "desc" | undefined
  const categoryIdParam = searchParams.get("category_id")
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null
  const minPriceParam = searchParams.get("min_price")
  const minPrice = minPriceParam ? Number(minPriceParam) : undefined
  const maxPriceParam = searchParams.get("max_price")
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined

  // ── Local filter state (no backend) ──
  const [certified, setCertified] = useState(false)
  const [discounts, setDiscounts] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProducts({
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
      router.push(`/browse?${params}`)
    },
    [searchParams, router],
  )

  const handleCategoryChange = (id: number | null) => {
    updateParams({ category_id: id ? String(id) : undefined })
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

  const handleSortChange = (value: string) => {
    switch (value) {
      case "all":
        updateParams({ sort_by: undefined, order: undefined })
        break
      case "new":
        updateParams({ sort_by: "created_at", order: "desc" })
        break
      case "alphabetical":
        updateParams({ sort_by: "name", order: "asc" })
        break
    }
  }

  const getShowValue = () => {
    if (!sortBy && !order) return "all"
    if (sortBy === "created_at" && order === "desc") return "new"
    if (sortBy === "name" && order === "asc") return "alphabetical"
    return "all"
  }

  const resetFilters = () => {
    setCertified(false)
    setDiscounts([])
    setConditions([])
    router.push("/browse")
  }

  const activeFilterCount = [categoryId, minPrice, maxPrice, certified ? 1 : null, ...discounts, ...conditions].filter(Boolean).length

  const { ref: sentinelRef, inView: sentinelInView } = useInView(0.1)

  useEffect(() => {
    if (sentinelInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [sentinelInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const selectedCategory = categoryId
    ? categories?.find((c) => c.id === categoryId)
    : null

  const featuredItems = featured?.slice(0, 5) ?? []

  // ── Collapsible sections ──
  const [categoryOpen, setCategoryOpen] = useState(true)
  const [discountOpen, setDiscountOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [conditionOpen, setConditionOpen] = useState(true)

  return (
    <>
      <TodaysDealsSection items={featuredItems} isLoading={featuredLoading} />

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div className="flex gap-8">
        {/* Right Sidebar Filters */}
        <aside className="hidden w-64 shrink-0 md:block order-last">
          <div className="space-y-6">
            {/* Filter header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium inline-flex items-center gap-1.5">
                <Filter className="size-4" />
                Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex w-full items-center justify-between text-sm font-medium"
              >
                Category
                <ChevronDown className={cn("h-4 w-4 transition-transform", categoryOpen && "rotate-180")} />
              </button>
              {categoryOpen && (
                <div className="mt-2 space-y-1">
                  <label className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer">
                    <input
                      type="radio"
                      name="browse-category"
                      checked={categoryId === null}
                      onChange={() => handleCategoryChange(null)}
                      className="accent-primary"
                    />
                    All Categories
                  </label>
                  {(categories ?? []).map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer">
                      <input
                        type="radio"
                        name="browse-category"
                        checked={categoryId === cat.id}
                        onChange={() => handleCategoryChange(cat.id)}
                        className="accent-primary"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Estore Certified */}
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span>Estore Certified</span>
              <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)} className="accent-primary" />
            </label>

            {/* Price */}
            <div>
              <button
                onClick={() => setPriceOpen(!priceOpen)}
                className="flex w-full items-center justify-between text-sm font-medium"
              >
                Price
                <ChevronDown className={cn("h-4 w-4 transition-transform", priceOpen && "rotate-180")} />
              </button>
              {priceOpen && (
                <div className="mt-3">
                  <RangeSlider
                    min={0}
                    max={10000}
                    step={10}
                    value={[minPrice ?? 0, maxPrice ?? 10000]}
                    onRelease={handlePriceRelease}
                    formatLabel={(v) => `$${v}`}
                  />
                </div>
              )}
            </div>

            {/* Discount */}
            <div>
              <button
                onClick={() => setDiscountOpen(!discountOpen)}
                className="flex w-full items-center justify-between text-sm font-medium"
              >
                <span>Discount</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", discountOpen && "rotate-180")} />
              </button>
              {discountOpen && (
                <div className="mt-2 space-y-1 text-sm">
                  {["All Deals", "Buy More Get More", "Today's Deals"].map((label) => {
                    const checked = discounts.includes(label)
                    return (
                      <label key={label} className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setDiscounts((prev) =>
                              checked ? prev.filter((d) => d !== label) : [...prev, label],
                            )
                          }
                          className="accent-primary"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Condition */}
            <div>
              <button
                onClick={() => setConditionOpen(!conditionOpen)}
                className="flex w-full items-center justify-between text-sm font-medium"
              >
                <span>Condition</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", conditionOpen && "rotate-180")} />
              </button>
              {conditionOpen && (
                <div className="mt-2 space-y-1 text-sm">
                  {["New", "Renewed", "Used"].map((label) => {
                    const checked = conditions.includes(label)
                    return (
                      <label key={label} className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setConditions((prev) =>
                              checked ? prev.filter((c) => c !== label) : [...prev, label],
                            )
                          }
                          className="accent-primary"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1 space-y-4">
          {/* Show dropdown + chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={getShowValue()} onValueChange={(val) => handleSortChange(val ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="coming-soon">Coming Soon</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory.name}
                <button onClick={() => handleCategoryChange(null)} className="hover:text-foreground">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {certified && (
              <Badge variant="secondary" className="gap-1">
                Estore Certified
                <button onClick={() => setCertified(false)} className="hover:text-foreground">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {discounts.map((d) => (
              <Badge key={d} variant="secondary" className="gap-1">
                {d}
                <button onClick={() => setDiscounts((prev) => prev.filter((x) => x !== d))} className="hover:text-foreground">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {conditions.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1">
                {c}
                <button onClick={() => setConditions((prev) => prev.filter((x) => x !== c))} className="hover:text-foreground">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Product cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col rounded-lg border">
                    <Skeleton className="aspect-square rounded-t-lg" />
                    <div className="space-y-2 p-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
              : products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group flex flex-col rounded-lg border bg-card transition-all hover:shadow-md"
                  >
                    <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                      {product.main_image ? (
                        <img
                          src={product.main_image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 p-3">
                      <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
                      {product.avg_rating != null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3 fill-yellow-500 text-yellow-500" />
                          <span>{product.avg_rating.toFixed(1)}</span>
                          <span>({product.rating_count})</span>
                        </div>
                      )}
                      {product.min_price != null && (
                        <p className="text-sm font-semibold">
                          {product.min_price === product.max_price
                            ? formatCurrency(product.min_price)
                            : `${formatCurrency(product.min_price)} – ${formatCurrency(product.max_price!)}`}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
          </div>

          {!isLoading && products.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">No products found</p>
          )}

          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <div className="flex gap-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}

// ─── Today's Deals Component ───

function TodaysDealsSection({
  items,
  isLoading,
}: {
  items: FeaturedItemResponse[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <section className="w-full bg-neutral-950 py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-white">Today&apos;s Deals</h2>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[350px] basis-[85%] sm:basis-1/2 md:basis-1/3 xl:basis-1/4 shrink-0 rounded-xl bg-neutral-800" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="w-full bg-neutral-950 py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-white">Today&apos;s Deals</h2>
          <p className="text-sm text-neutral-400">No deals available right now.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full overflow-hidden bg-neutral-950 py-4">
      <div className="mx-auto  max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-white">Today&apos;s Deals</h2>
      </div>

      <div className="relative w-full">
        <Carousel opts={{ align: "center", loop: true }}>
          <CarouselContent className="-mx-2 md:-mx-3">
            {items.map((item, i) => (
              <CarouselItem
                key={item.id}
                className="mx-2 md:mx-5 py-8 md:py-12 basis-[85%] sm:basis-1/2 md:basis-1/3 xl:basis-1/4"
              >
                <DealCard item={item} index={i} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          <CarouselPrevious className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 size-12 items-center justify-center text-white/50 hover:text-white active:scale-100 active:translate-y-0 transition-colors duration-300 border-none bg-transparent" />
          <CarouselNext className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 size-12 items-center justify-center text-white/50 hover:text-white active:scale-100 active:translate-y-0 transition-colors duration-300 border-none bg-transparent" />

          {/* Pagination Dots */}
          <PaginationDashes />
        </Carousel>
      </div>
    </section>
  )
}

// ─── Pagination Dots ───
function PaginationDashes() {
  const { emblaApi, selectedIndex } = useCarousel()
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  useEffect(() => {
    if (!emblaApi) return
    const updateSnaps = () => setScrollSnaps(emblaApi.scrollSnapList())
    updateSnaps()
    emblaApi.on("reInit", updateSnaps)
    return () => {
      emblaApi.off("reInit", updateSnaps)
    }
  }, [emblaApi])

  if (scrollSnaps.length <= 1) return null

  return (
    <div className="flex justify-center items-center gap-3 mt-8">
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          onClick={() => emblaApi?.scrollTo(index)}
          className={cn(
            "size-2 rounded-full transition-all duration-300",
            index === selectedIndex
              ? "bg-white border-white"
              : "border border-white/30 bg-transparent hover:border-white/60"
          )}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  )
}

// ─── Deal Card (PlayStation-style) ───
function DealCard({ item, index }: { item: FeaturedItemResponse; index: number }) {
  const { selectedIndex } = useCarousel()
  const isActive = index === selectedIndex
  const product = item.product
  const variant = item.variant
  const image = variant?.image ?? product?.main_image ?? null
  const name = product?.name ?? variant?.name ?? "Product"
  const linkHref = variant ? `/products/${variant.product_id}` : product ? `/products/${product.id}` : "#"

  return (
    <Link
      href={linkHref}
      data-active={isActive ? true : undefined}
      className={cn(
        "block rounded-xl overflow-hidden transition-all duration-500 bg-neutral-900",
        "opacity-60 hover:scale-[1.02] data-[active=true]:opacity-100 data-[active=true]:scale-[1.05] data-[active=true]:hover:scale-[1.08]"
      )}
    >
      <div className="aspect-square bg-neutral-800">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-600">
            <ImageOff className="size-10" />
          </div>
        )}
      </div>
    </Link>
  )
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-4">
          <Skeleton className="h-8 max-w-sm" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-64 min-w-[calc((100%-32px)/3)] rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  )
}