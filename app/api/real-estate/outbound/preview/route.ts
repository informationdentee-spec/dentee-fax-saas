import { NextResponse } from "next/server";
import { processOCR } from "@/lib/shared/ocr-unified";

/**
 * 送信前プレビュー生成
 * POST /api/real-estate/outbound/preview
 * 
 * FAX送信前にプレビューを生成する（PDF、画像など）
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // バリデーション
    if (!data.content && !data.template_id) {
      return NextResponse.json(
        { error: "content or template_id is required" },
        { status: 400 }
      );
    }

    let previewContent = data.content;

    // テンプレートIDが指定されている場合はテンプレートを取得して自動差し込み
    if (data.template_id) {
      const autoFillRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/real-estate/outbound/auto-fill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template_id: data.template_id,
            property_id: data.property_id,
            company_id: data.company_id,
            user_id: data.user_id,
            variables: data.variables,
          }),
        }
      );

      if (autoFillRes.ok) {
        const autoFillData = await autoFillRes.json();
        previewContent = autoFillData.filled_content;
      }
    }

    // プレビュー形式に応じた処理
    let preview: any = {};

    if (data.format === "pdf") {
      // PDF生成（既存のPDF生成APIを使用）
      const pdfRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/faxes/generate-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            content: previewContent,
          }),
        }
      );

      if (pdfRes.ok) {
        const pdfData = await pdfRes.json();
        preview.pdf_url = pdfData.pdf_url;
        preview.pdf_base64 = pdfData.pdf_base64;
      }
    } else {
      // デフォルト: HTMLプレビュー
      preview.html = previewContent;
      preview.type = "html";
    }

    // OCR処理が必要な場合（画像が含まれている場合）
    if (data.image_url) {
      try {
        const ocrResult = await processOCR({
          imageUrl: data.image_url,
          options: {
            mode: "real-estate",
            documentType: data.document_type,
          },
        });

        preview.ocr_result = {
          text: ocrResult.text,
          extracted_fields: ocrResult.extractedFields,
          confidence: ocrResult.confidence,
        };
      } catch (error) {
        console.error("OCR processing failed in preview:", error);
        // OCRエラーは無視して続行
      }
    }

    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Failed to generate preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}







