import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  try {
    // 1. 元の履歴を取得
    const original = await prisma.fax.findUnique({ where: { id } });
    
    if (!original) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // 2. データを複製して新規作成（sent_atは現在時刻、statusはpendingにリセット）
    const duplicated = await prisma.fax.create({
      data: {
        property_id: original.property_id,
        company_id: original.company_id,
        user_id: original.user_id,
        fax_number: original.fax_number,
        sent_at: new Date(), // 現在時刻
        status: "pending",   // 送信待ち状態
        unlock_method: original.unlock_method,
        notes: original.notes,
      },
    });

    return NextResponse.json(duplicated);
  } catch (error) {
    console.error("Duplicate Error:", error);
    return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
