import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 名刺更新
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();

    const businessCard = await prisma.businessCard.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        position: body.position || null,
        department: body.department || null,
        image: body.image !== undefined ? body.image : undefined,
        template_html: body.template_html !== undefined ? body.template_html : undefined,
        variables: body.variables ? JSON.stringify(body.variables) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json(businessCard);
  } catch (error) {
    console.error("Failed to update business card:", error);
    return NextResponse.json({ error: "Failed to update business card" }, { status: 500 });
  }
}

// 名刺削除
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.businessCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete business card:", error);
    return NextResponse.json({ error: "Failed to delete business card" }, { status: 500 });
  }
}






