import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// 管理会社検索API（名前・FAX番号で検索、過去の送信履歴も含む）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json([]);
    }

    // 1. 管理会社マスタから検索
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { fax: { contains: query } },
          { phone: { contains: query } },
        ]
      },
      include: {
        properties: {
          take: 5,
          orderBy: { name: 'asc' }
        }
      },
      take: 10
    });

    // 2. 過去の送信履歴からも検索（管理会社マスタにない場合）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365); // 過去1年分

    const pastFaxes = await prisma.fax.findMany({
      where: {
        OR: [
          { company: { name: { contains: query } } },
          { fax_number: { contains: query } },
          { company_phone: { contains: query } },
          { company: { phone: { contains: query } } },
        ],
        sent_at: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        company: true,
        property: true
      },
      orderBy: { sent_at: 'desc' },
      take: 20
    });

    // 送信履歴から管理会社情報を集計
    const faxCompaniesMap = new Map<string, {
      id: number | null;
      name: string;
      fax: string | null;
      phone: string | null;
      properties: Array<{ name: string; room_number: string | null }>;
      lastSentAt: Date;
      count: number;
    }>();

    pastFaxes.forEach(fax => {
      const companyName = fax.company?.name || "";
      if (!companyName) return;

      const key = companyName.toLowerCase();
      if (!faxCompaniesMap.has(key)) {
        faxCompaniesMap.set(key, {
          id: fax.company?.id || null,
          name: companyName,
          fax: fax.fax_number || fax.company?.fax || null,
          phone: fax.company_phone || fax.company?.phone || null,
          properties: fax.property?.name ? [{
            name: fax.property.name,
            room_number: fax.property.room_number || null
          }] : [],
          lastSentAt: fax.sent_at,
          count: 1
        });
      } else {
        const existing = faxCompaniesMap.get(key)!;
        existing.count++;
        if (fax.sent_at > existing.lastSentAt) {
          existing.lastSentAt = fax.sent_at;
        }
        // 物件情報を追加（重複排除）
        if (fax.property?.name) {
          const propExists = existing.properties.some(p => p.name === fax.property?.name);
          if (!propExists) {
            existing.properties.push({
              name: fax.property.name,
              room_number: fax.property.room_number || null
            });
          }
        }
      }
    });

    // マスタの会社と送信履歴の会社をマージ
    const allCompanies = new Map<string, any>();

    // マスタの会社を追加
    companies.forEach(company => {
      allCompanies.set(company.name.toLowerCase(), {
        id: company.id,
        name: company.name,
        fax: company.fax,
        phone: company.phone,
        properties: company.properties.map(p => ({
          name: p.name,
          room_number: p.room_number
        })),
        source: "master",
        lastSentAt: null,
        count: 0
      });
    });

    // 送信履歴の会社を追加（マスタにない場合のみ）
    faxCompaniesMap.forEach((faxCompany, key) => {
      if (!allCompanies.has(key)) {
        allCompanies.set(key, {
          id: faxCompany.id,
          name: faxCompany.name,
          fax: faxCompany.fax,
          phone: faxCompany.phone,
          properties: faxCompany.properties,
          source: "history",
          lastSentAt: faxCompany.lastSentAt,
          count: faxCompany.count
        });
      } else {
        // マスタにある場合でも、送信履歴の情報で補完
        const existing = allCompanies.get(key)!;
        if (!existing.fax && faxCompany.fax) existing.fax = faxCompany.fax;
        if (!existing.phone && faxCompany.phone) existing.phone = faxCompany.phone;
        if (faxCompany.properties.length > 0) {
          // 物件情報をマージ
          faxCompany.properties.forEach(prop => {
            const propExists = existing.properties.some(p => p.name === prop.name);
            if (!propExists) {
              existing.properties.push(prop);
            }
          });
        }
        if (faxCompany.lastSentAt) {
          existing.lastSentAt = faxCompany.lastSentAt;
          existing.count = faxCompany.count;
        }
      }
    });

    // 結果をソート（最近送信した順、またはマスタ優先）
    const result = Array.from(allCompanies.values())
      .sort((a, b) => {
        // マスタを優先
        if (a.source === "master" && b.source !== "master") return -1;
        if (a.source !== "master" && b.source === "master") return 1;
        // 最近送信した順
        if (a.lastSentAt && b.lastSentAt) {
          return b.lastSentAt.getTime() - a.lastSentAt.getTime();
        }
        if (a.lastSentAt) return -1;
        if (b.lastSentAt) return 1;
        return 0;
      })
      .slice(0, 15);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to search companies:", error);
    return NextResponse.json({ error: "Failed to search companies" }, { status: 500 });
  }
}
