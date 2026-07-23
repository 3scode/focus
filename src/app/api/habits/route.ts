import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { habits } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(habits.order)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const inserted = await db.insert(habits).values({ ...body, userId }).returning()
  return NextResponse.json(inserted[0])
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const allHabits = await req.json() as { id: string; name: string; color: string; frequency: string; order: number; createdAt: string }[]
  await db.delete(habits).where(eq(habits.userId, userId))
  if (allHabits.length > 0) {
    await db.insert(habits).values(allHabits.map(h => ({ ...h, userId })))
  }
  return NextResponse.json({ success: true })
}
