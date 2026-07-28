import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { habits } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(habits).where(eq(habits.userId, session.user.id))
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const inserted = await db.insert(habits).values({ ...body, userId: session.user.id }).returning()
  return NextResponse.json(inserted[0])
}
