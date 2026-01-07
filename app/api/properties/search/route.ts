import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// 物件検索API（物件名で検索、管理会社情報も含む）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json([]);
    }

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { address: { contains: query } },
          { room_number: { contains: query } },
        ]
      },
      include: {
        company: true
      },
      take: 10
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Failed to search properties:", error);
    return NextResponse.json({ error: "Failed to search properties" }, { status: 500 });
  }
}
