import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 3ヶ月以上経過した履歴データを削除（利用枚数カウントは削除しない）
export async function POST(req: Request) {
  try {
    // 3ヶ月前の日付を計算
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    // 3ヶ月以上経過したFaxレコードを削除
    const deletedCount = await prisma.fax.deleteMany({
      where: {
        sent_at: {
          lt: threeMonthsAgo,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount.count,
      cutoff_date: threeMonthsAgo.toISOString(),
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "履歴の削除に失敗しました" },
      { status: 500 }
    );
  }
}

