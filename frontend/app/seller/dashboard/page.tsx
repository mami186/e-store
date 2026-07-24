"use client"

import { useRouter } from "next/navigation"
import { useSellerProfile } from "@/hooks/use-seller"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, DollarSign, ShoppingCart, TrendingUp } from "lucide-react"

export default function SellerDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: profile, isLoading } = useSellerProfile()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16">
        <p className="text-muted-foreground">You are not a seller yet.</p>
        <Button onClick={() => router.push("/seller/apply")}>Apply to Sell</Button>
      </div>
    )
  }

  if (profile.verification_status !== "verified") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16">
        <p className="text-muted-foreground">
          Your seller application is {profile.verification_status}. Please wait for verification.
        </p>
        <Button variant="outline" onClick={() => router.push("/seller/apply")}>
          View Application
        </Button>
      </div>
    )
  }

  const stats = [
    { label: "Total Products", value: "0", icon: Package },
    { label: "Total Sales", value: "$0.00", icon: DollarSign },
    { label: "Orders", value: "0", icon: ShoppingCart },
    { label: "Revenue (30d)", value: "$0.00", icon: TrendingUp },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{profile.shop_name}</h1>
        <p className="text-sm text-muted-foreground">Seller Dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => router.push("/seller/products/new")}>
              <Package className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/seller/products")}>
              Manage Products
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
