import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: '開始日と終了日を指定してください' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 終了日の23:59:59まで

    // 開始年月と終了年月を計算
    const startYear = start.getFullYear();
    const startMonth = start.getMonth() + 1;
    const endYear = end.getFullYear();
    const endMonth = end.getMonth() + 1;

    // 該当する年月のリストを生成
    const targetMonths: Array<{ year: number; month: number }> = [];
    let currentYear = startYear;
    let currentMonth = startMonth;

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      targetMonths.push({ year: currentYear, month: currentMonth });
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    // UsageCountテーブルから該当年月のデータを取得（無期限保持、履歴削除の影響を受けない）
    const usageCounts = await prisma.usageCount.findMany({
      where: {
        OR: targetMonths.map(({ year, month }) => ({
          usage_year: year,
          usage_month: month,
        })),
      },
    });

    // 送信枚数と受信枚数を集計
    const sentCount = usageCounts.reduce((sum, count) => sum + count.sent_count, 0);
    const receivedCount = usageCounts.reduce((sum, count) => sum + count.received_count, 0);

    return NextResponse.json({
      sent_count: sentCount,
      received_count: receivedCount,
      start_date: start.toISOString(),
      end_date: end.toISOString()
    });
  } catch (error) {
    console.error("Usage query error:", error);
    return NextResponse.json({ error: '利用枚数の取得に失敗しました' }, { status: 500 });
  }
}
