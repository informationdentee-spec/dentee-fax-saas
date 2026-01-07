import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveReceiveUsage } from "@/lib/usage/saveUsage";
import { getSupabaseUserId } from "@/lib/supabase/getUserId";

// 受信FAX一覧取得
export async function GET() {
  try {
    const receivedFaxes = await prisma.receivedFax.findMany({
      orderBy: { received_at: 'desc' }
    });
    return NextResponse.json(receivedFaxes);
  } catch (error) {
    console.error("Failed to fetch received faxes:", error);
    return NextResponse.json({ error: "Failed to fetch received faxes" }, { status: 500 });
  }
}

// 受信FAX作成（受信時に呼び出される）
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const receivedFax = await prisma.receivedFax.create({
      data: {
        from_fax_number: data.from_fax_number,
        from_company_name: data.from_company_name || null,
        image_url: data.image_url || null,
        ocr_text: data.ocr_text || null,
        ai_summary: data.ai_summary || null,
        property_name: data.property_name || null,
        room_number: data.room_number || null,
        notes: data.notes || null,
        is_read: false,
        document_type: data.document_type || null,
        urgency: data.urgency || null,
        context_prediction: data.context_prediction ? JSON.stringify(data.context_prediction) : null,
        next_actions: data.next_actions ? JSON.stringify(data.next_actions) : null,
      }
    });

    // 自動OCR処理（画像がある場合）
    if (data.image_url && !data.ocr_text) {
      // 非同期でOCR処理を実行
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/received-faxes/${receivedFax.id}/ocr`, {
        method: "POST",
      }).catch((error) => {
        console.error(`Failed to trigger OCR for fax ${receivedFax.id}:`, error);
      });
    }

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
      const supabaseUserId = await getSupabaseUserId(req);
      if (supabaseUserId) {
        // ページ数は仮で1ページとする（実際のPDFページ数を取得可能な場合は修正）
        const pageCount = 1;
        await saveReceiveUsage(supabaseUserId, receivedDate, pageCount);
      }
    } catch (error) {
      // Supabaseへの保存に失敗しても既存処理は継続
      console.error('Failed to save usage to Supabase:', error);
    }

    return NextResponse.json(receivedFax, { status: 201 });
  } catch (error) {
    console.error("Failed to create received fax:", error);
    return NextResponse.json({ error: "Failed to create received fax" }, { status: 500 });
  }
}
