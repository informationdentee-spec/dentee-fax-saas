import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// AI要約を生成
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);

    const fax = await prisma.receivedFax.findUnique({
      where: { id }
    });

    if (!fax) {
      return NextResponse.json({ error: "Received fax not found" }, { status: 404 });
    }

    // AI要約を生成（現在は簡易的な要約を生成）
    // TODO: 実際のAI API（OpenAI、Claude等）を統合
    const summary = generateSummary(fax);

    // 要約をデータベースに保存
    await prisma.receivedFax.update({
      where: { id },
      data: { ai_summary: summary }
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}

// 簡易的な要約生成（実際のAI APIに置き換える）
function generateSummary(fax: any): string {
  const parts: string[] = [];
  
  if (fax.from_company_name) {
    parts.push(`${fax.from_company_name}から受信したFAXです。`);
  } else {
    parts.push(`FAX番号 ${fax.from_fax_number}から受信したFAXです。`);
  }
  
  if (fax.property_name) {
    parts.push(`物件名: ${fax.property_name}。`);
  }
  
  if (fax.room_number) {
    parts.push(`号室: ${fax.room_number}。`);
  }
  
  if (fax.ocr_text) {
    const textPreview = fax.ocr_text.length > 100 ? fax.ocr_text.substring(0, 100) + '...' : fax.ocr_text;
    parts.push(`内容: ${textPreview}。`);
  }
  
  return parts.join(" ");
}
