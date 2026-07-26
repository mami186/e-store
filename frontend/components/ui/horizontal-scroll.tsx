"use client"

import { useRef, useState, useEffect, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HorizontalScrollProps {
  children: ReactNode
  className?: string
}

export function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      observer.disconnect()
    }
  }, [children])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(":scope > *")?.clientWidth ?? 200
    const gap = 16
    const scrollAmount = cardWidth + gap
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-background/80 shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <div
        ref={scrollRef}
        className={cn("flex gap-4 overflow-x-auto scroll-smooth", className)}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-background/80 shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  )
}
