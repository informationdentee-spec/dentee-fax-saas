/**
 * 不動産特化OCRパーサー
 * 不動産業界特有の文書から情報を抽出する
 */

export interface RealEstateFields {
  // 基本情報
  companyName?: string;
  propertyName?: string;
  roomNumber?: string;
  faxNumber?: string;
  phoneNumber?: string;

  // 申込書関連
  contractDate?: string;
  rent?: string;
  deposit?: string;
  keyMoney?: string;
  managementFee?: string;

  // 修繕依頼関連
  repairType?: string;
  urgency?: 'high' | 'medium' | 'low';
  repairDescription?: string;

  // 物件確認関連
  confirmationDate?: string;
  confirmationType?: string;

  // その他
  date?: string;
  amount?: string;
  [key: string]: any;
}

/**
 * 不動産特化フィールド抽出
 */
export function extractRealEstateFields(
  text: string,
  documentType?: string
): RealEstateFields {
  const fields: RealEstateFields = {};
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // 文書タイプに応じた抽出ロジック
  switch (documentType) {
    case '申込書':
    case 'application':
      return extractApplicationFields(cleanText);

    case '修繕依頼':
    case 'repair_request':
      return extractRepairRequestFields(cleanText);

    case '物件確認':
    case 'property_confirmation':
      return extractPropertyConfirmationFields(cleanText);

    case '契約書':
    case 'contract':
      return extractContractFields(cleanText);

    default:
      return extractGeneralRealEstateFields(cleanText);
  }
}

/**
 * 申込書フィールド抽出
 */
function extractApplicationFields(text: string): RealEstateFields {
  const fields: RealEstateFields = {};

  // 契約日
  const contractDateMatch = text.match(
    /(契約日|契約年月日|日付)[\s:：]*(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/
  );
  if (contractDateMatch) {
    fields.contractDate = normalizeDate(contractDateMatch[2]);
  }

  // 賃料
  const rentMatch = text.match(
    /(賃料|家賃|月額)[\s:：]*(\d{1,3}[,，]\d{3}|\d{4,6})[円]?/
  );
  if (rentMatch) {
    fields.rent = normalizeAmount(rentMatch[2]);
  }

  // 敷金
  const depositMatch = text.match(
    /(敷金|保証金)[\s:：]*(\d{1,3}[,，]\d{3}|\d{4,6})[円]?/
  );
  if (depositMatch) {
    fields.deposit = normalizeAmount(depositMatch[2]);
  }

  // 礼金
  const keyMoneyMatch = text.match(
    /(礼金)[\s:：]*(\d{1,3}[,，]\d{3}|\d{4,6})[円]?/
  );
  if (keyMoneyMatch) {
    fields.keyMoney = normalizeAmount(keyMoneyMatch[2]);
  }

  // 管理費
  const managementFeeMatch = text.match(
    /(管理費|共益費)[\s:：]*(\d{1,3}[,，]\d{3}|\d{4,6})[円]?/
  );
  if (managementFeeMatch) {
    fields.managementFee = normalizeAmount(managementFeeMatch[2]);
  }

  return fields;
}

/**
 * 修繕依頼フィールド抽出
 */
function extractRepairRequestFields(text: string): RealEstateFields {
  const fields: RealEstateFields = {};

  // 修繕内容
  const repairTypeMatch = text.match(
    /(修繕内容|修理内容|不具合|故障)[\s:：]*([^\n]{10,50})/
  );
  if (repairTypeMatch) {
    fields.repairType = repairTypeMatch[2].trim();
  }

  // 緊急度
  if (text.match(/(緊急|至急|急ぎ|早急)/)) {
    fields.urgency = 'high';
  } else if (text.match(/(早め|できるだけ早く)/)) {
    fields.urgency = 'medium';
  } else {
    fields.urgency = 'low';
  }

  // 修繕説明
  const repairDescMatch = text.match(
    /(詳細|内容|説明)[\s:：]*([^\n]{20,200})/
  );
  if (repairDescMatch) {
    fields.repairDescription = repairDescMatch[2].trim();
  }

  return fields;
}

/**
 * 物件確認フィールド抽出
 */
function extractPropertyConfirmationFields(text: string): RealEstateFields {
  const fields: RealEstateFields = {};

  // 確認日
  const confirmationDateMatch = text.match(
    /(確認日|確認年月日)[\s:：]*(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/
  );
  if (confirmationDateMatch) {
    fields.confirmationDate = normalizeDate(confirmationDateMatch[2]);
  }

  // 確認タイプ
  const confirmationTypeMatch = text.match(
    /(確認内容|確認項目)[\s:：]*([^\n]{10,50})/
  );
  if (confirmationTypeMatch) {
    fields.confirmationType = confirmationTypeMatch[2].trim();
  }

  return fields;
}

/**
 * 契約書フィールド抽出
 */
function extractContractFields(text: string): RealEstateFields {
  const fields: RealEstateFields = {};

  // 契約日
  const contractDateMatch = text.match(
    /(契約日|契約年月日)[\s:：]*(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/
  );
  if (contractDateMatch) {
    fields.contractDate = normalizeDate(contractDateMatch[2]);
  }

  // 賃料
  const rentMatch = text.match(
    /(賃料|家賃|月額)[\s:：]*(\d{1,3}[,，]\d{3}|\d{4,6})[円]?/
  );
  if (rentMatch) {
    fields.rent = normalizeAmount(rentMatch[2]);
  }

  return fields;
}

/**
 * 一般的な不動産フィールド抽出
 */
function extractGeneralRealEstateFields(text: string): RealEstateFields {
  const fields: RealEstateFields = {};

  // 日付
  const dateMatch = text.match(/(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/);
  if (dateMatch) {
    fields.date = normalizeDate(dateMatch[1]);
  }

  // 金額
  const amountMatch = text.match(/(\d{1,3}[,，]\d{3}|\d{4,6})[円]/);
  if (amountMatch) {
    fields.amount = normalizeAmount(amountMatch[1]);
  }

  return fields;
}

/**
 * 日付の正規化（YYYY-MM-DD形式に変換）
 */
function normalizeDate(dateStr: string): string {
  // 年/月/日形式をYYYY-MM-DDに変換
  const normalized = dateStr
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-');

  // YYYY-MM-DD形式に変換
  const parts = normalized.split('-');
  if (parts.length === 3) {
    const year = parts[0].padStart(4, '0');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * 金額の正規化（カンマを削除）
 */
function normalizeAmount(amountStr: string): string {
  return amountStr.replace(/[,，]/g, '');
}







