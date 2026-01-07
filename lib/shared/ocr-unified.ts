import Tesseract from 'tesseract.js';

/**
 * OCR処理の統合リクエストインターフェース
 */
export interface UnifiedOCRRequest {
  imageUrl: string; // Base64画像データまたはURL
  options?: {
    mode?: 'general' | 'real-estate'; // OCRモード
    extractFields?: string[]; // 抽出したいフィールド
    documentType?: string; // 文書タイプ（"申込書", "契約書", "内見申請"など）
    language?: string; // OCR言語（デフォルト: "jpn+eng"）
  };
}

/**
 * OCR処理の統合結果インターフェース
 */
export interface UnifiedOCRResult {
  text: string; // 抽出されたテキスト
  extractedFields: Record<string, any>; // 抽出されたフィールド
  confidence: number; // 信頼度 (0-1)
  metadata?: Record<string, any>; // メタデータ
}

/**
 * 基本OCR処理（既存のlib/ocr-service.tsをラップ）
 */
async function processBaseOCR(
  imageUrl: string,
  language: string = 'jpn+eng'
): Promise<{ text: string; confidence: number }> {
  let imageData: string;

  // Base64データまたはURLから画像データを取得
  if (imageUrl.startsWith('data:')) {
    imageData = imageUrl;
  } else if (imageUrl.startsWith('http')) {
    // URLの場合は画像をダウンロード
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    imageData = `data:image/png;base64,${base64}`;
  } else {
    imageData = imageUrl;
  }

  // Tesseract.jsでOCR処理
  const { data } = await Tesseract.recognize(imageData, language, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR progress: ${Math.round(m.confidence || 0)}%`);
      }
    },
  });

  return {
    text: data.text,
    confidence: data.confidence ? data.confidence / 100 : 0.8, // 0-1に正規化
  };
}

/**
 * 汎用情報抽出（既存のextractInfoFromOCR関数を統合）
 */
function extractGeneralFields(text: string): Record<string, any> {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  const fields: Record<string, any> = {};

  // 会社名の抽出
  const companyMatch = cleanText.match(
    /(株式会社|有限会社|合同会社|合資会社|合名会社)[^\s\n]{0,30}/
  );
  if (companyMatch) {
    fields.companyName = companyMatch[0];
  }

  // FAX番号の抽出
  const faxRegex = /(?:FAX|fax|Fax|F)[\s:：]*(\d{2,4}[-\s]\d{2,4}[-\s]\d{3,4})/;
  const phoneRegex = /(\d{2,4}[-\s]\d{2,4}[-\s]\d{3,4})/;
  const faxMatch = text.match(faxRegex);
  if (faxMatch) {
    fields.faxNumber = faxMatch[1].replace(/\s/g, '-');
  } else {
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      fields.faxNumber = phoneMatch[1].replace(/\s/g, '-');
    }
  }

  // 物件名の抽出
  const propertyMatch = cleanText.match(
    /([^\s\n]{2,15}(マンション|アパート|ハイツ|コーポ|レジデンス|パレス|タワー|ヒルズ|ハイム|ハウス|荘|庄|ビル))/
  );
  if (propertyMatch) {
    fields.propertyName = propertyMatch[0];
  }

  // 号室の抽出
  const roomMatch = cleanText.match(/(\d{3,4}号室?|\d{1,4}-\d{1,4})/);
  if (roomMatch) {
    fields.roomNumber = roomMatch[0];
  }

  return fields;
}

/**
 * 統合OCR処理サービス
 * 既存のOCR処理を統合し、不動産特化モードに対応
 */
export async function processOCR(
  request: UnifiedOCRRequest
): Promise<UnifiedOCRResult> {
  const {
    imageUrl,
    options = {
      mode: 'general',
      language: 'jpn+eng',
    },
  } = request;

  // 1. 基本OCR処理を実行
  const baseResult = await processBaseOCR(
    imageUrl,
    options.language || 'jpn+eng'
  );

  // 2. 汎用フィールド抽出
  let extractedFields = extractGeneralFields(baseResult.text);

  // 3. 不動産特化モードの場合は追加パーサーを適用
  if (options.mode === 'real-estate') {
    const realEstateFields = await extractRealEstateFields(
      baseResult.text,
      options.documentType
    );
    extractedFields = { ...extractedFields, ...realEstateFields };
  }

  // 4. 指定されたフィールドのみを返す（オプション）
  if (options.extractFields && options.extractFields.length > 0) {
    const filteredFields: Record<string, any> = {};
    for (const field of options.extractFields) {
      if (extractedFields[field] !== undefined) {
        filteredFields[field] = extractedFields[field];
      }
    }
    extractedFields = filteredFields;
  }

  return {
    text: baseResult.text,
    extractedFields,
    confidence: baseResult.confidence,
    metadata: {
      mode: options.mode,
      documentType: options.documentType,
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * 不動産特化フィールド抽出（lib/real-estate/ocr/real-estate-parser.tsを使用）
 */
async function extractRealEstateFields(
  text: string,
  documentType?: string
): Promise<Record<string, any>> {
  const { extractRealEstateFields: extractFields } = await import(
    '@/lib/real-estate/ocr/real-estate-parser'
  );
  return extractFields(text, documentType);
}

