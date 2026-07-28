import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(settings).where(eq(settings.userId, session.user.id)).limit(1)
  return NextResponse.json(data[0] ?? null)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, ...rest } = body
  await db.insert(settings).values({ id, ...rest, userId: session.user.id }).onConflictDoUpdate({ target: settings.id, set: { ...rest, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
