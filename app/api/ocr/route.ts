import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // ※ 本来はここで画像解析を行いますが、MVP動作確認のため固定データを返します
  // これにより、フロントエンドの「自動入力」が機能するか確認できます
  
  // 疑似的なウェイト（解析しているフリ）
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return NextResponse.json({
    fax_number: "03-1234-5678",
    company_name: "株式会社サンプル管理",
    company_phone: "03-9876-5432",
    property_name: "グランドメゾン渋谷",
    property_address: "東京都渋谷区神宮前1-2-3",
    room_number: "301"
  });
}
