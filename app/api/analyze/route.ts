import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // ※ここで本物のOCR処理を行いますが、今はモックデータを返します
  // 処理に時間がかかるフリをする（1.5秒待機）
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return NextResponse.json({
    fax_number: "03-1234-5678",
    company_name: "株式会社サンプル不動産管理",
    property_name: "グランドメゾン渋谷",
    address: "東京都渋谷区神宮前1-2-3",
    room_number: "301号室",
    // 信頼度スコアなども本来は返します
  });
}