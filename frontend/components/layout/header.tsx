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

  return (
    <>
      <button onClick={() => handleClick("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        Discover
      </button>
      <button onClick={() => handleClick("/browse")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        Browse
      </button>
      {isAuthenticated && (
        <>
          <button onClick={() => handleClick("/orders")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Orders
          </button>
          <button onClick={() => handleClick("/wishlist")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Wishlist
          </button>
        </>
      )}
      {isSeller && (
        <button onClick={() => handleClick("/seller/dashboard")} className="text-sm font-medium text-foreground transition-colors">
          Seller
        </button>
      )}
      {isAdmin && (
        <button onClick={() => handleClick("/admin/dashboard")} className="text-sm font-medium text-foreground transition-colors">
          Admin
        </button>
      )}
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

  const avatarInit = (user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase()

  return (
    <>
      {/* Top Navbar — non-sticky, scrolls away */}
      <header className="w-full border-b bg-muted/60">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="Estore" className="h-6 w-auto text-foreground" />
            <span className="text-lg font-bold tracking-tight">Estore</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {isSeller && (
              <button onClick={() => router.push("/seller/dashboard")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Seller
              </button>
            )}
            {isAdmin && (
              <button onClick={() => router.push("/admin/dashboard")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </button>
            )}
            {isAuthenticated ? (
              <button onClick={() => router.push("/profile")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  {avatarInit}
                </span>
                <span>{user?.first_name || "Account"}</span>
              </button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                <User className="h-4 w-4" />
                <span className="ml-1">Sign In</span>
              </Button>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile top-right */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-6">
                <div className="flex flex-col gap-4 mt-8">
                  {isAuthenticated ? (
                    <SheetClose onClick={() => router.push("/profile")} className="inline-flex items-center gap-2 text-sm font-medium">
                      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                        {avatarInit}
                      </span>
                      {user?.first_name || "Account"}
                    </SheetClose>
                  ) : (
                    <SheetClose onClick={() => router.push("/login")} className="text-sm font-medium">
                      Sign In
                    </SheetClose>
                  )}
                  <div className="pt-2 border-t flex flex-col gap-3">
                    <NavLinks onNavigate={() => setMobileOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Bottom Navbar — sticky */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-blur:bg-background/60">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </form>

          {/* Desktop left links */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </button>
            <button onClick={() => router.push("/browse")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse
            </button>
          </div>

          {/* Desktop right links */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {isAuthenticated && (
              <>
                <button onClick={() => router.push("/orders")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Orders
                </button>
                <button onClick={() => router.push("/wishlist")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Wishlist
                </button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => router.push("/cart")}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile cart */}
          <div className="flex md:hidden ml-auto">
            <Button variant="ghost" size="icon" onClick={() => router.push("/cart")}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
