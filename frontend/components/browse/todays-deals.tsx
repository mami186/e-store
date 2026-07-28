"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import { useFeatured } from "@/hooks/use-featured"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function TodaysDeals() {
  const { data: featured, isLoading } = useFeatured()
  const items = featured?.slice(0, 5) ?? []

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScroll()
    el.addEventListener("scroll", updateScroll, { passive: true })
    const ro = new ResizeObserver(updateScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScroll)
      ro.disconnect()
    }
  }, [items])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(":scope > *")?.clientWidth ?? 300
    const gap = 16
    el.scrollBy({ left: dir === "left" ? -(cardWidth + gap) : cardWidth + gap, behavior: "smooth" })
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-64 min-w-[calc((100%-32px)/3)] rounded-lg" />
        ))}
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Today&apos;s Deals</h2>
      <div className="relative">
        {/* Nav buttons — md+ only */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-full bg-background/80 shadow-sm border border-border hover:bg-background transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 size-10 items-center justify-center rounded-full bg-background/80 shadow-sm border border-border hover:bg-background transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-5" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => {
            const product = item.product
            const variant = item.variant
            const imageUrl = product?.main_image ?? variant?.image ?? null
            const name = product?.name ?? variant?.name ?? "Unknown"
            const price = variant
              ? variant.price ?? product?.min_price
              : product?.min_price
            const href = product
              ? `/products/${product.id}`
              : variant
                ? `/products/${variant.product_id}`
                : "#"

            return (
              <Link
                key={item.id}
                href={href}
                className="min-w-[calc((100%-32px)/3)] shrink-0 group flex flex-col rounded-lg border bg-card transition-all hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <h3 className="text-sm font-medium line-clamp-2">{name}</h3>
                  {price != null && (
                    <p className="text-sm font-semibold">{formatCurrency(price)}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
