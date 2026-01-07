import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * usage_recordsをyear_month単位で集計し、invoicesテーブルに保存
 */
export async function POST(request: NextRequest) {
  try {
    const { year_month } = await request.json();

    if (!year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
      return NextResponse.json(
        { error: 'year_month must be in YYYY-MM format' },
        { status: 400 }
      );
    }

    // usage_recordsをuser_idごとに集計
    const { data: usageRecords, error: fetchError } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('year_month', year_month);

    if (fetchError) {
      throw fetchError;
    }

    if (!usageRecords || usageRecords.length === 0) {
      return NextResponse.json({
        message: 'No usage records found for the specified month',
        invoices_created: 0,
      });
    }

    // user_idごとに集計
    const userUsageMap = new Map<string, {
      send_count: number;
      receive_count: number;
      total_pages: number;
    }>();

    for (const record of usageRecords) {
      const userId = record.user_id;
      if (!userUsageMap.has(userId)) {
        userUsageMap.set(userId, {
          send_count: 0,
          receive_count: 0,
          total_pages: 0,
        });
      }

      const usage = userUsageMap.get(userId)!;
      usage.send_count += record.send_count || 0;
      usage.receive_count += record.receive_count || 0;
      usage.total_pages += record.total_pages || 0;
    }

    // 単価設定（仮の値、実際の単価に合わせて調整）
    const PRICE_PER_PAGE = 10; // 1ページあたり10円（仮）
    const BASE_FEE = 1000; // 基本料金1000円（仮）

    // invoicesテーブルに保存
    const invoices = [];
    for (const [userId, usage] of userUsageMap.entries()) {
      // 金額計算（基本料金 + ページ数 × 単価）
      const amount = BASE_FEE + (usage.total_pages * PRICE_PER_PAGE);

      const { data: invoice, error: insertError } = await supabaseAdmin
        .from('invoices')
        .insert({
          user_id: userId,
          year_month: year_month,
          amount: amount,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to create invoice for user ${userId}:`, insertError);
        continue;
      }

      invoices.push(invoice);
    }

    return NextResponse.json({
      success: true,
      year_month: year_month,
      invoices_created: invoices.length,
      invoices: invoices,
    });
  } catch (error) {
    console.error('Failed to generate invoices:', error);
    return NextResponse.json(
      { error: '請求書の生成に失敗しました' },
      { status: 500 }
    );
  }
}

