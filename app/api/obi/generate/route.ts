import { NextResponse, NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { 
      license_number, 
      address, 
      company_name, 
      phone, 
      fax, 
      holiday, 
      transaction_type 
    } = await request.json();

    // サイズ: 1,115px（横） × 140px（縦）
    const width = 1115;
    const height = 140;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: ${width}px;
              height: ${height}px;
              font-family: 'MS Gothic', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', sans-serif;
              background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
              border: 2px solid #2563eb;
              border-radius: 12px;
              padding: 14px 24px;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
            }
            .left-section {
              display: flex;
              flex-direction: column;
              justify-content: center;
              flex: 1;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }
            .license {
              font-size: 10px;
              line-height: 1.4;
              color: #374151;
              font-weight: normal;
              background: rgba(37, 99, 235, 0.1);
              padding: 2px 6px;
              border-radius: 3px;
            }
            .address {
              font-size: 10px;
              line-height: 1.4;
              color: #6b7280;
              text-align: right;
              margin-left: 20px;
            }
            .company-name {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 6px;
              line-height: 1.3;
              letter-spacing: 0.3px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }
            .info-section {
              font-size: 11px;
              line-height: 1.6;
              color: #374151;
              display: flex;
              flex-direction: row;
              gap: 18px;
              margin-bottom: 3px;
            }
            .info-line {
              margin: 0;
              padding: 2px 0;
            }
            .transaction-type {
              font-size: 10px;
              color: #6b7280;
              margin-top: 3px;
              padding-top: 3px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="left-section">
            <div class="header">
              <div class="license">${license_number || ''}</div>
              <div class="address">${address || ''}</div>
            </div>
            <div class="company-name">${company_name || ''}</div>
            <div class="info-section">
              ${phone ? `<div class="info-line">TEL: ${phone}</div>` : ''}
              ${fax ? `<div class="info-line">FAX: ${fax}</div>` : ''}
              ${holiday ? `<div class="info-line">定休日: ${holiday}</div>` : ''}
            </div>
            <div class="transaction-type">取引様態：${transaction_type || '媒介'}</div>
          </div>
        </body>
      </html>
    `;

    // Puppeteerを使用してHTMLを画像に変換
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setViewport({ width, height });
    
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height }
    });
    
    await browser.close();

    // Base64エンコード
    const buffer = Buffer.from(screenshot);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ obi_image: base64Image });

  } catch (error) {
    console.error("Obi generation error:", error);
    return NextResponse.json({ error: 'Failed to generate obi image' }, { status: 500 });
  }
}
