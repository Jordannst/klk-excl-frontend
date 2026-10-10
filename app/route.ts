import { NextRequest, NextResponse } from "next/server"
import { detectLandingLocale, localeCookie } from "@/lib/landing-locale"

export function GET(request: NextRequest) {
  const locale = detectLandingLocale(
    request.cookies.get(localeCookie)?.value,
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("accept-language") ?? "",
  )
  // Keep the browser's origin, including local previews and custom domains.
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: `/${locale}${request.nextUrl.search}` },
  })
  // A visitor's language choice must never be reused by a shared cache.
  response.headers.set("Cache-Control", "private, no-store")
  response.headers.set("Vary", "Cookie, Accept-Language, X-Vercel-IP-Country")
  return response
}
