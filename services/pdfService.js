// services/pdfService.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generatePdfFromHtml(html, outputFilename) {
  const outPath = path.resolve(__dirname, '..', 'tmp');
  if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);
  const filePath = path.join(outPath, outputFilename);

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: filePath, format: 'A4', printBackground: true });
    return filePath;
  } finally {
    await browser.close();
  }
}

function buildHtmlForProperty({ companyId, property, recipientFax }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 8px; }
          .meta { margin-bottom: 16px; }
          .section { margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <h1>Fax送信依頼</h1>
        <div class="meta">
          <div><strong>会社ID:</strong> ${companyId || ''}</div>
          <div><strong>宛先FAX:</strong> ${recipientFax || ''}</div>
        </div>
        <div class="section">
          <h2>物件情報</h2>
          <div><strong>ID:</strong> ${property?.id || ''}</div>
          <div><strong>名称:</strong> ${property?.name || ''}</div>
          <div><strong>備考:</strong> ${property?.note || ''}</div>
        </div>
        <footer style="position:fixed;bottom:20px;font-size:12px;color:#666;">
          Generated: ${new Date().toLocaleString()}
        </footer>
      </body>
    </html>
  `;
}

module.exports = { generatePdfFromHtml, buildHtmlForProperty };
