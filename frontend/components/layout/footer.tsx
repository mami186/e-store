import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Estore
          </Link>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Estore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
