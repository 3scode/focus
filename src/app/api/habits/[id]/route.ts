import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { habits, habitRecords } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.delete(habitRecords).where(eq(habitRecords.habitId, id))
  await db.delete(habits).where(eq(habits.id, id))
  return NextResponse.json({ success: true })
}
