import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const publicRoutes = ["/sign-in", "/sign-up", "/", "/api"]

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublic = publicRoutes.some((r) => path === r || path.startsWith(r + "/"))

  if (isPublic) return NextResponse.next()

  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.png|.*\\.svg).*)",
  ],
}
