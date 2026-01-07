// マイソク特有のフォーマットから情報を抜き出すロジック
export function parseMysokuText(fullText: string) {
  // 1. FAX番号の抽出 (「FAX: 03-xxxx-xxxx」などのパターン)
  // [1] FAX番号抽出が必要
  const faxRegex = /(?:FAX|Fax|ファックス|ＦＡＸ)[\s:：]*(\d{2,4}[-ー\s]\d{2,4}[-ー\s]\d{3,4})/i;
  const faxMatch = fullText.match(faxRegex);

  // 2. 電話番号の抽出
  const telRegex = /(?:TEL|Tel|電話|ＴＥＬ)[\s:：]*(\d{2,4}[-ー\s]\d{2,4}[-ー\s]\d{3,4})/i;
  const telMatch = fullText.match(telRegex);

  // 3. 管理会社名の推定 (「株式会社」や「不動産」を含む行を探す簡易ロジック)
  // [1] 管理会社名の抽出が必要
  const lines = fullText.split('\n');
  const companyLine = lines.find(line => 
    (line.includes('株式会社') || line.includes('有限会社') || line.includes('不動産')) &&
    line.length < 30 // 長すぎる行は説明文の可能性が高いため除外
  );

  return {
    fax_number: faxMatch ? faxMatch[2].replace(/[-ー\s]/g, '-') : "", // ハイフン統一
    company_phone: telMatch ? telMatch[2].replace(/[-ー\s]/g, '-') : "",
    company_name: companyLine ? companyLine.trim() : "",
    // 物件名や住所はOCR精度に依存するため、ここでは候補が見つからなければ空文字
    property_name: "", 
    address: ""
  };
}