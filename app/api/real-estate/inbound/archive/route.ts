import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * アーカイブ検索
 * GET /api/real-estate/inbound/archive
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const documentType = searchParams.get("document_type");
    const tags = searchParams.get("tags"); // カンマ区切り
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = searchParams.get("limit");

    const where: any = {};

    // 検索条件
    if (search) {
      where.OR = [
        { from_company_name: { contains: search } },
        { property_name: { contains: search } },
        { ocr_text: { contains: search } },
      ];
    }

    if (documentType) {
      where.document_type = documentType;
    }

    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      where.tags = {
        some: {
          tag: { in: tagArray },
        },
      };
    }

    if (startDate || endDate) {
      where.received_at = {};
      if (startDate) {
        where.received_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.received_at.lte = new Date(endDate);
      }
    }

    const receivedFaxes = await prisma.receivedFax.findMany({
      where,
      include: {
        classification: {
          include: {
            property: true,
            assigned_user: true,
          },
        },
        tags: true,
      },
      orderBy: {
        received_at: "desc",
      },
      take: limit ? Number(limit) : 100,
    });

    return NextResponse.json({ received_faxes: receivedFaxes });
  } catch (error) {
    console.error("Failed to search archive:", error);
    return NextResponse.json(
      { error: "Failed to search archive" },
      { status: 500 }
    );
  }
}







