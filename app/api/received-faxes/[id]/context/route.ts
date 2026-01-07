import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 文脈推測API（過去の送受信履歴と照合して「これは何のFAXか」を推測）
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);

    const receivedFax = await prisma.receivedFax.findUnique({
      where: { id }
    });

    if (!receivedFax) {
      return NextResponse.json({ error: "Received fax not found" }, { status: 404 });
    }

    // 過去の送信履歴を取得（同じ管理会社、同じ物件名で検索）
    const relatedSentFaxes = await prisma.fax.findMany({
      where: {
        OR: [
          { company: { name: receivedFax.from_company_name || undefined } },
          { property: { name: receivedFax.property_name || undefined } },
        ]
      },
      include: {
        company: true,
        property: true,
        template: true
      },
      orderBy: { sent_at: 'desc' },
      take: 10
    });

    // 文脈推測ロジック（簡易版）
    // TODO: 実際のAI API（OpenAI、Claude等）を統合
    const prediction = generateContextPrediction(receivedFax, relatedSentFaxes);

    // データベースに保存
    await prisma.receivedFax.update({
      where: { id },
      data: { 
        context_prediction: JSON.stringify(prediction),
        document_type: prediction.predicted_type,
        urgency: predictUrgency(receivedFax, relatedSentFaxes)
      }
    });

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error("Failed to generate context prediction:", error);
    return NextResponse.json({ error: "Failed to generate context prediction" }, { status: 500 });
  }
}

// 簡易的な文脈推測（実際のAI APIに置き換える）
function generateContextPrediction(receivedFax: any, relatedSentFaxes: any[]): any {
  const ocrText = (receivedFax.ocr_text || "").toLowerCase();
  
  // キーワードベースの推測
  if (ocrText.includes("内見") || ocrText.includes("見学")) {
    return {
      predicted_type: "内見申請への返信",
      confidence: 85,
      related_sent_fax_id: relatedSentFaxes.find(f => f.template?.category === "内見申請")?.id,
      explanation: "過去の内見申請FAXへの返信である可能性が高いです。"
    };
  }
  
  if (ocrText.includes("申込") || ocrText.includes("申請")) {
    return {
      predicted_type: "申込書受領通知",
      confidence: 80,
      related_sent_fax_id: relatedSentFaxes.find(f => f.template?.category === "申込書送付")?.id,
      explanation: "申込書送付に対する受領通知である可能性が高いです。"
    };
  }
  
  if (ocrText.includes("契約") || ocrText.includes("合意")) {
    return {
      predicted_type: "契約書送付",
      confidence: 75,
      explanation: "契約関連の書類である可能性が高いです。"
    };
  }

  // デフォルト
  return {
    predicted_type: "その他",
    confidence: 50,
    explanation: "内容を確認して適切な対応を行ってください。"
  };
}

// 緊急度の推測
function predictUrgency(receivedFax: any, relatedSentFaxes: any[]): string {
  const ocrText = (receivedFax.ocr_text || "").toLowerCase();
  
  // 緊急キーワード
  const urgentKeywords = ["緊急", "至急", "急ぎ", "早急", "期限", "締切"];
  if (urgentKeywords.some(keyword => ocrText.includes(keyword))) {
    return "high";
  }
  
  // 過去の送信履歴との時間差を考慮
  if (relatedSentFaxes.length > 0) {
    const lastSentFax = relatedSentFaxes[0];
    const timeDiff = new Date(receivedFax.received_at).getTime() - new Date(lastSentFax.sent_at).getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // 3日以内の返信は緊急度が高い可能性
    if (daysDiff <= 3) {
      return "medium";
    }
  }
  
  return "low";
}
