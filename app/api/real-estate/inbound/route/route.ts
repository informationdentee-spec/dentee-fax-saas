import { NextResponse } from "next/server";
import { routeDocument } from "@/lib/real-estate/routing/auto-router";
import { prisma } from "@/lib/prisma";

/**
 * 自動振り分け実行
 * POST /api/real-estate/inbound/route
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

    // 分類情報を取得
    const classification = await prisma.receivedFaxClassification.findUnique({
      where: { received_fax_id: Number(data.received_fax_id) },
    });

    // 自動振り分けを実行
    const routingResult = await routeDocument(Number(data.received_fax_id), {
      document_type: classification?.document_type,
      urgency: data.urgency,
      extracted_fields: classification?.extracted_fields
        ? JSON.parse(classification.extracted_fields)
        : undefined,
    });

    // データベースに保存
    await prisma.receivedFaxClassification.update({
      where: { received_fax_id: Number(data.received_fax_id) },
      data: {
        assigned_user_id: routingResult.assigned_user_id || null,
        routing_rule_id: routingResult.rule_id || null,
      },
    });

    return NextResponse.json({ routing: routingResult });
  } catch (error: any) {
    if (error.message === "Received fax not found") {
      return NextResponse.json(
        { error: "Received fax not found" },
        { status: 404 }
      );
    }
    console.error("Failed to route document:", error);
    return NextResponse.json(
      { error: "Failed to route document" },
      { status: 500 }
    );
  }
}







