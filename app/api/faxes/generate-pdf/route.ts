import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { prisma } from "@/lib/prisma";

// 名刺を含む完全なFAX用紙PDFを生成
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 内見依頼書の場合、必須項目をチェック
    if (data.purpose === "visit_request" || (!data.purpose && data.property_name)) {
      if (!data.property_name || !data.company_name || !data.fax_number) {
        return NextResponse.json(
          { error: "内見依頼書には物件名、管理会社名、FAX番号が必須です" },
          { status: 400 }
        );
      }
    }

    // 会社情報と名刺テンプレートを取得
    const settings = await prisma.settings.findFirst();
    const company = await prisma.company.findFirst();
    
    // 名刺画像を生成（テンプレートまたは画像から）
    let businessCardImage = data.business_card_image || null;
    if (!businessCardImage && settings?.business_card_template && data.agent_name) {
      // 名刺テンプレートから画像を生成
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const cardRes = await fetch(`${baseUrl}/api/business-card/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: settings.business_card_template,
            variables: {
              company_name: company?.name || data.company_name || "",
              company_address: company?.address || data.company_address || "",
              company_tel: company?.phone || data.company_tel || "",
              company_fax: company?.fax || data.company_fax || "",
              company_logo_url: "",
              agent_name: data.agent_name || data.staff_name || "",
              agent_tel: data.agent_tel || "",
              agent_email: data.agent_email || "",
            },
          }),
        });
        const cardData = await cardRes.json();
        if (cardData.image) {
          businessCardImage = cardData.image;
        }
      } catch (error) {
        console.error("Failed to generate business card:", error);
      }
    }

    // FAX用紙のHTMLを生成
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
            padding: 40px;
            color: #1a1a1a;
            background: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .recipient {
            text-align: left;
            margin-bottom: 20px;
          }
          .recipient-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .content {
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .property-info {
            border: 1px solid #ccc;
            padding: 20px;
            background-color: #f9f9f9;
            margin: 20px 0;
          }
          .property-row {
            display: flex;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #ddd;
          }
          .property-label {
            font-weight: bold;
            width: 120px;
            flex-shrink: 0;
          }
          .property-value {
            flex: 1;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .sender-info {
            flex: 1;
          }
          .business-card-container {
            width: 300px;
            height: 175px;
            border: 1px solid #ccc;
            padding: 10px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .business-card-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">内見依頼書</div>
        </div>

        <div class="recipient">
          <div class="recipient-name">${data.company_name || ""} 御中</div>
          <div>FAX: ${data.fax_number || ""}</div>
        </div>

        <div class="content">
          <p>拝啓</p>
          <p>貴社ますますご清栄のこととお慶び申し上げます。<br>
          下記物件の内見をお願いしたく、ご連絡いたしました。</p>
          <p>何卒よろしくお願い申し上げます。</p>
          <p style="text-align: right; margin-top: 20px;">敬具</p>
        </div>

        <div class="property-info">
          <div class="property-row">
            <div class="property-label">物件名:</div>
            <div class="property-value">${data.property_name || ""}</div>
          </div>
          ${data.room_number ? `
          <div class="property-row">
            <div class="property-label">号室:</div>
            <div class="property-value">${data.room_number}</div>
          </div>
          ` : ""}
          ${data.visit_date || data.visit_time ? `
          <div class="property-row">
            <div class="property-label">内見希望日時:</div>
            <div class="property-value">${data.visit_date || ""} ${data.visit_time || ""}</div>
          </div>
          ` : ""}
        </div>

        <div class="footer">
          <div class="sender-info">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">送信元</div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${company?.name || data.sender_company || data.company_name || "株式会社サンプル不動産"}</div>
            ${company?.license_number ? `<div style="font-size: 12px; margin-bottom: 5px;">免許番号: ${company.license_number}</div>` : ""}
            ${data.other_prefecture_license ? `<div style="font-size: 12px; margin-bottom: 5px;">他県免許番号: ${data.other_prefecture_license}</div>` : ""}
            <div style="font-size: 14px;">担当: ${data.agent_name || data.staff_name || ""}</div>
            <div style="font-size: 14px;">TEL: ${company?.phone || data.company_tel || ""}</div>
          </div>
          ${businessCardImage ? `
          <div class="business-card-container">
            <img src="${businessCardImage}" alt="名刺" class="business-card-image" />
          </div>
          ` : `
          <div class="business-card-container">
            <div style="color: #999; font-size: 12px;">名刺貼付</div>
          </div>
          `}
        </div>
      </body>
      </html>
    `;

    // PuppeteerでPDF生成
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fax-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate FAX PDF:", error);
    return NextResponse.json({ error: "Failed to generate FAX PDF" }, { status: 500 });
  }
}
