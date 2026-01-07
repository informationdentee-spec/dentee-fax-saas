import { NextResponse } from "next/server";
import { matchProperty } from "@/lib/real-estate/matching/property-matcher";
import { prisma } from "@/lib/prisma";

/**
 * 物件紐づけ実行
 * POST /api/real-estate/inbound/match-property
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // バリデーション
    if (!data.received_fax_id) {
      return NextResponse.json(
        { error: "received_fax_id is required" },
        { status: 400 }
      );
    }

    // 物件マッチングを実行
    const matchResult = await matchProperty(Number(data.received_fax_id));

    // データベースに保存（信頼度が0.7以上の場合は自動紐づけ）
    if (matchResult.property_id && matchResult.confidence >= 0.7) {
      await prisma.receivedFaxClassification.update({
        where: { received_fax_id: Number(data.received_fax_id) },
        data: {
          property_match_id: matchResult.property_id,
        },
      });
    }

    return NextResponse.json({ match: matchResult });
  } catch (error: any) {
    if (error.message === "Received fax not found") {
      return NextResponse.json(
        { error: "Received fax not found" },
        { status: 404 }
      );
    }
    console.error("Failed to match property:", error);
    return NextResponse.json(
      { error: "Failed to match property" },
      { status: 500 }
    );
  }
}







