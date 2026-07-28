"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { Search, ShoppingCart, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useAuthStore } from "@/lib/auth-store"

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const isSeller = user?.roles.some((r) => r.id === 1)
  const isAdmin = user?.roles.some((r) => r.id >= 3)

  const handleClick = useCallback(
    (path: string) => {
      router.push(path)
      onNavigate?.()
    },
    [router, onNavigate],
  )

  if (!isAuthenticated) return null

  return (
    <>
      <button
        onClick={() => handleClick("/orders")}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Orders
      </button>
      <button
        onClick={() => handleClick("/wishlist")}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Wishlist
      </button>
      <button
        onClick={() => handleClick("/appeals")}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Appeals
      </button>
      {isSeller && (
        <button
          onClick={() => handleClick("/seller/dashboard")}
          className="text-sm font-medium text-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </button>
      )}
      {isAdmin && (
        <button
          onClick={() => handleClick("/admin/dashboard")}
          className="text-sm font-medium text-foreground hover:text-foreground transition-colors"
        >
          Admin
        </button>
      )}
      <button
        onClick={() => handleClick("/profile")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
          {(user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase()}
        </span>
        <span className="hidden md:inline">{user?.first_name || "Account"}</span>
      </button>
    </>
  )
}

export function Header() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  const isSeller = user?.roles.some((r) => r.id === 1)
  const isAdmin = user?.roles.some((r) => r.id >= 3)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="text-xl font-bold tracking-tight shrink-0">
          Estore
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </form>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NavLinks />
              <Button variant="ghost" size="icon" onClick={() => router.push("/cart")}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                <User className="h-4 w-4" />
                <span className="ml-1">Sign In</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => router.push("/cart")}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => router.push("/cart")}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-6">
              <div className="flex flex-col gap-4 mt-8">
                <p className="text-sm font-medium text-muted-foreground">
                  {isAuthenticated ? user?.first_name || user?.email : "Menu"}
                </p>
                {isAuthenticated ? (
                  <>
                    <NavLinks onNavigate={() => setMobileOpen(false)} />
                    <div className="mt-2 pt-2 border-t">
                      <SheetClose
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                        onClick={() => router.push("/profile")}
                      >
                        {user?.first_name || "Account"}
                      </SheetClose>
                    </div>
                  </>
                ) : (
                  <SheetClose
                    onClick={() => router.push("/login")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
