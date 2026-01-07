import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// AI要約を生成
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);

    const fax = await prisma.fax.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
        company: true
      }
    });

    if (!fax) {
      return NextResponse.json({ error: "Fax not found" }, { status: 404 });
    }

    // AI要約を生成（現在は簡易的な要約を生成）
    // TODO: 実際のAI API（OpenAI、Claude等）を統合
    const summary = generateSummary(fax);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}

// 簡易的な要約生成（実際のAI APIに置き換える）
function generateSummary(fax: any): string {
  const parts: string[] = [];
  
  parts.push(`このFAXは${fax.property?.name || '物件'}に関する内見申請です。`);
  
  if (fax.company?.name) {
    parts.push(`管理会社: ${fax.company.name}。`);
  }
  
  if (fax.visit_date) {
    parts.push(`内見希望日: ${fax.visit_date}${fax.visit_time ? ` ${fax.visit_time}` : ''}。`);
  }
  
  if (fax.notes) {
    const notesPreview = fax.notes.length > 50 ? fax.notes.substring(0, 50) + '...' : fax.notes;
    parts.push(`備考: ${notesPreview}。`);
  }
  
  if (fax.status === "success") {
    parts.push("送信は成功しました。");
  } else if (fax.status === "failed") {
    parts.push("送信に失敗しました。");
  } else if (fax.status === "scheduled") {
    parts.push("予約送信が設定されています。");
  }
  
  return parts.join(" ");
}
