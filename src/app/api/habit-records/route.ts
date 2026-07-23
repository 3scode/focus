import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { habitRecords } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(habitRecords).where(eq(habitRecords.userId, userId))
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const inserted = await db.insert(habitRecords).values({ ...body, userId }).returning()
  return NextResponse.json(inserted[0])
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const records = await req.json() as { id: string; habitId: string; date: string; completedAt: string }[]
  await db.delete(habitRecords).where(eq(habitRecords.userId, userId))
  if (records.length > 0) {
    await db.insert(habitRecords).values(records.map(r => ({ ...r, userId })))
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await db.delete(habitRecords).where(eq(habitRecords.id, id))
  return NextResponse.json({ success: true })
}
