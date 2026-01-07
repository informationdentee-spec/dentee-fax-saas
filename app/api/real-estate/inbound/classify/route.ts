import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { classifyDocument } from "@/lib/real-estate/classification/document-classifier";

/**
 * 文書分類実行
 * POST /api/real-estate/inbound/classify
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // バリデーション
    if (!data.received_fax_id && !data.ocr_text) {
      return NextResponse.json(
        { error: "received_fax_id or ocr_text is required" },
        { status: 400 }
      );
    }

    let ocrText = data.ocr_text;
    let metadata: any = {};

    // received_fax_idが指定されている場合はデータベースから取得
    if (data.received_fax_id) {
      const receivedFax = await prisma.receivedFax.findUnique({
        where: { id: Number(data.received_fax_id) },
      });

      if (!receivedFax) {
        return NextResponse.json(
          { error: "Received fax not found" },
          { status: 404 }
        );
      }

      ocrText = receivedFax.ocr_text || "";
      metadata = {
        from_company_name: receivedFax.from_company_name,
        property_name: receivedFax.property_name,
        room_number: receivedFax.room_number,
      };
    } else {
      metadata = data.metadata || {};
    }

    // 文書分類を実行
    const classification = classifyDocument(ocrText || "", metadata);

    // データベースに保存（received_fax_idが指定されている場合）
    if (data.received_fax_id) {
      // 既存の分類結果を更新または新規作成
      await prisma.receivedFaxClassification.upsert({
        where: { received_fax_id: Number(data.received_fax_id) },
        update: {
          document_type: classification.document_type,
          confidence: classification.confidence,
          extracted_fields: JSON.stringify({
            explanation: classification.explanation,
          }),
        },
        create: {
          received_fax_id: Number(data.received_fax_id),
          document_type: classification.document_type,
          confidence: classification.confidence,
          extracted_fields: JSON.stringify({
            explanation: classification.explanation,
          }),
        },
      });

      // ReceivedFaxテーブルも更新
      await prisma.receivedFax.update({
        where: { id: Number(data.received_fax_id) },
        data: {
          document_type: classification.document_type,
        },
      });
    }

    return NextResponse.json({ classification });
  } catch (error) {
    console.error("Failed to classify document:", error);
    return NextResponse.json(
      { error: "Failed to classify document" },
      { status: 500 }
    );
  }
}







