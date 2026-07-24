"use client"

import { useProducts } from "@/hooks/use-products"
import { ProductGrid } from "@/components/products/product-grid"

export default function HomePage() {
  const { data: products, isLoading } = useProducts({ limit: 12, sort_by: "created_at", order: "desc" })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Featured Products</h1>
        <p className="mt-1 text-muted-foreground">Discover our latest products</p>
      </section>
      <ProductGrid products={products ?? []} isLoading={isLoading} />
    </div>
  )
}
