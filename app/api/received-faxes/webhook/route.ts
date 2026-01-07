import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { processOCR } from "@/lib/shared/ocr-unified";
import { logFaxReceived } from "@/lib/shared/audit-logger";
import { saveReceiveUsage } from "@/lib/usage/saveUsage";
import { getSupabaseUserId } from "@/lib/supabase/getUserId";

// FAXプロバイダーからのWebhook受信エンドポイント
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Webhookの署名検証（セキュリティ）
    const webhookSecret = process.env.FAX_WEBHOOK_SECRET;
    const signature = request.headers.get("x-fax-signature");
    if (webhookSecret && signature) {
      // TODO: 署名検証ロジックを実装（HMAC等）
      // const isValid = verifySignature(data, signature, webhookSecret);
      // if (!isValid) {
      //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      // }
    }

    // FAXプロバイダーからのデータ形式を想定
    // 実際のプロバイダーに応じて調整が必要
    const faxData = {
      from_fax_number: data.from || data.from_fax_number || data.sender_fax || "",
      image_url: data.image_url || data.image || data.file_url || null,
      received_at: data.received_at || data.timestamp || new Date().toISOString(),
    };

    if (!faxData.from_fax_number) {
      return NextResponse.json({ error: "from_fax_number is required" }, { status: 400 });
    }

    // 受信FAXをデータベースに保存
    const receivedFax = await prisma.receivedFax.create({
      data: {
        from_fax_number: faxData.from_fax_number,
        from_company_name: null, // OCRで抽出
        received_at: new Date(faxData.received_at),
        image_url: faxData.image_url,
        ocr_text: null, // 自動OCRで設定
        ai_summary: null, // 後で生成
        is_read: false,
        status: "received" as any,
        urgency: "low",
      },
    });

    // 自動OCR処理（非同期）
    if (faxData.image_url) {
      processReceivedFaxOCR(receivedFax.id, faxData.image_url).catch((error) => {
        console.error(`Failed to process OCR for received fax ${receivedFax.id}:`, error);
      });
    }

    // 監査ログを記録
    await logFaxReceived(receivedFax.id, {
      metadata: {
        from_fax_number: faxData.from_fax_number,
        received_at: faxData.received_at,
      },
    });

    // 利用枚数カウントを記録（無期限保持）
    const receivedDate = receivedFax.received_at;
    const year = receivedDate.getFullYear();
    const month = receivedDate.getMonth() + 1;

    // 年月ごとの利用枚数カウントを更新（存在しない場合は作成）
    await prisma.usageCount.upsert({
      where: {
        usage_year_usage_month: {
          usage_year: year,
          usage_month: month,
        },
      },
      update: {
        received_count: {
          increment: 1,
        },
      },
      create: {
        usage_year: year,
        usage_month: month,
        sent_count: 0,
        received_count: 1,
      },
    }).catch((error) => {
      console.error(`Failed to update usage count for received fax ${receivedFax.id}:`, error);
    });

    // Supabaseのusage_recordsにも保存（user_idが取得できる場合のみ）
    try {
      const supabaseUserId = await getSupabaseUserId(request);
      if (supabaseUserId) {
        // ページ数は仮で1ページとする（実際のPDFページ数を取得可能な場合は修正）
        const pageCount = 1;
        await saveReceiveUsage(supabaseUserId, receivedDate, pageCount);
      }
    } catch (error) {
      // Supabaseへの保存に失敗しても既存処理は継続
      console.error('Failed to save usage to Supabase:', error);
    }

    return NextResponse.json({ success: true, faxId: receivedFax.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to process webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}

// 受信FAXの自動OCR処理（統合OCRサービスを使用）
async function processReceivedFaxOCR(faxId: number, imageUrl: string) {
  try {
    // 統合OCRサービスを使用してOCR処理を実行
    const ocrResult = await processOCR({
      imageUrl: imageUrl,
      options: {
        mode: 'real-estate', // 不動産特化モード
      },
    });

    // データベースを更新
    await prisma.receivedFax.update({
      where: { id: faxId },
      data: {
        ocr_text: ocrResult.text,
        from_company_name: ocrResult.extractedFields.companyName || null,
        property_name: ocrResult.extractedFields.propertyName || null,
        room_number: ocrResult.extractedFields.roomNumber || null,
        status: "processing",
      },
    });

    // AI要約を生成（非同期）
    generateAISummary(faxId).catch((error) => {
      console.error(`Failed to generate AI summary for fax ${faxId}:`, error);
    });

    // 文脈推測を実行（非同期）
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/received-faxes/${faxId}/context`, {
      method: "GET",
    }).catch((error) => {
      console.error(`Failed to generate context for fax ${faxId}:`, error);
    });
  } catch (error) {
    console.error(`OCR processing failed for fax ${faxId}:`, error);
    await prisma.receivedFax.update({
      where: { id: faxId },
      data: { status: "error" },
    });
  }
}

// AI要約を生成（簡易版、実際のAI APIに置き換える）
async function generateAISummary(faxId: number) {
  const fax = await prisma.receivedFax.findUnique({ where: { id: faxId } });
  if (!fax || !fax.ocr_text) return;

  // TODO: OpenAI API等を使用して要約を生成
  const summary = `この受信FAXは${fax.from_company_name || '不明な会社'}からのものです。${fax.property_name ? `物件名: ${fax.property_name}。` : ''}受信日時: ${new Date(fax.received_at).toLocaleString("ja-JP")}。`;

  await prisma.receivedFax.update({
    where: { id: faxId },
    data: { ai_summary: summary },
  });
}

