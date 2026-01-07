import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * 振り分けルール更新
 * PUT /api/real-estate/inbound/routing-rules/:id
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = Number(id);
    const data = await req.json();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.conditions !== undefined)
      updateData.conditions = JSON.stringify(data.conditions);
    if (data.target_user_id !== undefined)
      updateData.target_user_id = data.target_user_id;
    if (data.target_department !== undefined)
      updateData.target_department = data.target_department;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const rule = await prisma.autoRoutingRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        target_user: true,
      },
    });

    return NextResponse.json({ rule });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Routing rule not found" },
        { status: 404 }
      );
    }
    console.error("Failed to update routing rule:", error);
    return NextResponse.json(
      { error: "Failed to update routing rule" },
      { status: 500 }
    );
  }
}

/**
 * 振り分けルール削除
 * DELETE /api/real-estate/inbound/routing-rules/:id
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleId = Number(id);

    await prisma.autoRoutingRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Routing rule not found" },
        { status: 404 }
      );
    }
    console.error("Failed to delete routing rule:", error);
    return NextResponse.json(
      { error: "Failed to delete routing rule" },
      { status: 500 }
    );
  }
}







