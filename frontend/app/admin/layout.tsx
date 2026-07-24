"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  MessageSquare,
  Flag,
  Gavel,
  Ban,
  Scale,
  ImageIcon,
  Shield,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/restrictions", label: "Restrictions", icon: Ban },
  { href: "/admin/restriction-reasons", label: "Restriction Reasons", icon: Gavel },
  { href: "/admin/appeals", label: "Appeals", icon: Scale },
  { href: "/admin/images", label: "Images", icon: ImageIcon },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r md:block">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>
        <nav className="space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
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
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                <ChevronRight
                  className={cn(
                    "ml-auto h-4 w-4 shrink-0 transition-transform",
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
  )
}
