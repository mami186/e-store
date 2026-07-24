"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import apiClient from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [profile, setProfile] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    username: user?.username || "",
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState("")

  const [password, setPassword] = useState({ current: "", new: "", confirm: "" })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState("")

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg("")
    try {
      const res = await apiClient.put("/users/me", profile)
      updateUser(res.data)
      setProfileMsg("Profile updated")
    } catch {
      setProfileMsg("Failed to update profile")
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg("")
    if (password.new !== password.confirm) {
      setPasswordMsg("Passwords do not match")
      return
    }
    if (password.new.length < 8) {
      setPasswordMsg("Password must be at least 8 characters")
      return
    }
    setPasswordSaving(true)
    try {
      await apiClient.put("/users/me/password", {
        current_password: password.current,
        new_password: password.new,
      })
      setPasswordMsg("Password updated")
      setPassword({ current: "", new: "", confirm: "" })
    } catch {
      setPasswordMsg("Failed to update password")
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Your Account</h1>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>First name</Label>
                <Input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Last name</Label>
                <Input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user.email} disabled className="opacity-60" />
            </div>
            {profileMsg && <p className="text-sm text-muted-foreground">{profileMsg}</p>}
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Current password</Label>
              <Input type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>New password</Label>
              <Input type="password" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Confirm new password</Label>
              <Input type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} required />
            </div>
            {passwordMsg && <p className="text-sm text-muted-foreground">{passwordMsg}</p>}
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
