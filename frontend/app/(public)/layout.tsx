import type { ReactNode } from "react"
import { Header } from "@/components/layout/header"
import { NavBar } from "@/components/layout/nav-bar"
import { Footer } from "@/components/layout/footer"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
