import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { blocks } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { groupId } = await req.json()
  await db.delete(blocks).where(eq(blocks.recurringGroupId, groupId))
  return NextResponse.json({ success: true })
}
