import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { processOCR } from "@/lib/shared/ocr-unified";

// 受信FAXのOCR処理を実行（統合OCRサービスを使用）
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const faxId = Number(id);

    const fax = await prisma.receivedFax.findUnique({
      where: { id: faxId },
    });

    if (!fax || !fax.image_url) {
      return NextResponse.json({ error: "Fax or image not found" }, { status: 404 });
    }

    // 統合OCRサービスを使用してOCR処理を実行
    const ocrResult = await processOCR({
      imageUrl: fax.image_url,
      options: {
        mode: 'real-estate', // 不動産特化モード
        documentType: fax.document_type || undefined,
      },
    });

    // データベースを更新
    await prisma.receivedFax.update({
      where: { id: faxId },
      data: {
        ocr_text: ocrResult.text,
        from_company_name: ocrResult.extractedFields.companyName || fax.from_company_name,
        property_name: ocrResult.extractedFields.propertyName || fax.property_name,
        room_number: ocrResult.extractedFields.roomNumber || fax.room_number,
      },
    });

    // AI要約と文脈推測を非同期で実行
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/received-faxes/${faxId}/summary`, {
        method: "GET",
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/received-faxes/${faxId}/context`, {
        method: "GET",
      }),
    ]).catch((error) => {
      console.error(`Failed to generate AI summaries for fax ${faxId}:`, error);
    });

    return NextResponse.json({ 
      success: true, 
      ocr_text: ocrResult.text,
      extracted_fields: ocrResult.extractedFields,
      confidence: ocrResult.confidence,
    });
  } catch (error) {
    console.error("Failed to process OCR:", error);
    return NextResponse.json({ error: "Failed to process OCR" }, { status: 500 });
  }
}










