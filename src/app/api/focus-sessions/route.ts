import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { focusSessions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId))
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const inserted = await db.insert(focusSessions).values({ ...body, userId }).returning()
  return NextResponse.json(inserted[0])
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sessions = await req.json() as { id: string; blockId: string; date: string; durationMinutes: number; completedAt: string }[]
  await db.delete(focusSessions).where(eq(focusSessions.userId, userId))
  if (sessions.length > 0) {
    await db.insert(focusSessions).values(sessions.map(s => ({ ...s, userId })))
  }
  return NextResponse.json({ success: true })
}
