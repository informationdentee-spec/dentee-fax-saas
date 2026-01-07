import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * 書類テンプレート取得
 * GET /api/real-estate/outbound/document-templates/:id
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const templateId = Number(id);

    const template = await prisma.realEstateDocumentTemplate.findUnique({
      where: { id: templateId },
      include: {
        base_template: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Failed to fetch document template:", error);
    return NextResponse.json(
      { error: "Failed to fetch document template" },
      { status: 500 }
    );
  }
}

/**
 * 書類テンプレート更新
 * PUT /api/real-estate/outbound/document-templates/:id
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const templateId = Number(id);
    const data = await request.json();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.template_type !== undefined)
      updateData.template_type = data.template_type;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.variables !== undefined)
      updateData.variables = JSON.stringify(data.variables);
    if (data.preview_image !== undefined)
      updateData.preview_image = data.preview_image;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.base_template_id !== undefined)
      updateData.base_template_id = data.base_template_id;

    const template = await prisma.realEstateDocumentTemplate.update({
      where: { id: templateId },
      data: updateData,
      include: {
        base_template: true,
      },
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    console.error("Failed to update document template:", error);
    return NextResponse.json(
      { error: "Failed to update document template" },
      { status: 500 }
    );
  }
}

/**
 * 書類テンプレート削除
 * DELETE /api/real-estate/outbound/document-templates/:id
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const templateId = Number(id);

    await prisma.realEstateDocumentTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    console.error("Failed to delete document template:", error);
    return NextResponse.json(
      { error: "Failed to delete document template" },
      { status: 500 }
    );
  }
}







