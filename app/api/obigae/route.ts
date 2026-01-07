import { NextResponse, NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { image, obi_image, obi_scale = 100, obi_position_x = 0, obi_position_y = 0 } = await request.json();

    // 1. 帯画像が指定されている場合は、それを上から貼り付ける
    // 帯画像がない場合は、従来のテキストベースの帯を生成
    const settings = await prisma.settings.findFirst();
    const obiImageToUse = obi_image || settings?.obi_image;
    const scale = Number(obi_scale) || 100;
    const positionX = Number(obi_position_x) || 0;
    const positionY = Number(obi_position_y) || 0;

    // 2. HTML組み立て
    let htmlContent = '';
    
    if (obiImageToUse) {
      // 帯画像を使用する場合
      // マイソク画像のサイズを維持したまま、その下部に帯を貼り付ける
      htmlContent = `
        <html>
          <head>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body, html { 
                width: 100%; 
                height: 100%; 
                overflow: visible;
              }
              .container { 
                position: relative; 
                display: inline-block;
                width: auto;
                height: auto;
              }
              
              /* 元のマイソク画像 - サイズを維持 */
              .mysoku-img { 
                display: block;
                width: auto;
                height: auto;
                max-width: none;
                max-height: none;
              }

              /* 帯画像（オーバーレイ、マイソク図面上に表示） */
              .obi-image {
                position: absolute;
                width: ${scale}%;
                height: auto;
                max-width: 100%;
                display: block;
                object-fit: contain;
                left: ${positionX}px;
                top: ${positionY}px;
                z-index: 10;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${image}" class="mysoku-img" />
              <img src="${obiImageToUse}" class="obi-image" />
            </div>
          </body>
        </html>
      `;
    } else {
      // テキストベースの帯を生成（従来の方法）
      const company = await prisma.company.findFirst();
      const companyName = company?.name || "株式会社サンプル不動産";
      const companyPhone = company?.phone || "03-0000-0000";
      const companyAddress = company?.address || "東京都渋谷区...";
      const companyLicense = company?.license_number || "";

      htmlContent = `
        <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
              .container { position: relative; width: 100%; height: 100%; }
              
              /* 元のマイソク画像 */
              .mysoku-img { 
                width: 100%; 
                height: 100%; 
                object-fit: contain;
              }

              /* 自社帯（オーバーレイ） */
              .obi-band {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 12%;
                background-color: white;
                border-top: 2px solid #333;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 40px;
                box-sizing: border-box;
                font-family: 'Helvetica', 'Arial', sans-serif;
                z-index: 10;
              }

              .company-info h1 { margin: 0; font-size: 24px; color: #0044cc; }
              .company-info p { margin: 5px 0 0; font-size: 14px; color: #555; }
              .contact-info { text-align: right; }
              .phone { font-size: 28px; font-weight: bold; color: #333; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${image}" class="mysoku-img" />
              
              <div class="obi-band">
                <div class="company-info">
                  <h1>${companyName}</h1>
                  <p>${companyAddress ? `〒xxx-xxxx ${companyAddress}` : ''}</p>
                  ${companyLicense ? `<p>${companyLicense}</p>` : ''}
                </div>
                <div class="contact-info">
                  <div class="phone">TEL: ${companyPhone}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // 3. PuppeteerでPDF化
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    // 画像のサイズを取得して、そのサイズに合わせてPDFを生成
    const contentSize = await page.evaluate(() => {
      const img = document.querySelector('.mysoku-img') as HTMLImageElement;
      if (img) {
        return {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        };
      }
      return { width: 210, height: 297 }; // デフォルトはA4サイズ（mm）
    });
    
    // 画像のサイズに合わせてPDFを生成（A4サイズに強制しない）
    const pdfBuffer = await page.pdf({ 
      width: `${contentSize.width}px`,
      height: `${contentSize.height}px`,
      printBackground: true,
      preferCSSPageSize: true
    });
    await browser.close();

    const buffer = Buffer.from(pdfBuffer);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/pdf' },
    });

  } catch (error) {
    console.error("Obigae generation error:", error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
