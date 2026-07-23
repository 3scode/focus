import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { categories } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.order)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cats = await req.json() as { id: string; name: string; color: string; order: number }[]
  await db.delete(categories).where(eq(categories.userId, userId))
  if (cats.length > 0) {
    await db.insert(categories).values(cats.map(c => ({ ...c, userId })))
  }
  return NextResponse.json({ success: true })
}
