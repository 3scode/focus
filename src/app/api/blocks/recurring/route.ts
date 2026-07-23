import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { blocks } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { groupId } = await req.json()
  await db.delete(blocks).where(eq(blocks.recurringGroupId, groupId))
  return NextResponse.json({ success: true })
}
