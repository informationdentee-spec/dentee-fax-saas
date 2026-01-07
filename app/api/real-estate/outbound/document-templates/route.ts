import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * 書類テンプレート一覧取得
 * GET /api/real-estate/outbound/document-templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("is_active");

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== null) {
      where.is_active = isActive === "true";
    }

    const templates = await prisma.realEstateDocumentTemplate.findMany({
      where,
      include: {
        base_template: true,
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch document templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch document templates" },
      { status: 500 }
    );
  }
}

/**
 * 書類テンプレート作成
 * POST /api/real-estate/outbound/document-templates
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // バリデーション
    if (!data.name || !data.category || !data.template_type || !data.content) {
      return NextResponse.json(
        { error: "name, category, template_type, and content are required" },
        { status: 400 }
      );
    }

    const template = await prisma.realEstateDocumentTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        template_type: data.template_type,
        content: data.content,
        variables: data.variables ? JSON.stringify(data.variables) : null,
        preview_image: data.preview_image || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        base_template_id: data.base_template_id || null,
      },
      include: {
        base_template: true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Failed to create document template:", error);
    return NextResponse.json(
      { error: "Failed to create document template" },
      { status: 500 }
    );
  }
}







