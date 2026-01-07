import { prisma } from "@/lib/prisma";

/**
 * 物件マッチングエンジン
 * 受信FAXを物件に自動紐づけする
 */

export interface PropertyMatchResult {
  property_id?: number;
  confidence: number;
  match_reason?: string;
}

/**
 * 物件マッチングを実行
 */
export async function matchProperty(
  receivedFaxId: number
): Promise<PropertyMatchResult> {
  // 受信FAX情報を取得
  const receivedFax = await prisma.receivedFax.findUnique({
    where: { id: receivedFaxId },
  });

  if (!receivedFax) {
    throw new Error("Received fax not found");
  }

  // 物件名と号室でマッチング
  if (receivedFax.property_name && receivedFax.room_number) {
    const property = await prisma.property.findFirst({
      where: {
        name: { contains: receivedFax.property_name },
        room_number: { contains: receivedFax.room_number },
      },
      include: {
        company: true,
      },
    });

    if (property) {
      // 管理会社名も一致するかチェック
      if (
        receivedFax.from_company_name &&
        property.company.name.includes(receivedFax.from_company_name)
      ) {
        return {
          property_id: property.id,
          confidence: 0.95,
          match_reason: "物件名・号室・管理会社名が一致しました",
        };
      }

      return {
        property_id: property.id,
        confidence: 0.85,
        match_reason: "物件名・号室が一致しました",
      };
    }
  }

  // 物件名のみでマッチング
  if (receivedFax.property_name) {
    const properties = await prisma.property.findMany({
      where: {
        name: { contains: receivedFax.property_name },
      },
      include: {
        company: true,
      },
      take: 5,
    });

    if (properties.length === 1) {
      return {
        property_id: properties[0].id,
        confidence: 0.7,
        match_reason: "物件名が一致しました（号室情報なし）",
      };
    } else if (properties.length > 1) {
      // 管理会社名で絞り込み
      if (receivedFax.from_company_name) {
        const matched = properties.find((p) =>
          p.company.name.includes(receivedFax.from_company_name || "")
        );

        if (matched) {
          return {
            property_id: matched.id,
            confidence: 0.8,
            match_reason:
              "物件名・管理会社名が一致しました（複数候補から選択）",
          };
        }
      }
    }
  }

  // マッチング失敗
  return {
    confidence: 0.0,
    match_reason: "一致する物件が見つかりませんでした",
  };
}







