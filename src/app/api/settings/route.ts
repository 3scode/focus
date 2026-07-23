import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let data = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)
  if (data.length === 0) {
    const defaults = {
      id: userId,
      userId,
      dayStart: "08:00",
      dayEnd: "18:00",
      defaultTimer: 25,
      breakDuration: 5,
      weekStart: 1,
      theme: "dark",
    }
    const inserted = await db.insert(settings).values(defaults).returning()
    data = inserted
  }
  return NextResponse.json(data[0])
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const existing = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)
  if (existing.length > 0) {
    const updated = await db.update(settings).set(body).where(eq(settings.userId, userId)).returning()
    return NextResponse.json(updated[0])
  }
  const inserted = await db.insert(settings).values({ id: userId, userId, ...body }).returning()
  return NextResponse.json(inserted[0])
}
