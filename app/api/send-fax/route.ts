import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma"; // [4] Prismaクライアント
// import { generatePdf } from "@/services/pdfService"; // [5] 既存のPDF生成サービス

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fax_number, 
      company_name, 
      property_name, 
      address, 
      room_number,
      visit_date,
      visit_time,
      company_phone,
      // ログイン中のユーザーID (実際はセッションから取得)
      user_id = 1 
    } = body;

    // 1. PDF生成 (既存実装 [3][6] を利用)
    // const pdfPath = await generatePdf(body); 
    console.log("PDF generated for:", property_name);

    // 2. FAXプロバイダへ送信 (API連携)
    // ここで InterFAX や Twilio Programmable Fax などのAPIを叩く
    /*
    const providerResponse = await fetch("https://api.fax-provider.com/send", {
      method: "POST",
      body: JSON.stringify({
        destination: fax_number,
        file: pdfPath
      })
    });
    const sendResult = await providerResponse.json();
    */
    
    // モック送信結果
    const isSuccess = true; 
    
    // 3. DBへ送信履歴を保存 [7] Faxモデル定義に基づく
    const savedFax = await prisma.fax.create({
      data: {
        // [8] 必須フィールドの割り当て
        fax_number: fax_number,
        sent_at: new Date(),
        status: isSuccess ? "success" : "failed",
        
        // リレーションIDの解決 (簡易実装: 既存の会社/物件がなければ作る or 紐付けロジック)
        // ここではMVPとして、管理会社・物件マスタへの紐付けは省略し、
        // 必須の外部キー制約がある場合はダミーID、あるいはschemaを変更してOptionalにする等の対応が必要
        // 今回はシードデータ [9] にあるIDを仮定
        property: {
          create: {
            name: property_name,
            address: address || "",
            room_number: room_number || "",
            company: {
               connectOrCreate: {
                 where: { id: 1 }, // 仮
                 create: { name: company_name, phone: company_phone }
               }
            }
          }
        },
        company: {
            connect: { id: 1 } // 仮
        },
        user: {
            connect: { id: user_id }
        },
        
        notes: "初期送信",
        unlock_method: "" // 後で入力
      }
    });

    // [10] 通知処理の呼び出し (非同期)
    // sendFaxNotification(savedFax.id);

    return NextResponse.json({ 
      success: true, 
      message: "FAX transmission started",
      faxId: savedFax.id
    });

  } catch (error) {
    console.error("FAX Send Error:", error);
    return NextResponse.json({ success: false, error: "Failed to send FAX" }, { status: 500 });
  }
}