"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Store, Package, ShoppingCart, Flag, Ban } from "lucide-react"

const stats = [
  { label: "Users", value: "—", icon: Users },
  { label: "Sellers", value: "—", icon: Store },
  { label: "Products", value: "—", icon: Package },
  { label: "Orders", value: "—", icon: ShoppingCart },
  { label: "Reports", value: "—", icon: Flag },
  { label: "Restrictions", value: "—", icon: Ban },
]

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
