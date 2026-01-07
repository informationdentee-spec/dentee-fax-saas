import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 シードデータの投入を開始します...");

  // 1. 担当者の作成
  const user1 = await prisma.user.upsert({
    where: { email: "taro@example.com" },
    update: {},
    create: { name: "山田 太郎", email: "taro@example.com", role: "agent" },
  });
  const user2 = await prisma.user.upsert({
    where: { email: "hanako@example.com" },
    update: {},
    create: { name: "佐藤 花子", email: "hanako@example.com", role: "agent" },
  });

  // 2. 管理会社の作成
  const company1 = await prisma.company.create({
    data: {
      name: "株式会社サンプル管理",
      phone: "03-1111-2222",
      address: "東京都新宿区西新宿1-1-1",
    },
  });
  const company2 = await prisma.company.create({
    data: {
      name: "ABC不動産ソリューション",
      phone: "03-3333-4444",
      address: "東京都渋谷区渋谷2-2-2",
    },
  });

  // 3. 物件の作成
  const property1 = await prisma.property.create({
    data: {
      name: "グランドメゾン渋谷",
      address: "東京都渋谷区渋谷1-1-1",
      room_number: "101",
      company_id: company1.id,
    },
  });
  const property2 = await prisma.property.create({
    data: {
      name: "六本木ヒルズレジデンス",
      address: "東京都港区六本木3-3-3",
      room_number: "202",
      company_id: company2.id,
    },
  });

  // 4. FAX送信履歴の作成（ダミーデータ）
  await prisma.fax.createMany({
    data: [
      {
        property_id: property1.id,
        company_id: company1.id,
        user_id: user1.id,
        fax_number: "03-5555-1111",
        sent_at: new Date("2025-12-18T09:00:00Z"),
        status: "success",
        unlock_method: "管理室で暗証番号を受け取り",
        notes: "午前中に鍵を受け取り。管理人が不在の場合は電話すること。",
      },
      {
        property_id: property2.id,
        company_id: company2.id,
        user_id: user2.id,
        fax_number: "03-5555-2222",
        sent_at: new Date("2025-12-19T14:30:00Z"),
        status: "failed",
        unlock_method: "電話で暗証番号を確認",
        notes: "FAX送信失敗、再送必要",
      },
      {
        property_id: property1.id,
        company_id: company1.id,
        user_id: user2.id,
        fax_number: "03-5555-3333",
        sent_at: new Date("2025-12-20T11:15:00Z"),
        status: "success",
        unlock_method: "現地キーボックス（番号：1122）",
        notes: "午後の内見予定。お客様をご案内。",
      },
    ],
  });

  // 5. 設定の初期値
  // ★修正: カラム名をDB定義（fax_success_notify等）に合わせ、存在しない項目を削除
  await prisma.settings.create({
    data: {
      fax_success_notify: true,  // 修正前: fax_success
      fax_failure_notify: true,  // 修正前: fax_failure
      
      // エラーログの「Available options」に基づき、会社情報もSettingsテーブルに含まれている場合はここで設定
      company_name: "株式会社サンプル不動産",
      company_address: "東京都渋谷区渋谷1-2-3",
      company_phone: "03-1234-5678",
      company_fax: "03-1234-9999",

      // ※以下の項目はエラーログの「Available options」に含まれていなかったため、
      // 現在のschema.prismaには存在しない可能性があります。一旦コメントアウトします。
      // system_updates: false,
      // timezone: "Asia/Tokyo",
      // language: "ja",
      // pdf_format: "A4",
    },
  });

  console.log("✅ シードデータの投入が完了しました！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });