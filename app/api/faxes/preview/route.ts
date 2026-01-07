import { NextResponse, NextRequest } from 'next/server';
// ※ローカル環境での動作を想定。Vercel等へのデプロイ時は chromium パッケージの調整が必要
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 1. PDF化するHTMLテンプレートの作成
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: end; }
          .title { font-size: 24px; font-weight: bold; }
          .date { font-size: 14px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .box { border: 1px solid #ccc; padding: 15px; border-radius: 4px; background: #f9f9f9; }
          .label { font-size: 12px; color: #666; margin-bottom: 5px; font-weight: bold; }
          .value { font-size: 16px; font-weight: bold; }
          .message { margin: 30px 0; padding: 20px; border: 1px solid #333; min-height: 100px; }
          .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">内見依頼書</div>
          <div class="date">${new Date().toLocaleDateString()}</div>
        </div>

        <div style="margin-bottom: 20px;">
          <div class="label">送信先 (管理会社)</div>
          <div class="value" style="font-size: 20px;">${data.company_name || '（管理会社名未入力）'} 御中</div>
          <div class="value">FAX: ${data.fax_number || '（FAX番号未入力）'}</div>
        </div>

        <div class="message">
          <p>拝啓</p>
          <p>平素は大変お世話になっております。<br>
          下記物件の内見をお願いしたく、ご連絡いたしました。</p>
          <p>何卒よろしくお願い申し上げます。</p>
        </div>

        <div class="grid">
          <div class="box">
            <div class="label">物件名</div>
            <div class="value">${data.property_name || ''}</div>
          </div>
          <div class="box">
            <div class="label">部屋番号</div>
            <div class="value">${data.room_number || ''}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="label">送信元 (仲介業者)</div>
            <div class="value">${data.sender_card?.company || '株式会社サンプル不動産'}</div>
            <div class="value" style="margin-top:5px;">担当: ${data.sender_card?.name || '担当者'}</div>
            <div class="value">TEL: ${data.sender_card?.phone || '03-0000-0000'}</div>
          </div>
          <div class="box" style="display: flex; align-items: center; justify-content: center; background: #fff;">
             ${data.sender_card ? '<div style="color:#999;">[名刺画像添付スペース]</div>' : '<div style="color:#ccc;">名刺なし</div>'}
          </div>
        </div>

        <div class="footer">
          System by RealEstate FAX MVP
        </div>
      </body>
      </html>
    `;

    // 2. Puppeteerの起動とPDF生成
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // HTMLをセット
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // PDFバッファを生成
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    // 3. レスポンスとしてPDFを返す
    const buffer = Buffer.from(pdfBuffer);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
      },
    });

  } catch (error) {
    console.error("PDF Generate Error:", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}