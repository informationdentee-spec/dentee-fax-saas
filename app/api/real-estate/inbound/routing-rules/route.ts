import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * 振り分けルール一覧取得
 * GET /api/real-estate/inbound/routing-rules
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("is_active");

    const where: any = {};
    if (isActive !== null) {
      where.is_active = isActive === "true";
    }

    const rules = await prisma.autoRoutingRule.findMany({
      where,
      include: {
        target_user: true,
      },
      orderBy: [
        { priority: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch routing rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch routing rules" },
      { status: 500 }
    );
  }
}

/**
 * 振り分けルール作成
 * POST /api/real-estate/inbound/routing-rules
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // バリデーション
    if (!data.name || !data.conditions) {
      return NextResponse.json(
        { error: "name and conditions are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.autoRoutingRule.create({
      data: {
        name: data.name,
        priority: data.priority || 0,
        conditions: JSON.stringify(data.conditions),
        target_user_id: data.target_user_id || null,
        target_department: data.target_department || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
      include: {
        target_user: true,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create routing rule:", error);
    return NextResponse.json(
      { error: "Failed to create routing rule" },
      { status: 500 }
    );
  }
}







