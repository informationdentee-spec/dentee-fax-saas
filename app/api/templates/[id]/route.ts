import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// テンプレート更新
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await context.params;
    const id = Number(idString);
    const data = await request.json();

    const template = await prisma.faxTemplate.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        content: data.content,
        is_default: data.is_default || false,
      }
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

// テンプレート削除
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await context.params;
    const id = Number(idString);

    await prisma.faxTemplate.delete({
      where: { id }
    });
    return NextResponse.json({ message: "Template deleted" });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
