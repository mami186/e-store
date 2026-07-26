"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategoryResponse } from "@/lib/types"
import { RangeSlider } from "@/components/ui/range-slider"

interface SearchFiltersProps {
  categories: CategoryResponse[]
  selectedCategory: number | null
  onCategoryChange: (id: number | null) => void
  priceRange: [number, number]
  onPriceRelease: (range: [number, number]) => void
}

export function SearchFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRelease,
}: SearchFiltersProps) {
  const [categoryOpen, setCategoryOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">Price Range</p>
        <RangeSlider
          min={0}
          max={10000}
          step={10}
          value={priceRange}
          onRelease={onPriceRelease}
          formatLabel={(v) => `$${v}`}
        />
      </div>

      <div>
        <button
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="flex w-full items-center justify-between text-sm font-medium"
        >
          Category
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              categoryOpen && "rotate-180",
            )}
          />
        </button>
        {categoryOpen && (
          <div className="mt-2 space-y-1">
            <label className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === null}
                onChange={() => onCategoryChange(null)}
                className="accent-primary"
              />
              All Categories
            </label>
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.id}
                  onChange={() => onCategoryChange(cat.id)}
                  className="accent-primary"
                />
                {cat.name}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
