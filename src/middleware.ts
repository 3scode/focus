import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const isPublicRoute = createRouteMatcher([`${BASE}/sign-in(.*)`, `${BASE}/sign-up(.*)`, `${BASE}/`])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.png|.*\\.svg).*)",
  ],
}
