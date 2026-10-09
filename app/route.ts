import { NextRequest, NextResponse } from "next/server"

export function GET(request: NextRequest) {
  // Keep the browser's origin, including local previews and custom domains.
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: `/login${request.nextUrl.search}` },
  })
  response.headers.set("Cache-Control", "private, no-store")
  return response
}
