"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useAuthStore } from "@/lib/auth-store"

export function Header() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
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

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-24 truncate">
                  {user.first_name || user.email}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  Your Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/orders")}>
                  Your Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/wishlist")}>
                  Your Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/appeals")}>
                  Your Appeals
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Sign In</span>
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={() => router.push("/cart")}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
