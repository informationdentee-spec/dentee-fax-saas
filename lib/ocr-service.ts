import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  faxNumber: string | null;
  propertyName: string | null;
}

export async function analyzeImage(file: File): Promise<OCRResult> {
  console.log("OCR解析開始:", file.name);

  // 1. Tesseract.jsで画像から文字を抽出 (日本語 + 英語)
  const { data: { text } } = await Tesseract.recognize(
    file,
    'jpn+eng', // 日本語と英語の両対応
    { 
      logger: m => console.log(m) // 進捗ログを表示
    }
  );

  console.log("抽出テキスト:", text);

  // 2. FAX番号の抽出ロジック (簡易的な正規表現)
  // 「FAX」や「F」の近くにある「03-xxxx-xxxx」のようなパターンを探します
  const faxRegex = /(?:FAX|fax|Fax|F)[\s:：]*(\d{2,4}[-\s]\d{2,4}[-\s]\d{3,4})/;
  const phoneRegex = /(\d{2,4}[-\s]\d{2,4}[-\s]\d{3,4})/; // 汎用的な電話番号パターン
  
  let extractedFax = null;
  
  // まずは明確に"FAX"と書いてある箇所を探す
  const faxMatch = text.match(faxRegex);
  if (faxMatch) {
    extractedFax = faxMatch[1].replace(/\s/g, '-'); // スペースをハイフンに統一
  } else {
    // なければ、電話番号っぽいものを探す（簡易版）
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      extractedFax = phoneMatch.replace(/\s/g, '-');
    }
  }

  // 3. 物件名の抽出ロジック (簡易版)
  // 「〇〇マンション」や「〇〇ビル」などを含む行を探す、あるいは一番上の大きな文字を採用するなど
  // ここではシンプルに「マンション」「ビル」「邸」「ハイツ」を含む行を抽出してみます
  const lines = text.split('\n');
  let extractedProperty = null;
  
  for (const line of lines) {
    if (line.match(/(マンション|ビル|ハイツ|レジデンス|アパート|邸)/) && line.length < 30) {
      extractedProperty = line.trim();
      break; // 最初に見つかったものを採用
    }
  }

  return {
    text,
    faxNumber: extractedFax,
    propertyName: extractedProperty
  };
}