import Link from "next/link"

const categories = [
  { name: "Electronics", slug: "electronics" },
  { name: "Clothing", slug: "clothing" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Books", slug: "books" },
  { name: "Sports", slug: "sports" },
]

export function NavBar() {
  return (
    <nav className="hidden md:flex h-10 items-center gap-1 border-b bg-muted/30 px-4">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-1">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}
