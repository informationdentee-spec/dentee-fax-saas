/**
 * 文書分類エンジン
 * 不動産業界特有の文書を分類する
 */

export interface ClassificationResult {
  document_type: string;
  confidence: number;
  explanation?: string;
}

/**
 * 文書を分類（簡易版、実際のAI APIに置き換える）
 */
export function classifyDocument(
  ocrText: string,
  metadata?: {
    from_company_name?: string;
    property_name?: string;
    room_number?: string;
  }
): ClassificationResult {
  const text = ocrText.toLowerCase();

  // キーワードベースの分類（実際のAI APIに置き換える）
  const patterns: Array<{
    type: string;
    keywords: string[];
    confidence: number;
  }> = [
    {
      type: "申込書",
      keywords: ["申込", "申請", "入居申込", "入居希望", "申込書"],
      confidence: 0.9,
    },
    {
      type: "物件確認",
      keywords: ["物件確認", "物件について", "物件情報", "確認依頼"],
      confidence: 0.85,
    },
    {
      type: "修繕依頼",
      keywords: ["修繕", "修理", "不具合", "故障", "破損", "水漏れ"],
      confidence: 0.9,
    },
    {
      type: "審査結果",
      keywords: ["審査", "審査結果", "承認", "不承認", "審査完了"],
      confidence: 0.85,
    },
    {
      type: "契約書",
      keywords: ["契約", "契約書", "賃貸借契約", "合意"],
      confidence: 0.8,
    },
    {
      type: "内見申請",
      keywords: ["内見", "見学", "内覧", "見学希望"],
      confidence: 0.85,
    },
    {
      type: "解約通知",
      keywords: ["解約", "退去", "退去予定", "解約通知"],
      confidence: 0.9,
    },
  ];

  // 各パターンとのマッチング
  let bestMatch: ClassificationResult = {
    document_type: "その他",
    confidence: 0.5,
    explanation: "分類できませんでした",
  };

  for (const pattern of patterns) {
    const matchCount = pattern.keywords.filter((keyword) =>
      text.includes(keyword)
    ).length;

    if (matchCount > 0) {
      const confidence = Math.min(
        pattern.confidence + matchCount * 0.05,
        0.95
      );

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          document_type: pattern.type,
          confidence,
          explanation: `${pattern.keywords
            .filter((k) => text.includes(k))
            .join(", ")}が検出されました`,
        };
      }
    }
  }

  // メタデータによる補正
  if (metadata?.property_name && metadata?.room_number) {
    if (bestMatch.document_type === "その他") {
      bestMatch = {
        document_type: "物件確認",
        confidence: 0.7,
        explanation: "物件情報が含まれているため物件確認の可能性が高いです",
      };
    }
  }

  return bestMatch;
}







