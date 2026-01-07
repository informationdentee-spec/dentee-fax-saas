import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json({ obi_image: settings?.obi_image || null });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    // Settingsテーブルが存在しない場合は作成、存在する場合は更新
    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      // 既存の設定を更新
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          obi_image: body.obi_image || null
        }
      });
    } else {
      // 新規作成
      settings = await prisma.settings.create({
        data: {
          obi_image: body.obi_image || null
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

