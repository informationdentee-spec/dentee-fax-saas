import puppeteer from 'puppeteer';

interface FaxData {
  company_name: string;
  fax_number: string;
  property_name: string;
  room_number?: string;
  address?: string;
  visit_date?: string;
  visit_time?: string;
  sender_name?: string;
  sender_company?: string;
  sender_phone?: string;
}

export async function generateFaxPdf(data: FaxData): Promise<Buffer> {
  // ブラウザ起動（軽量化のためヘッドレスモード）
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // HTMLテンプレートの作成（Tailwind CSSなどをCDNで読み込むと綺麗になりますが、今回はインラインスタイルで簡易化）
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 10px; }
        .title { font-size: 24px; font-weight: bold; }
        .date { text-align: right; font-size: 12px; margin-bottom: 20px; }
        .recipient { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .recipient-fax { font-size: 14px; margin-bottom: 30px; }
        .content { border: 1px solid #ccc; padding: 20px; background-color: #f9f9f9; }
        .row { margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
        .label { font-weight: bold; display: inline-block; width: 100px; }
        .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; display: flex; justify-content: space-between; }
        .sender-box { border: 1px solid #333; padding: 15px; width: 250px; }
      </style>
    </head>
    <body>
      <div class="date">${new Date().toLocaleDateString('ja-JP')}</div>
      
      <div class="header">
        <div class="title">内見依頼書</div>
      </div>

      <div class="recipient">${data.company_name} 御中</div>
      <div class="recipient-fax">FAX: ${data.fax_number}</div>

      <p>拝啓、貴社ますますご清栄のこととお慶び申し上げます。<br>
      下記物件の内見をお願いしたく、ご連絡いたしました。</p>

      <div class="content">
        <div class="row">
          <span class="label">物件名:</span>
          <span>${data.property_name}</span>
        </div>
        <div class="row">
          <span class="label">号室:</span>
          <span>${data.room_number || '-'}</span>
        </div>
        <div class="row">
          <span class="label">所在地:</span>
          <span>${data.address || '-'}</span>
        </div>
        <div class="row" style="margin-top: 20px;">
          <span class="label">希望日時:</span>
          <span style="font-weight:bold; font-size:1.1em;">
            ${data.visit_date || '未定'} ${data.visit_time || ''}
          </span>
        </div>
      </div>

      <div class="footer">
        <div>
          <p>お手数ですが、ご確認のほど<br>よろしくお願いいたします。</p>
        </div>
        <div class="sender-box">
          <div style="font-size:12px; color:#555;">送信元</div>
          <div style="font-weight:bold;">${data.sender_company || '株式会社サンプル不動産'}</div>
          <div>担当: ${data.sender_name || '担当者'}</div>
          <div style="font-size:12px; margin-top:5px;">TEL: ${data.sender_phone || '03-xxxx-xxxx'}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  
  // PDF生成
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}