import Link from "next/link"
import type { CategoryResponse } from "@/lib/types"

interface CategoryCardProps {
  category: CategoryResponse
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/search?category_id=${category.id}`}
      className="group flex flex-col items-center gap-2 p-4 rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/50 min-w-[120px] w-[120px]"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        {category.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm font-medium text-center line-clamp-2">{category.name}</span>
    </Link>
  )
}
