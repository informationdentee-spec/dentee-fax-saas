import { prisma } from "@/lib/prisma";

/**
 * 自動振り分けエンジン
 * 受信FAXを担当者・部署に自動振り分けする
 */

export interface RoutingResult {
  assigned_user_id?: number;
  target_department?: string;
  rule_id?: number;
  confidence: number;
  explanation?: string;
}

/**
 * 自動振り分けを実行
 */
export async function routeDocument(
  receivedFaxId: number,
  classification?: {
    document_type?: string;
    urgency?: string;
    extracted_fields?: Record<string, any>;
  }
): Promise<RoutingResult> {
  // 振り分けルールを取得（優先度順）
  const rules = await prisma.autoRoutingRule.findMany({
    where: { is_active: true },
    orderBy: { priority: "desc" },
    include: {
      target_user: true,
    },
  });

  // 受信FAX情報を取得
  const receivedFax = await prisma.receivedFax.findUnique({
    where: { id: receivedFaxId },
  });

  if (!receivedFax) {
    throw new Error("Received fax not found");
  }

  // 分類情報を取得
  const faxClassification = await prisma.receivedFaxClassification.findUnique({
    where: { received_fax_id: receivedFaxId },
  });

  const docType =
    classification?.document_type ||
    faxClassification?.document_type ||
    receivedFax.document_type ||
    "その他";
  const urgency =
    classification?.urgency || receivedFax.urgency || "low";

  // 各ルールを評価
  for (const rule of rules) {
    try {
      const conditions = JSON.parse(rule.conditions);

      // 条件をチェック
      let matches = true;

      if (conditions.document_type && conditions.document_type !== docType) {
        matches = false;
      }

      if (conditions.urgency && conditions.urgency !== urgency) {
        matches = false;
      }

      if (conditions.from_company_name) {
        if (
          !receivedFax.from_company_name ||
          !receivedFax.from_company_name.includes(conditions.from_company_name)
        ) {
          matches = false;
        }
      }

      if (conditions.property_name) {
        if (
          !receivedFax.property_name ||
          !receivedFax.property_name.includes(conditions.property_name)
        ) {
          matches = false;
        }
      }

      // 条件に一致した場合は振り分け
      if (matches) {
        return {
          assigned_user_id: rule.target_user_id || undefined,
          target_department: rule.target_department || undefined,
          rule_id: rule.id,
          confidence: 0.9,
          explanation: `ルール「${rule.name}」に一致しました`,
        };
      }
    } catch (error) {
      console.error(`Failed to evaluate rule ${rule.id}:`, error);
      continue;
    }
  }

  // デフォルト: 振り分けなし
  return {
    confidence: 0.5,
    explanation: "一致する振り分けルールが見つかりませんでした",
  };
}







