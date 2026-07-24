"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Plus,
  Store,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/products/new", label: "Add Product", icon: Plus },
]

export default function SellerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Store className="h-5 w-5" />
            <span className="text-sm font-semibold">Seller Center</span>
          </div>
          <nav className="space-y-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                item.href === "/seller/products"
                  ? pathname.startsWith("/seller/products") && !pathname.startsWith("/seller/products/new")
                  : pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <ChevronRight
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      active && "rotate-90",
                    )}
                  />
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
