"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSellerProfile, useApplySeller } from "@/hooks/use-seller"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Store, CheckCircle, XCircle, Clock } from "lucide-react"

export default function SellerApplyPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: profile, isLoading } = useSellerProfile()
  const applySeller = useApplySeller()
  const [shopName, setShopName] = useState("")
  const [shopDescription, setShopDescription] = useState("")

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-32 w-full mt-8" />
      </div>
    )
  }

  if (profile) {
    const status = profile.verification_status
    const statusConfig = {
      pending: { icon: Clock, text: "Application under review", color: "text-yellow-600 dark:text-yellow-400" },
      verified: { icon: CheckCircle, text: "You are a verified seller", color: "text-green-600 dark:text-green-400" },
      rejected: { icon: XCircle, text: "Application rejected", color: "text-red-600 dark:text-red-400" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
        <Icon className={`mx-auto h-16 w-16 ${config.color}`} />
        <h1 className="text-2xl font-bold">{profile.shop_name}</h1>
        <p className={`text-lg ${config.color}`}>{config.text}</p>
        {profile.shop_description && (
          <p className="text-muted-foreground">{profile.shop_description}</p>
        )}
        {status === "verified" && (
          <Button onClick={() => router.push("/seller/dashboard")}>
            Go to Dashboard
          </Button>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await applySeller.mutateAsync({
      shop_name: shopName,
      shop_description: shopDescription || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center mb-8">
        <Store className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Become a Seller</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start selling your products on Estore
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Shop name</Label>
          <Input
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="My Awesome Shop"
          />
        </div>
        <div className="space-y-1">
          <Label>Shop description (optional)</Label>
          <textarea
            className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
            rows={4}
            value={shopDescription}
            onChange={(e) => setShopDescription(e.target.value)}
            placeholder="Tell customers about your shop..."
          />
        </div>
        <Button type="submit" className="w-full" disabled={applySeller.isPending}>
          {applySeller.isPending ? "Submitting..." : "Apply"}
        </Button>
      </form>
    </div>
  )
}
