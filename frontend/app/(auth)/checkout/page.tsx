"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useAddresses, useCreateAddress } from "@/hooks/use-addresses"
import { useCreateOrder } from "@/hooks/use-orders"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: addresses, isLoading: addrLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const createOrder = useCreateOrder()

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [notes, setNotes] = useState("")
  const [newAddr, setNewAddr] = useState({
    full_name: "", phone: "", street: "", city: "", state: "", postal_code: "", country: "US",
  })

  const loading = cartLoading || addrLoading

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart")
    return null
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const addr = await createAddress.mutateAsync(newAddr)
    setSelectedAddressId(addr.id)
    setShowNewForm(false)
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return
    await createOrder.mutateAsync({ address_id: selectedAddressId, notes: notes || undefined })
    router.push("/orders")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Address selection */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold">Shipping Address</h2>
              {addresses && addresses.length > 0 ? (
                <RadioGroup
                  value={selectedAddressId?.toString()}
                  onValueChange={(val: string) => setSelectedAddressId(parseInt(val))}
                >
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} />
                      <Label htmlFor={`addr-${addr.id}`} className="cursor-pointer text-sm">
                        <p className="font-medium">{addr.full_name}</p>
                        <p className="text-muted-foreground">
                          {addr.street}, {addr.city}
                          {addr.state ? `, ${addr.state}` : ""} {addr.postal_code}
                        </p>
                        <p className="text-muted-foreground">{addr.country}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-sm text-muted-foreground">No addresses saved.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewForm(!showNewForm)}
              >
                {showNewForm ? "Cancel" : "Add new address"}
              </Button>

              {showNewForm && (
                <form onSubmit={handleAddAddress} className="grid grid-cols-2 gap-3 pt-2">
                  <div className="col-span-2 space-y-1">
                    <Label>Full name</Label>
                    <Input required value={newAddr.full_name} onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input required value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Postal code</Label>
                    <Input required value={newAddr.postal_code} onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Street</Label>
                    <Input required value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Input required value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>State</Label>
                    <Input value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
                  </div>
                  <Button type="submit" className="col-span-2" size="sm">
                    Save Address
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Order Notes</h2>
              <textarea
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
                rows={3}
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div>
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.variant_name} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedAddressId || createOrder.isPending}
                onClick={handlePlaceOrder}
              >
                {createOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
