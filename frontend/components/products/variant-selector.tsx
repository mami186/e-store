"use client"

import { useState, useMemo } from "react"
import type { ProductVariantResponse, SubVariantResponse } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"

interface VariantSelectorProps {
  variants: ProductVariantResponse[]
  onSelect: (subvariant: SubVariantResponse) => void
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [selectedSubVariantId, setSelectedSubVariantId] = useState<number | null>(null)

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0]
  const subvariants = selectedVariant?.subvariants || []

  const handleVariantClick = (v: ProductVariantResponse) => {
    setSelectedVariantId(v.id)
    setSelectedSubVariantId(null)
    if (v.subvariants.length === 1) {
      setSelectedSubVariantId(v.subvariants[0].id)
      onSelect(v.subvariants[0])
    }
  }

  const handleSubVariantClick = (sv: SubVariantResponse) => {
    setSelectedSubVariantId(sv.id)
    onSelect(sv)
  }

  return (
    <div className="space-y-4">
      {variants.map((v) => (
        <div key={v.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{v.variant_name}</span>
            <span className="text-sm text-muted-foreground">{formatCurrency(v.price)}</span>
          </div>
          {v.subvariants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {v.subvariants.map((sv) => (
                <button
                  key={sv.id}
                  onClick={() => {
                    handleVariantClick(v)
                    handleSubVariantClick(sv)
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    selectedSubVariantId === sv.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  {sv.subvariant_name}
                  {sv.price && sv.price !== v.price && (
                    <span className="ml-1 text-xs opacity-80">
                      ({formatCurrency(sv.effective_price)})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
