import { NextResponse, NextRequest } from "next/server";
import { PrintService } from "@/lib/shared/print-service";
import { prisma } from "@/lib/prisma";

/**
 * 自動印刷実行
 * POST /api/real-estate/inbound/auto-print
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // バリデーション
    if (!data.received_fax_id) {
      return NextResponse.json(
        { error: "received_fax_id is required" },
        { status: 400 }
      );
    }

    // 受信FAX情報を取得
    const receivedFax = await prisma.receivedFax.findUnique({
      where: { id: Number(data.received_fax_id) },
      include: {
        classification: true,
      },
    });

    if (!receivedFax || !receivedFax.image_url) {
      return NextResponse.json(
        { error: "Received fax or image not found" },
        { status: 404 }
      );
    }

    // 分類情報から印刷ルールを判定
    const documentType =
      receivedFax.classification?.document_type ||
      receivedFax.document_type ||
      "その他";

    // 印刷が必要な文書タイプをチェック
    const printRequiredTypes = ["図面", "資料", "契約書", "修繕依頼"];
    const shouldPrint = printRequiredTypes.some((type) =>
      documentType.includes(type)
    );

    if (!shouldPrint && !data.force_print) {
      return NextResponse.json({
        auto_print: false,
        reason: "この文書タイプは自動印刷の対象外です",
      });
    }

    // 印刷を実行
    const printResult = await PrintService.printDocument({
      documentType: documentType,
      content: receivedFax.image_url, // Base64画像データ
      printer: data.printer,
      receivedFaxId: Number(data.received_fax_id),
      metadata: {
        from_company_name: receivedFax.from_company_name,
        property_name: receivedFax.property_name,
        received_at: receivedFax.received_at.toISOString(),
      },
    });

    return NextResponse.json({
      auto_print: true,
      print_job: printResult,
    });
  } catch (error) {
    console.error("Failed to auto-print:", error);
    return NextResponse.json(
      { error: "Failed to auto-print" },
      { status: 500 }
    );
  }
}







