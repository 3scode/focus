import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { blocks } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(blocks).where(eq(blocks.userId, session.user.id))
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, ...rest } = body
  const existing = await db.select().from(blocks).where(eq(blocks.id, id)).limit(1)
  if (existing.length > 0) {
    const updated = await db.update(blocks).set({ ...rest, userId: session.user.id }).where(eq(blocks.id, id)).returning()
    return NextResponse.json(updated[0])
  }
  const inserted = await db.insert(blocks).values({ id, ...rest, userId: session.user.id }).returning()
  return NextResponse.json(inserted[0])
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await db.delete(blocks).where(eq(blocks.id, id))
  return NextResponse.json({ success: true })
}
