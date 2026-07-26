"use client"

import { useProducts } from "@/hooks/use-products"
import { useFeatured } from "@/hooks/use-featured"
import { useCategories } from "@/hooks/use-categories"
import { ProductCard } from "@/components/products/product-card"
import { HorizontalScroll } from "@/components/ui/horizontal-scroll"
import { HeroBanner } from "@/components/home/hero-banner"
import { FeaturedCard } from "@/components/home/featured-card"
import { CategoryCard } from "@/components/home/category-card"
import { Skeleton } from "@/components/ui/skeleton"

function SectionSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-[200px] w-[200px] space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useFeatured()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useProducts({
    limit: 12,
    sort_by: "created_at",
    order: "desc",
  })
  const { data: topRatedData, isLoading: topRatedLoading } = useProducts({
    limit: 12,
    sort_by: "rating",
    order: "desc",
  })

  const newArrivals = newArrivalsData?.pages.flat() ?? []
  const topRated = topRatedData?.pages.flat() ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
      <HeroBanner />

      <section>
        <h2 className="text-xl font-bold mb-4">Featured Picks</h2>
        {featuredLoading ? (
          <SectionSkeleton />
        ) : featuredData && featuredData.length > 0 ? (
          <HorizontalScroll>
            {featuredData.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </HorizontalScroll>
        ) : (
          <p className="text-sm text-muted-foreground">No featured items yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
        {categoriesLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[120px] w-[120px] h-[100px] rounded-lg" />
            ))}
          </div>
        ) : categoriesData && categoriesData.length > 0 ? (
          <HorizontalScroll>
            {categoriesData.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </HorizontalScroll>
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">New Arrivals</h2>
        {newArrivalsLoading ? (
          <SectionSkeleton />
        ) : newArrivals.length > 0 ? (
          <HorizontalScroll>
            {newArrivals.map((product) => (
              <div key={product.id} className="min-w-[200px] w-[200px]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalScroll>
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Top Rated</h2>
        {topRatedLoading ? (
          <SectionSkeleton />
        ) : topRated.length > 0 ? (
          <HorizontalScroll>
            {topRated.map((product) => (
              <div key={product.id} className="min-w-[200px] w-[200px]">
                <ProductCard product={product} />
              </div>
            ))}
          </HorizontalScroll>
        ) : null}
      </section>
    </div>
  )
}
