import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { categories } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await db.select().from(categories).where(eq(categories.userId, session.user.id))
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, ...rest } = body
  await db.insert(categories).values({ id, ...rest, userId: session.user.id }).onConflictDoUpdate({ target: categories.id, set: { ...rest, userId: session.user.id } })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await db.delete(categories).where(eq(categories.id, id))
  return NextResponse.json({ success: true })
}
