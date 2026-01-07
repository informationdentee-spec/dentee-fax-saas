import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logFaxSent, logFaxScheduled } from "@/lib/shared/audit-logger";
import { saveSendUsage } from "@/lib/usage/saveUsage";
import { getSupabaseUserId } from "@/lib/supabase/getUserId";

// 履歴一覧取得 (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters: any = {};

  // 日付フィルター (YYYY-MM-DD)
  const date = searchParams.get('date');
  if (date) {
    filters.sent_at = {
      gte: new Date(`${date}T00:00:00Z`),
      lt: new Date(`${date}T23:59:59Z`)
    };
  }

  // キーワード検索などが来た場合の拡張用（現在は日付のみ実装）
  
  try {
    // 関連テーブル(user, property, company)を結合(include)して取得
    const faxes = await prisma.fax.findMany({
      where: filters,
      include: {
        user: true,
        property: true,
        company: true,
        template: true
      },
      orderBy: { sent_at: 'desc' }
    });

    return NextResponse.json(faxes);
  } catch (error) {
    console.error("API Error:", error);
    // エラー時もHTMLではなくJSONを返すようにする
    return NextResponse.json({ error: "Failed to fetch faxes" }, { status: 500 });
  }
}

// 履歴登録 (POST) - 送信完了時に呼び出される
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // 管理会社を取得または作成
    let company = await prisma.company.findFirst({
      where: { name: data.company_name }
    });
    
    if (!company && data.company_name) {
      // 管理会社が存在しない場合は作成
      company = await prisma.company.create({
        data: {
          name: data.company_name,
          phone: data.company_phone || null,
          address: null
        }
      });
    }
    
    // 物件を取得または作成
    let property = await prisma.property.findFirst({
      where: { 
        name: data.property_name,
        company_id: company?.id || 1
      }
    });
    
    if (!property && data.property_name) {
      // 物件が存在しない場合は作成
      property = await prisma.property.create({
        data: {
          name: data.property_name,
          address: "",
          room_number: data.room_number || null,
          company_id: company?.id || 1
        }
      });
    }
    
    // 予約送信の場合はscheduled_atを設定
    const scheduledAt = data.scheduled_at ? new Date(data.scheduled_at) : null;
    const isScheduled = scheduledAt && scheduledAt > new Date();
    
    // データ登録処理
    const fax = await prisma.fax.create({
      data: {
        purpose: data.purpose || null, // 送信目的を保存
        property_id: property?.id || Number(data.property_id) || 1, 
        company_id: company?.id || Number(data.company_id) || 1,
        user_id: Number(data.user_id) || Number(data.staff_id) || 1,
        
        fax_number: data.fax_number,
        sent_at: isScheduled ? scheduledAt : (data.sent_at ? new Date(data.sent_at) : new Date()),
        status: isScheduled ? "scheduled" : (data.status || "pending"),
        scheduled_at: scheduledAt,
        unlock_method: data.unlock_method,
        notes: data.notes || data.template_content || null,
        image_url: data.image_url || data.uploadedImageUrl || null,
        visit_date: data.visit_date || null,
        visit_time: data.visit_time || null,
        company_phone: data.company_phone || null,
        template_id: data.template_id || null,
        retry_enabled: data.retry_enabled || false,
        retry_max: data.retry_max || 3,
        retry_interval: data.retry_interval || 60,
      },
      include: {
        user: true,
        property: true,
        company: true,
        template: true
      }
    });
    
    // 予約送信の場合は、送信ジョブをスケジュール（簡易実装：実際の送信は別途実装が必要）
    if (isScheduled && scheduledAt) {
      console.log(`Scheduled fax ${fax.id} to be sent at ${scheduledAt}`);
      // TODO: 実際の送信ジョブをスケジュール（cron/BullMQなど）
      
      // 監査ログを記録
      await logFaxScheduled(fax.id, scheduledAt, {
        userId: fax.user_id,
        metadata: {
          fax_number: fax.fax_number,
          purpose: fax.purpose,
        },
      });
    } else {
      // 即時送信の場合は送信ログを記録
      await logFaxSent(fax.id, {
        userId: fax.user_id,
        metadata: {
          fax_number: fax.fax_number,
          purpose: fax.purpose,
          status: fax.status,
        },
      });
    }

    // 利用枚数カウントを記録（送信成功時のみ、無期限保持）
    if (fax.status === 'success') {
      const sentDate = fax.sent_at;
      const year = sentDate.getFullYear();
      const month = sentDate.getMonth() + 1;

      // 年月ごとの利用枚数カウントを更新（存在しない場合は作成）
      await prisma.usageCount.upsert({
        where: {
          usage_year_usage_month: {
            usage_year: year,
            usage_month: month,
          },
        },
        update: {
          sent_count: {
            increment: 1,
          },
        },
        create: {
          usage_year: year,
          usage_month: month,
          sent_count: 1,
          received_count: 0,
        },
      });

      // Supabaseのusage_recordsにも保存（user_idが取得できる場合のみ）
      try {
        const supabaseUserId = await getSupabaseUserId(req);
        if (supabaseUserId) {
          // ページ数は仮で1ページとする（実際のPDFページ数を取得可能な場合は修正）
          const pageCount = 1;
          await saveSendUsage(supabaseUserId, sentDate, pageCount);
        }
      } catch (error) {
        // Supabaseへの保存に失敗しても既存処理は継続
        console.error('Failed to save usage to Supabase:', error);
      }
    }
    
    return NextResponse.json(fax);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to create fax record" }, { status: 500 });
  }
}
