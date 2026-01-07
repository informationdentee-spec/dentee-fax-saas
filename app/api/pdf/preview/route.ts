import { NextResponse } from "next/server";
import puppeteer from "puppeteer"; // ※ npm install puppeteer が必要です

export async function POST(req: Request) {
  try {
    const data = await req.json(); // フロントエンドから物件情報などを受け取る

    // 1. ブラウザを起動 (Puppeteer)
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // 2. HTMLコンテンツを作成 (内見依頼書のテンプレート)
    // ※ 本来はReactコンポーネントから生成しますが、MVPではHTML文字列を埋め込みます
    const content = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .box { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
            .label { font-weight: bold; color: #555; font-size: 0.9em; }
            .value { font-size: 1.2em; margin-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #777; }
          </style>
        </head>
        <body>
          <h1>内見依頼書</h1>
          
          <div class="header">
            <div>
              <p>送信日: ${new Date().toLocaleDateString()}</p>
              <p>宛先: <strong>${data.company_name || "管理会社様"}</strong></p>
              <p>FAX: ${data.fax_number || ""}</p>
            </div>
            <div style="text-align: right;">
              <p>送信元: 株式会社サンプル不動産</p>
              <p>担当: ${data.user_name || "担当者"}</p>
            </div>
          </div>

          <div class="box">
            <p class="label">下記物件の内見をお願いいたします。</p>
            <div class="value">物件名： ${data.property_name}</div>
            <div class="value">住所： ${data.property_address}</div>
            <div class="value">部屋番号： ${data.room_number || "未定"}</div>
          </div>

          <div class="box">
            <p class="label">内見希望日時</p>
            <div class="value">
              ${data.visit_date ? new Date(data.visit_date).toLocaleDateString() : "指定なし"} 
              ${data.visit_time || ""}
            </div>
          </div>
          
          <div class="footer">
             本FAXは「RealEstate FAX」より自動送信されました。
          </div>
        </body>
      </html>
    `;

    // 3. ページにセットしてPDF化
    await page.setContent(content);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    // 4. PDFデータを返す
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="preview.pdf"',
      },
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}