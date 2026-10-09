import { NextRequest, NextResponse } from "next/server"
import { GET as redirectToLogin } from "../route"

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (locale !== "id" && locale !== "en") return new NextResponse(null, { status: 404 })
  return redirectToLogin(request)
}
