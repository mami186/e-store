export function HeroBanner() {
  return (
    <section className="relative flex h-[300px] sm:h-[400px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-muted to-background border">
      <div className="relative text-center px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Discover Something Amazing
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
          Explore our curated collection of premium products
        </p>
      </div>
    </section>
  )
}
