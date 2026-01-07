import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 名刺テンプレートを取得
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json({ template: settings?.business_card_template || null });
  } catch (error) {
    console.error("Failed to fetch business card template:", error);
    return NextResponse.json({ error: "Failed to fetch business card template" }, { status: 500 });
  }
}

// 名刺テンプレートを保存
export async function PUT(req: Request) {
  try {
    const { template, image } = await req.json();

    // Settingsテーブルが存在しない場合は作成、存在する場合は更新
    let settings = await prisma.settings.findFirst();
    const updateData: any = {};
    if (template !== undefined) updateData.business_card_template = template;
    if (image !== undefined) updateData.business_card_image = image; // 画像も保存（スキーマに追加が必要）

    if (!settings) {
      settings = await prisma.settings.create({
        data: updateData
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      });
    }

    return NextResponse.json({ success: true, template: settings.business_card_template });
  } catch (error) {
    console.error("Failed to save business card template:", error);
    return NextResponse.json({ error: "Failed to save business card template" }, { status: 500 });
  }
}
