import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// システム設定・通知設定の更新（Settingsテーブルは1レコードのみの前提）
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    
    // 最初の1件を取得してIDを特定（またはID:1固定）
    const first = await prisma.settings.findFirst();
    if (!first) return NextResponse.json({ error: "Settings not found" }, { status: 404 });

    const updated = await prisma.settings.update({
      where: { id: first.id },
      data: {
        // 送られてきたデータに含まれるフィールドのみ更新される
        timezone: data.timezone,
        language: data.language,
        pdf_format: data.pdf_format,
        fax_success_notify: data.fax_success_notify,
        fax_failure_notify: data.fax_failure_notify
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}