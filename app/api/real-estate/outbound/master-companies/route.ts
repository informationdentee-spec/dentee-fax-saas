import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * 管理会社マスタ一覧取得
 * GET /api/real-estate/outbound/master-companies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tags = searchParams.get("tags"); // カンマ区切り

    const where: any = {};

    if (search) {
      where.company = {
        OR: [
          { name: { contains: search } },
          { fax: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      where.tags = {
        contains: JSON.stringify(tagArray),
      };
    }

    const masterCompanies = await prisma.masterCompany.findMany({
      where,
      include: {
        company: {
          include: {
            properties: {
              take: 5, // 最新5件の物件のみ
            },
          },
        },
      },
      orderBy: {
        company: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({ master_companies: masterCompanies });
  } catch (error) {
    console.error("Failed to fetch master companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch master companies" },
      { status: 500 }
    );
  }
}

/**
 * 管理会社マスタ作成
 * POST /api/real-estate/outbound/master-companies
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // バリデーション
    if (!data.company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    // 既にマスタが存在するかチェック
    const existing = await prisma.masterCompany.findUnique({
      where: { company_id: Number(data.company_id) },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Master company already exists for this company" },
        { status: 409 }
      );
    }

    const masterCompany = await prisma.masterCompany.create({
      data: {
        company_id: Number(data.company_id),
        preferred_fax_number: data.preferred_fax_number || null,
        business_hours: data.business_hours
          ? JSON.stringify(data.business_hours)
          : null,
        contact_person: data.contact_person || null,
        department: data.department || null,
        notes: data.notes || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        auto_reply_enabled: data.auto_reply_enabled || false,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({ master_company: masterCompany }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Master company already exists for this company" },
        { status: 409 }
      );
    }
    console.error("Failed to create master company:", error);
    return NextResponse.json(
      { error: "Failed to create master company" },
      { status: 500 }
    );
  }
}







