import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Welcome to Estore</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md text-center">
        A clean, minimal e-commerce experience.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/search"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    </div>
  )
}
