import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// 最近の送信先を取得（送信先候補として表示）
export async function GET(request: NextRequest) {
  try {
    // 最近30日以内に送信したFAXから、送信先を集計
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentFaxes = await prisma.fax.findMany({
      where: {
        sent_at: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        company: true,
        property: true
      },
      orderBy: { sent_at: 'desc' },
      take: 50
    });

    // 送信先を集計（重複を排除）
    const destinationsMap = new Map<string, {
      company_name: string;
      fax_number: string;
      company_phone: string | null;
      property_name: string | null;
      last_sent_at: Date;
      count: number;
    }>();

    recentFaxes.forEach(fax => {
      const key = `${fax.company.name}_${fax.fax_number}`;
      if (!destinationsMap.has(key)) {
        destinationsMap.set(key, {
          company_name: fax.company.name,
          fax_number: fax.fax_number,
          company_phone: fax.company_phone || fax.company.phone || null,
          property_name: fax.property?.name || null,
          last_sent_at: fax.sent_at,
          count: 1
        });
      } else {
        const existing = destinationsMap.get(key)!;
        existing.count++;
        if (fax.sent_at > existing.last_sent_at) {
          existing.last_sent_at = fax.sent_at;
        }
      }
    });

    const destinations = Array.from(destinationsMap.values())
      .sort((a, b) => b.last_sent_at.getTime() - a.last_sent_at.getTime())
      .slice(0, 20);

    return NextResponse.json(destinations);
  } catch (error) {
    console.error("Failed to fetch recent destinations:", error);
    return NextResponse.json({ error: "Failed to fetch recent destinations" }, { status: 500 });
  }
}
