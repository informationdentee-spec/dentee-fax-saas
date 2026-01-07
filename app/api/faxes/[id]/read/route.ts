import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// FAXを既読にする
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);

    const fax = await prisma.fax.update({
      where: { id },
      data: {
        is_read: true
      }
    });

    return NextResponse.json(fax);
  } catch (error) {
    console.error("Failed to mark as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
