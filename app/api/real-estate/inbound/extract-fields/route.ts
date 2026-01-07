import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { processOCR } from "@/lib/shared/ocr-unified";
import { extractRealEstateFields } from "@/lib/real-estate/ocr/real-estate-parser";

/**
 * 項目抽出実行
 * POST /api/real-estate/inbound/extract-fields
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // バリデーション
    if (!data.received_fax_id && !data.image_url && !data.ocr_text) {
      return NextResponse.json(
        {
          error:
            "received_fax_id, image_url, or ocr_text is required",
        },
        { status: 400 }
      );
    }

    let ocrText = data.ocr_text;
    let documentType = data.document_type;

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
      documentType = receivedFax.document_type || documentType;

      // OCRテキストがない場合は画像からOCR処理を実行
      if (!ocrText && receivedFax.image_url) {
        const ocrResult = await processOCR({
          imageUrl: receivedFax.image_url,
          options: {
            mode: "real-estate",
            documentType: documentType,
          },
        });

        ocrText = ocrResult.text;
      }
    } else if (data.image_url && !ocrText) {
      // 画像からOCR処理を実行
      const ocrResult = await processOCR({
        imageUrl: data.image_url,
        options: {
          mode: "real-estate",
          documentType: documentType,
        },
      });

      ocrText = ocrResult.text;
    }

    if (!ocrText) {
      return NextResponse.json(
        { error: "OCR text is required" },
        { status: 400 }
      );
    }

    // 不動産特化フィールド抽出
    const extractedFields = extractRealEstateFields(ocrText, documentType);

    // データベースに保存（received_fax_idが指定されている場合）
    if (data.received_fax_id) {
      await prisma.receivedFaxClassification.upsert({
        where: { received_fax_id: Number(data.received_fax_id) },
        update: {
          extracted_fields: JSON.stringify(extractedFields),
        },
        create: {
          received_fax_id: Number(data.received_fax_id),
          document_type: documentType || "その他",
          confidence: 0.8,
          extracted_fields: JSON.stringify(extractedFields),
        },
      });
    }

    return NextResponse.json({
      extracted_fields: extractedFields,
      ocr_text: ocrText,
    });
  } catch (error) {
    console.error("Failed to extract fields:", error);
    return NextResponse.json(
      { error: "Failed to extract fields" },
      { status: 500 }
    );
  }
}







