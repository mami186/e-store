"use client"

import { useState } from "react"
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/use-addresses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react"

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    full_name: "", phone: "", street: "", city: "", state: "", postal_code: "", country: "US",
  })

  const resetForm = () => {
    setForm({ full_name: "", phone: "", street: "", city: "", state: "", postal_code: "", country: "US" })
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateAddress.mutateAsync({ id: editingId, data: form })
    } else {
      await createAddress.mutateAsync(form)
    }
    resetForm()
  }

  const startEdit = (addr: { id: number; full_name: string; phone: string; street: string; city: string; state: string | null; postal_code: string; country: string }) => {
    setForm({ full_name: addr.full_name, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state || "", postal_code: addr.postal_code, country: addr.country })
    setEditingId(addr.id)
    setShowForm(true)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Addresses</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Add Address
        </Button>
      </div>

      <div className="space-y-4">
        {addresses?.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">{addr.full_name}</p>
                  <p className="text-muted-foreground">{addr.phone}</p>
                  <p className="text-muted-foreground">{addr.street}</p>
                  <p className="text-muted-foreground">
                    {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postal_code}
                  </p>
                  <p className="text-muted-foreground">{addr.country}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit({ ...addr })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => deleteAddress.mutate(addr.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(addresses?.length === 0) && (
        <p className="text-center text-muted-foreground py-12">No addresses saved.</p>
      )}

      {/* Address form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Address" : "Add Address"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Full name</Label>
                  <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Postal code</Label>
                  <Input required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Street</Label>
                  <Input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="flex gap-2 col-span-2 pt-2">
                  <Button type="submit" className="flex-1">{editingId ? "Update" : "Save"}</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
