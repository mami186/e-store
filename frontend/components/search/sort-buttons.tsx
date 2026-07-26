"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SortState = "all" | "asc" | "desc"

const SORT_CYCLE: SortState[] = ["all", "asc", "desc"]

interface SortOption {
  key: string
  label: string
}

interface SortButtonsProps {
  options: SortOption[]
  active: string | null
  direction: SortState
  onSort: (key: string, dir: SortState) => void
}

export function SortButtons({ options, active, direction, onSort }: SortButtonsProps) {
  const cycle = (key: string) => {
    const current = active === key ? direction : "all"
    const idx = SORT_CYCLE.indexOf(current)
    const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]
    onSort(next === "all" ? "" : key, next)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => {
        const isActive = active === opt.key
        const currentDir = isActive ? direction : "all"
        return (
          <Button
            key={opt.key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => cycle(opt.key)}
            className={cn("gap-1")}
          >
            {opt.label}
            {currentDir === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
            {currentDir === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
            {currentDir === "all" && <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
        )
      })}
    </div>
  )
}
