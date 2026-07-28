import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { habits, habitRecords } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await db.select().from(habits).where(eq(habits.id, id)).limit(1)
  return NextResponse.json(data[0] ?? null)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const updated = await db.update(habits).set({ ...body }).where(eq(habits.id, id)).returning()
  return NextResponse.json(updated[0])
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.delete(habits).where(eq(habits.id, id))
  await db.delete(habitRecords).where(eq(habitRecords.habitId, id))
  return NextResponse.json({ success: true })
}
