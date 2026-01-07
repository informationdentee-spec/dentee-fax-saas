import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// ネクストアクション提示API（推測した文脈に応じて次にやるべき行動を提示）
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const idNumber = Number(id);

    const receivedFax = await prisma.receivedFax.findUnique({
      where: { id: idNumber }
    });

    if (!receivedFax) {
      return NextResponse.json({ error: "Received fax not found" }, { status: 404 });
    }

    // 文脈推測結果を取得
    let contextPrediction = null;
    if (receivedFax.context_prediction) {
      try {
        contextPrediction = JSON.parse(receivedFax.context_prediction);
      } catch (e) {
        console.error("Failed to parse context prediction:", e);
      }
    }

    // 過去の送信履歴を取得
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
      take: 5
    });

    // ネクストアクションを生成
    // TODO: 実際のAI API（OpenAI、Claude等）を統合
    const actions = generateNextActions(receivedFax, contextPrediction, relatedSentFaxes);

    // データベースに保存
    await prisma.receivedFax.update({
      where: { id: idNumber },
      data: { next_actions: JSON.stringify(actions) }
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Failed to generate next actions:", error);
    return NextResponse.json({ error: "Failed to generate next actions" }, { status: 500 });
  }
}

// ネクストアクション生成（実際のAI APIに置き換える）
function generateNextActions(receivedFax: any, contextPrediction: any, relatedSentFaxes: any[]): any[] {
  const actions: any[] = [];
  const predictedType = contextPrediction?.predicted_type || "その他";
  const ocrText = (receivedFax.ocr_text || "").toLowerCase();

  // 文脈に応じたアクションを生成
  if (predictedType === "内見申請への返信") {
    actions.push({
      action: "受付確認を送る",
      priority: "high",
      description: "内見申請が受付されたことを確認するFAXを送信してください。"
    });
    
    if (ocrText.includes("日程") || ocrText.includes("日時")) {
      actions.push({
        action: "日程を確認する",
        priority: "medium",
        description: "内見希望日時を確認し、スケジュールを調整してください。"
      });
    }
  }

  if (predictedType === "申込書受領通知") {
    actions.push({
      action: "書類揃いましたを送る",
      priority: "high",
      description: "申込書が受領されたことを確認し、次のステップに進むためのFAXを送信してください。"
    });
    
    actions.push({
      action: "不足書類を確認する",
      priority: "medium",
      description: "必要書類が揃っているか確認してください。"
    });
  }

  if (predictedType === "契約書送付") {
    actions.push({
      action: "契約内容を確認する",
      priority: "high",
      description: "契約書の内容を確認し、必要に応じて修正依頼を行ってください。"
    });
    
    actions.push({
      action: "賃料更新する",
      priority: "medium",
      description: "契約内容に基づいて賃料情報を更新してください。"
    });
  }

  // 緊急度が高い場合の追加アクション
  if (receivedFax.urgency === "high") {
    actions.unshift({
      action: "電話で確認",
      priority: "high",
      description: "緊急度が高いため、電話で直接確認することをお勧めします。"
    });
  }

  // 過去の送信履歴がない場合
  if (relatedSentFaxes.length === 0) {
    actions.push({
      action: "初回連絡を送る",
      priority: "medium",
      description: "この管理会社・物件との初回連絡の可能性があります。適切なFAXを送信してください。"
    });
  }

  // デフォルトアクション
  if (actions.length === 0) {
    actions.push({
      action: "内容を確認する",
      priority: "low",
      description: "FAXの内容を確認し、適切な対応を行ってください。"
    });
  }

  return actions;
}
