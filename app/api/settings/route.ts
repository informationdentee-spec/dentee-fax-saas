import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 担当者一覧
    const users = await prisma.user.findMany();
    
    // 自社情報（最初の1件を取得、なければダミー）
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: "未設定", address: "", phone: "" }
      });
    }

    // 利用状況（履歴のカウント）
    const usage = {
      total_faxes_sent: await prisma.fax.count(),
      last_sent_at: (await prisma.fax.findFirst({ orderBy: { sent_at: 'desc' } }))?.sent_at
    };

    // システム設定（今回は固定値またはDB拡張可）
    const system = {
      timezone: "Asia/Tokyo",
      language: "ja",
      pdf_format: "A4"
    };

    // Settingsテーブルから帯画像を取得
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {}
      });
    }

    // 利用明細を取得
    const usageStatements = await prisma.usageStatement.findMany({
      orderBy: { usage_month: 'desc' }
    });

    // クレジットカード情報を取得
    const creditCards = await prisma.creditCard.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ 
      users, 
      company, 
      usage, 
      system, 
      settings, 
      usage_statements: usageStatements,
      credit_cards: creditCards
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
