import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Estore",
  description: "E-commerce platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${interTight.variable}`}>
      <body className="min-h-dvh flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
