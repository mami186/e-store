import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/register"]
const authRequiredRoutes = [
  "/cart",
  "/checkout",
  "/orders",
  "/wishlist",
  "/profile",
  "/addresses",
  "/appeals",
]
const sellerRoutes = ["/seller"]
const adminRoutes = ["/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasRefreshCookie = request.cookies.has("refresh_token")

  // Redirect authenticated users away from login/register
  if (hasRefreshCookie && publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Protect auth-required routes
  const isAuthRequired = authRequiredRoutes.some((r) => pathname.startsWith(r))
  if (isAuthRequired && !hasRefreshCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect seller routes
  if (sellerRoutes.some((r) => pathname.startsWith(r)) && !hasRefreshCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Protect admin routes
  if (adminRoutes.some((r) => pathname.startsWith(r)) && !hasRefreshCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
