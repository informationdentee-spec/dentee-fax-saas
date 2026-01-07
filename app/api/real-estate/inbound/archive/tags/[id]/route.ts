import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * タグ削除
 * DELETE /api/real-estate/inbound/archive/tags/:id
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = Number(id);

    await prisma.receivedFaxTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    console.error("Failed to delete tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}







