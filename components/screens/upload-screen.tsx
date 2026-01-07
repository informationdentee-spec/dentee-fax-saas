"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

import { EditScreen } from "./edit-screen";
import { PdfScreen } from "./pdf-screen";
import { CompleteScreen } from "./complete-screen";
import { FaxTypeSelectionScreen } from "./fax-type-selection-screen";

interface UploadScreenProps {
  onAnalyzeComplete: () => void;
  onNavigateToHistory?: () => void;
  initialEditData?: any;
  onEditDataCleared?: () => void;
}

type Step = "type-selection" | "upload" | "edit" | "preview" | "complete";

export function UploadScreen({ onAnalyzeComplete, onNavigateToHistory, initialEditData, onEditDataCleared }: UploadScreenProps) {
  const [step, setStep] = useState<Step>(initialEditData ? "edit" : "type-selection");
  const [selectedFaxType, setSelectedFaxType] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // 複製時に図面プレビューを表示するため
  useEffect(() => {
    if (initialEditData?.uploadedImageUrl) {
      setUploadedImages([{ 
        file: new File([], 'duplicated'), 
        imageUrl: initialEditData.uploadedImageUrl, 
        text: "",
        fileName: initialEditData.fileName || '複製された画像'
      }]);
    }
  }, [initialEditData]);

  const [faxData, setFaxData] = useState({
    fax_number: initialEditData?.fax_number || "",
    company_name: initialEditData?.company_name || "",
    company_phone: initialEditData?.company_phone || "",
    property_name: initialEditData?.property_name || "",
    room_number: initialEditData?.room_number || "",
    nearest_station: initialEditData?.nearest_station || "",
    address: "",
    visit_date: initialEditData?.visit_date || "",
    visit_time: initialEditData?.visit_time || "",
    staff_name: initialEditData?.staff_name || "",
    notes: "",
    useBand: false
  });

  const [completedData, setCompletedData] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; imageUrl: string; text: string; fileName: string }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allFaxData, setAllFaxData] = useState<Array<any>>([]); // 吁E�E��E�像ごとのチE�E�Eタを管琁E
  // PDFを画像に変換する関数
  const convertPdfToImage = async (file: File): Promise<File> => {
    try {
      // pdf.jsを動皁E�E��E�読み込む
      // PDFプレビュー機能は一時的に無効化されています
      throw new Error('PDF preview is currently disabled');
      
      // Workerファイルのパスを設定！EDNから読み込む�E�E�E�E      // ブラウザ環境でのみ実行
      if (typeof window === 'undefined') {
        throw new Error('PDF conversion is only available in browser');
      }

      // Workerを設定（ブラウザ用ES Module）
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true
      });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1); // 最初のページを取得
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context not available');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // CanvasをBlobに変換
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageFile = new File([blob], file.name.replace('.pdf', '.png'), { type: 'image/png' });
            resolve(imageFile);
          } else {
            reject(new Error('Failed to convert PDF to image'));
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`PDFの変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  // 画像の前処理（OCR精度向上のため）
  const preprocessImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // 画像サイズを拡大�E�E�E�解像度向上！E 300dpi相当に
        const scale = 3.0; // より高解像度に
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 高品質な描画設宁E        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 画像データを取征E        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 1. グレースケール匁E        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;     // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
        }
        
        // 2. コントラストと明度の調整�E�E�E�より強めに�E�E�E�E        const contrast = 1.5; // より強ぁE�E��E�ントラスチE        const brightness = 10; // 明度調整
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i];
          const adjusted = Math.min(255, Math.max(0, gray * contrast + intercept + brightness));
          data[i] = adjusted;
          data[i + 1] = adjusted;
          data[i + 2] = adjusted;
        }
        
        // 3. 二値化�E琁E�E��E�白黒化�E�E�E�E 閾値を動皁E�E��E�決定（大津の方法�E簡易版�E�E�E�E        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += data[i];
          count++;
        }
        const threshold = sum / count; // 平坁E�E��E�を閾値として使用
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i];
          const binary = gray > threshold ? 255 : 0;
          data[i] = binary;
          data[i + 1] = binary;
          data[i + 2] = binary;
        }
        
        // 4. ノイズ除去�E�E�E�小さな孤立点を除去�E�E�E�E        const width = canvas.width;
        const height = canvas.height;
        const newData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const center = data[idx];
            
            // 周囲8ピクセルの平坁E�E��E�計箁E            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
                sum += data[neighborIdx];
              }
            }
            const avg = sum / 9;
            
            // 孤立点を除去�E�E�E�周囲の平坁E�E��E�大きく異なる場合！E            if (Math.abs(center - avg) > 100) {
              newData[idx] = avg;
              newData[idx + 1] = avg;
              newData[idx + 2] = avg;
            }
          }
        }
        
        ctx.putImageData(new ImageData(newData, canvas.width, canvas.height), 0, 0);
        
        // CanvasをBlobに変換
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: 'image/png' });
            resolve(processedFile);
          } else {
            reject(new Error('Failed to process image'));
          }
        }, 'image/png', 1.0);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // AI-OCR�E�E�E�Eoogle Cloud Vision API�E�E�E�を使用してチE�E��E�ストを抽出
  const extractTextWithAIOCR = async (file: File): Promise<string> => {
    setProgress(50);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr/vision', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error && !data.fallback) {
        throw new Error(data.error);
      }

      if (data.text) {
        setProgress(100);
        return data.text;
      }

      // フォールバックが忁E�E��E�な場吁E      if (data.fallback) {
        console.warn('AI-OCR failed, falling back to Tesseract:', data.error);
        throw new Error('AI-OCR unavailable');
      }

      return '';
    } catch (error) {
      console.warn('AI-OCR error:', error);
      throw error; // Tesseractにフォールバック
    }
  };

  // ファイルを�E琁E�E��E�る関数
  const processFile = async (file: File) => {
    let fileToProcess = file;

    // PDFファイルの場合�E画像に変換
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setProgress(10);
      fileToProcess = await convertPdfToImage(file);
      setProgress(30);
    }

    // まずAI-OCRを試ぁE    setProgress(40);
    try {
      const aiOcrText = await extractTextWithAIOCR(fileToProcess);
      if (aiOcrText && aiOcrText.trim().length > 0) {
        console.log('AI-OCR成功:', aiOcrText.substring(0, 100));
        return aiOcrText;
      }
    } catch (error) {
      console.warn('AI-OCR failed, using Tesseract fallback:', error);
    }

    // AI-OCRが失敗した場合、Tesseract.jsにフォールバック
    setProgress(45);
    
    // 画像�E前�E琁E�E��E�精度向上！E    try {
      fileToProcess = await preprocessImage(fileToProcess);
      setProgress(50);
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error);
      // 前�E琁E�E��E�失敗した場合�E允E�E�Eファイルを使用
    }

    // OCR処琁E�E��E�精度向上�Eための設定！E    const result = await Tesseract.recognize(
      fileToProcess,
      'jpn+eng', // 日本語と英語�E両方に対忁E      { 
        logger: m => { if (m.status === 'recognizing text') setProgress(50 + Math.floor(m.progress * 50)); },
        // OCR精度向上�Eための設宁E        tessedit_pageseg_mode: '6', // 単一の坁E�E��E�なチE�E��E�ストブロチE�E��E�として処琁E�E��E��E�Eイソクに適してぁE�E��E��E�E�E�E        tessedit_ocr_engine_mode: '1', // LSTM OCRエンジンを使用�E�E�E�高精度�E�E�E�E        // 斁E�E��E�認識�E精度向丁E        classify_bln_numeric_mode: '0',
        textord_min_linesize: '2.5',
        // 日本語認識�E精度向丁E        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいぁE�E��E�おかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもめE�E��E�よらりるれろわをんアイウエオカキクケコサシスセソタチツチE�E��E�ナニヌネノハヒフヘ�Eマミムメモヤユヨラリルレロワヲンー・�E�E�E�、。株式会社有限会社合同会社',
        // 信頼度の閾値を下げて、より多くの斁E�E��E�を認譁E        tessedit_min_char_whitelist: '',
      }
    );

    // 信頼スコアが低い斁E�E��E�を警告（デバッグ用�E�E�E�E    if (result.data.words) {
      const lowConfidenceWords = result.data.words.filter((word: any) => word.confidence < 60);
      if (lowConfidenceWords.length > 0) {
        console.warn('Low confidence words detected:', lowConfidenceWords);
      }
    }

    setProgress(100);
    return result.data.text;
  };

  // OCRチE�E��E�ストから情報を抽出する関数�E�E�E�大幁E�E��E�喁E�E��E��E�E�E�E  const extractInfoFromText = (text: string) => {
    // チE�E��E�スト�E正規化�E�E�E��E�E角�E半角�E統一、スペ�Eスの整琁E�E��E�E    const normalizedText = text
      .replace(/[�E�E�E�E�E�E�E�]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角数字を半角に
      .replace(/[�E�E�E�-�E�E�E��E�E�E�E�E�E�E�]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角英字を半角に
      .replace(/[�E�E�E�E]/g, '(')
      .replace(/[�E�E�E�E]/g, ')')
      .replace(/[ー�E�E�E�―]/g, '-')
      .replace(/\s+/g, ' ') // 褁E�E��E�のスペ�EスめEつに
      .trim();

    // FAX番号の抽出�E�E�E�褁E�E��E�のパターンを試す！E    let faxNumber = "";
    const faxPatterns = [
      /(?:FAX|fax|Fax|F|ファチE�E��E�ス|�E�E�E��E�E�E��E�E�E�|ふぁっくす)[\s:�E�E�E��E�E]*(\d{2,4}[-ー\s]\d{2,4}[-ー\s]\d{3,4})/i,
      /(?:FAX|fax|Fax|F|ファチE�E��E�ス|�E�E�E��E�E�E��E�E�E�)[\s:�E�E�E��E�E]*(\d{10,11})/i, // ハイフンなぁE      /(\d{2,4}[-ー\s]\d{2,4}[-ー\s]\d{3,4})/g, // 一般皁E�E��E�電話番号形弁E    ];
    
    for (const pattern of faxPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        faxNumber = match[1] ? match[1].replace(/[-ー\s]/g, "-") : match[0].replace(/[-ー\s]/g, "-");
        // FAX番号の妥当性チェチE�E��E��E�E�E�日本の電話番号形式！E        if (faxNumber.match(/^\d{2,4}-\d{2,4}-\d{3,4}$/)) {
          break;
        }
      }
    }

    // 電話番号の抽出�E�E�E�褁E�E��E�のパターンを試す！E    let phoneNumber = "";
    const telPatterns = [
      /(?:TEL|Tel|電話|�E�E�E��E�E�E��E�E�E�|でんわ)[\s:�E�E�E��E�E]*(\d{2,4}[-ー\s]\d{2,4}[-ー\s]\d{3,4})/i,
      /(?:TEL|Tel|電話|�E�E�E��E�E�E��E�E�E�)[\s:�E�E�E��E�E]*(\d{10,11})/i, // ハイフンなぁE      /(?:電話|でんわ)[\s:�E�E�E��E�E]*(\d{2,4}[-ー\s]\d{2,4}[-ー\s]\d{3,4})/i,
    ];
    
    for (const pattern of telPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        phoneNumber = match[1] ? match[1].replace(/[-ー\s]/g, "-") : match[0].replace(/[-ー\s]/g, "-");
        // 電話番号の妥当性チェチE�E��E�
        if (phoneNumber.match(/^\d{2,4}-\d{2,4}-\d{3,4}$/)) {
          break;
        }
      }
    }

    // 管琁E�E��E�社名�E抽出�E�E�E�不動産業界特有�Eルールを老E�E�Eした大幁E�E��E�喁E�E��E��E�E�E�E    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let companyName = "";
    
    // 不動産業界でよく使われる会社名�Eパターン
    const realEstateCompanyPatterns = [
      // パターン1: 「株式会社、E 会社名（侁E 株式会社アイルサポ�Eトハウジング�E�E�E�E      /(?:株式会社|有限会社|合同会社|合賁E�E��E�社|合名会社)\s*([^\s|]*?(?:サポ�EチEハウジング|アイル|不動産|管琁Eプロパティ|エスチE�E�EチEリビング|ハウス|ホ�Eム|レジチE�E��E�ス|マンション|ビル|コーポ|ハイチE[^\s|]*?)/,
      // パターン2: 会社吁E+ 「株式会社」（侁E アイルサポ�Eトハウジング株式会社�E�E�E�E      /([^\s|]*?(?:サポ�EチEハウジング|アイル|不動産|管琁Eプロパティ|エスチE�E�EチEリビング|ハウス|ホ�Eム|レジチE�E��E�ス|マンション|ビル|コーポ|ハイチE[^\s|]*?)\s*(?:株式会社|有限会社|合同会社|合賁E�E��E�社|合名会社)/,
      // パターン3: 不動産業界特有�Eキーワードを含む衁E      /([^\s|]*?(?:サポ�EチEハウジング|アイル|不動産|管琁Eプロパティ|エスチE�E�EチE[^\s|]*?)/,
    ];
    
    // 不動産業界でよく使われるキーワーチE    const realEstateKeywords = [
      'サポ�EチE, 'ハウジング', 'アイル', '不動産', '管琁E, '管琁E�E��E�社', 
      'プロパティ', 'エスチE�E�EチE, 'リビング', 'ハウス', 'ホ�Eム', 
      'レジチE�E��E�ス', 'マンション', 'ビル', 'コーチE, 'ハイチE, 'アパ�EチE,
      'タワー', 'パレス', 'ヒルズ', 'スクエア', 'プラザ', 'パ�Eク'
    ];
    
    // ノイズ除去: OCRでよく誤認識される斁E�E��E�を修正�E�E�E�不動産業界特有�E誤認識パターン�E�E�E�E    const cleanText = normalizedText
      .replace(/\|/g, '')
      .replace(/[導ドさい、E/g, '') // よく誤認識される斁E�E��E�を一括除去
      .replace(/賁E�E��E�|保証|賁E�E��E�|管琁E�E��E�|合訁E鍵|交揁Eg, '') // 不動産業界�E不要な単誁E      .replace(/[:�E�E�E�]/g, '')
      .replace(/[加人要]/g, '')
      .replace(/費(?![用])/g, '') // 「費用」以外�E「費」を除去
      .replace(/交(?![換代])/g, '') // 「交換」「交代」以外�E「交」を除去
      .replace(/揁E?![気])/g, '') // 「換気」以外�E「換」を除去
      .replace(/\d+[%�E�E�E�E/g, '') // パ�EセンチE�E�Eジを除去
      .replace(/\d+[冁E�E�]/g, '') // 金額を除去
      .replace(/[年月日時�E]/g, '') // 日付関連の斁E�E��E�を除去�E�E�E�誤認識が多い�E�E�E�E      .replace(/\d{4}年\d{1,2}朁Ed{1,2}日/g, '') // 日付パターンを除去
      .replace(/[()�E�E�E��E�]/g, '') // 括弧を除去
      .replace(/\s{2,}/g, ' '); // 褁E�E��E�のスペ�EスめEつに
    
    const cleanLines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // パターン1: 「株式会社、E 会社名�E完�EマッチE�E��E�最優先！E    for (const line of cleanLines) {
      // 「株式会社アイルサポ�Eトハウジング」�Eような完�Eな形弁E      const fullMatch = line.match(/(?:株式会社|有限会社|合同会社|合賁E�E��E�社|合名会社)\s*([ア-ンァ-ヶー\w\s]{5,40})/);
      if (fullMatch) {
        const candidate = fullMatch[0].trim();
        const hasKeyword = realEstateKeywords.some(keyword => candidate.includes(keyword));
        if (hasKeyword && candidate.length >= 8 && candidate.length <= 50) {
          companyName = candidate;
          break;
        }
      }
    }

    // パターン2: 会社吁E+ 「株式会社」�E完�EマッチE    if (!companyName) {
      for (const line of cleanLines) {
        const fullMatch = line.match(/([ア-ンァ-ヶー\w\s]{5,40})\s*(?:株式会社|有限会社|合同会社|合賁E�E��E�社|合名会社)/);
        if (fullMatch) {
          const candidate = fullMatch[0].trim();
          const hasKeyword = realEstateKeywords.some(keyword => candidate.includes(keyword));
          if (hasKeyword && candidate.length >= 8 && candidate.length <= 50) {
            companyName = candidate;
            break;
          }
        }
      }
    }

    // パターン3: 不動産業界特有�Eパターンで会社名を抽出
    if (!companyName) {
      for (const pattern of realEstateCompanyPatterns) {
        for (const line of cleanLines) {
          const match = line.match(pattern);
          if (match) {
            const matched = match[0].trim();
            // 不動産業界�Eキーワードを含み、E�E��E�刁E�E��E�長さであることを確誁E            const hasKeyword = realEstateKeywords.some(keyword => matched.includes(keyword));
            if (hasKeyword && matched.length >= 5 && matched.length <= 50 
                && !matched.match(/^(FAX|TEL|電話|住所|〒|物件|部屋|号室)/)
                && !matched.match(/^\d+/) // 数字で始まらなぁE                && matched.match(/[ア-ン]/)) { // 日本語を含む
              companyName = matched;
              break;
            }
          }
        }
        if (companyName) break;
      }
    }
    
    // パターン2: 「株式会社」を含む行で、不動産業界�Eキーワードも含む
    if (!companyName) {
      for (const line of cleanLines) {
        if ((line.includes('株式会社') || line.includes('有限会社') || line.includes('合同会社')) 
            && line.length >= 5 && line.length <= 50
            && !line.match(/^(FAX|TEL|電話|住所|、E/)) {
          // 不動産業界�Eキーワードを含むか確誁E          const hasKeyword = realEstateKeywords.some(keyword => line.includes(keyword));
          if (hasKeyword || line.match(/[ア-ン]{3,}/)) { // 日本語が3斁E�E��E�以上含まれる
            companyName = line;
            break;
          }
        }
      }
    }
    
    // パターン3: 電話番号やFAX番号の前にある行（より庁E�E��E�E�E��E�に検索�E�E�E�E    if (!companyName) {
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        // 次の2-3行以冁E�E��E�電話番号やFAX番号がある場吁E        for (let j = 1; j <= 3 && i + j < cleanLines.length; j++) {
          const nextLine = cleanLines[i + j];
          if (nextLine.match(/(FAX|TEL|電話|\d{2,4}[-ー\s]\d{2,4})/)) {
            // 不動産業界�Eキーワードを含むか確誁E            const hasKeyword = realEstateKeywords.some(keyword => line.includes(keyword));
            if (line.length >= 5 && line.length <= 50 
                && !line.match(/^(FAX|TEL|電話|住所|、E/)
                && (hasKeyword || line.includes('株式会社') || line.includes('有限会社') || line.includes('合同会社') || line.match(/[ア-ン]{3,}/))) {
              companyName = line;
              break;
            }
          }
        }
        if (companyName) break;
      }
    }
    
    // パターン4: チE�E��E�スト�E最初�E方にある長めE��E行（会社名�E可能性が高い�E�E�E�E    if (!companyName) {
      for (let i = 0; i < Math.min(10, cleanLines.length); i++) {
        const line = cleanLines[i];
        const hasKeyword = realEstateKeywords.some(keyword => line.includes(keyword));
        if (line.length >= 8 && line.length <= 50 
            && !line.match(/^(FAX|TEL|電話|住所|〒|物件|部屋|号室)/)
            && !line.match(/^\d+/) // 数字で始まらなぁE            && (hasKeyword || line.match(/[ア-ン]{3,}/))) { // 日本語が3斁E�E��E�以上含まれる
          companyName = line;
          break;
        }
      }
    }

    // 物件名�E抽出�E�E�E�大幁E�E��E�喁E�E��E��E�E�E�E    let propertyName = "";
    
    // パターン1: 物件名�Eキーワードを含む行（優先度: 最高！E    const propertyKeywords = /(マンション|ビル|ハイツ|レジチE�E��E�ス|アパ�EチE邸|コーポ|タワー|パレス|ハイム|メゾン|コーチEパ�Eク|ヒルズ|スクエア|プラザ|タウン|シチE�E��E�|ヴィラ|ハウス|ホ�Eム|レジチE�E��E�ス|コーポラス|アパ�EトメンチE/;
    
    // まず、キーワードを含む行を探ぁE    for (const line of cleanLines) {
      if (propertyKeywords.test(line) 
          && line.length >= 3 && line.length <= 40
          && !line.match(/^(FAX|TEL|電話|住所|〒|管琁E株式会社|有限会社|合同会社)/)
          && !line.match(/^\d+/) // 数字で始まらなぁE          && line.match(/[ア-ンァ-ヶー]/)) { // 日本語を含む
        propertyName = line;
        break;
      }
    }
    
    // パターン2: 「物件名」や「名称」などのラベルの後�E衁E    if (!propertyName) {
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (line.match(/(物件名|名称|建物名|マンション名|ビル吁E/) && i + 1 < cleanLines.length) {
          const nextLine = cleanLines[i + 1];
          if (nextLine.length >= 2 && nextLine.length <= 40
              && !nextLine.match(/^(FAX|TEL|電話|住所|〒|管琁E株式会社)/)) {
            propertyName = nextLine;
            break;
          }
        }
      }
    }
    
    // パターン3: 部屋番号のような形式（侁E 101号室、A-101など�E�E�E��E�E前征E    if (!propertyName) {
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (line.match(/(\d{3,4}号室?|[A-Z]-\d{3,4}|\d{3,4}[A-Z]|[A-Z]\d{3,4})/)) {
          // 部屋番号の前�E行を確誁E          if (i > 0) {
            const prevLine = cleanLines[i - 1];
            if (prevLine.length >= 2 && prevLine.length <= 40 
                && !prevLine.match(/^(FAX|TEL|電話|住所|〒|管琁E株式会社|部屋|号室)/)
                && prevLine.match(/[ア-ンァ-ヶー]/)) {
              propertyName = prevLine;
              break;
            }
          }
          // 部屋番号の後�E行を確認（物件名が後にある場合！E          if (i + 1 < cleanLines.length) {
            const nextLine = cleanLines[i + 1];
            if (nextLine.length >= 2 && nextLine.length <= 40 
                && !nextLine.match(/^(FAX|TEL|電話|住所|〒|管琁E株式会社)/)
                && nextLine.match(/[ア-ンァ-ヶー]/)) {
              propertyName = nextLine;
              break;
            }
          }
        }
      }
    }
    
    // パターン4: 住所の前にある行が物件名�E可能性
    if (!propertyName) {
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        const nextLine = cleanLines[i + 1] || "";
        // 次の行が住所らしぁE�E��E�合（�E道府県名や郵便番号を含む�E�E�E�E        if (nextLine.match(/(〒|都|道|府|県|币E区|町|村|丁目|番地)/) 
            && line.length >= 2 && line.length <= 40
            && !line.match(/^(FAX|TEL|電話|住所|〒|管琁E株式会社)/)
            && line.match(/[ア-ンァ-ヶー]/)) {
          propertyName = line;
          break;
        }
      }
    }
    
    // パターン5: チE�E��E�スト�E上部にある、E�E��E�刁E�E��E�長さ�E行（物件名�E可能性�E�E�E�E    if (!propertyName) {
      for (let i = 0; i < Math.min(5, cleanLines.length); i++) {
        const line = cleanLines[i];
        if (line.length >= 3 && line.length <= 30
            && !line.match(/^(FAX|TEL|電話|住所|〒|管琁E株式会社|有限会社|合同会社)/)
            && !line.match(/^\d+/) // 数字で始まらなぁE            && line.match(/[ア-ンァ-ヶー]{2,}/)) { // 日本語が2斁E�E��E�以上含まれる
          propertyName = line;
          break;
        }
      }
    }

    return { faxNumber, phoneNumber, companyName, propertyName };
  };

  // ドラチE�E��E��E�E�E�E�E��E�ロチE�E�E用のハンドラー
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (files.length === 0) {
      alert("画像また�EPDFファイルをドロチE�E�Eしてください");
      return;
    }

    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ファイル処琁E�E�E共通関数
  const processFiles = async (files: File[]) => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      const processedImages: Array<{ file: File; imageUrl: string; text: string }> = [];

      // 褁E�E��E�ファイルを頁E�E��E�処琁E      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseProgress = Math.floor((i / files.length) * 80);
        setProgress(baseProgress);
        
        try {
          // OCR処琁E          const text = await processFile(file);
          
          // 画像URLを生戁E          let imageFile = file;
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            imageFile = await convertPdfToImage(file);
          }
          
          const imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve(e.target.result as string);
              } else {
                reject(new Error('Failed to read file'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });

          processedImages.push({ file: imageFile, imageUrl, text, fileName: file.name });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          alert(`${file.name} の処琁E�E��E�失敗しました: ${fileError instanceof Error ? fileError.message : '不�Eなエラー'}`);
          continue;
        }
      }

      if (processedImages.length === 0) {
        alert("すべてのファイルの処琁E�E��E�失敗しました");
        return;
      }

      setUploadedImages(processedImages);
      setCurrentImageIndex(0);

      // 吁E�E��E�像から情報を抽出して独立したデータを作�E
      const allData = processedImages.map((image) => {
        const extracted = extractInfoFromText(image.text);
        return {
          fax_number: extracted.faxNumber,
          company_phone: extracted.phoneNumber,
          company_name: extracted.companyName,
          property_name: extracted.propertyName,
          room_number: "",
          visit_date: "",
          visit_time: "",
          staff_name: "",
          notes: "OCR読取テキスチE\n" + image.text.slice(0, 200) + (image.text.length > 200 ? "..." : ""),
          useBand: false
        };
      });

      setAllFaxData(allData);
      setFaxData(allData[0] || faxData);

      setStep("edit");
    } catch (error) {
      console.error(error);
      alert(`ファイルの読み取りに失敗しました: ${error instanceof Error ? error.message : '不�Eなエラー'}`);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processFiles(Array.from(e.target.files));
  };

  // 送信タイプ選択時の処琁E  const handleTypeSelection = (type: string) => {
    setSelectedFaxType(type);
    
    // 名刺だけFAXの場合�E、uploadをスキチE�E�Eして直接editへ
    if (type === "business_card_only") {
      setStep("edit");
      // 名刺だけFAX用の初期チE�E�Eタを設宁E      setFaxData({
        ...faxData,
        fax_type: type,
        notes: "名刺のみ送信",
      });
    } else {
      // そ�E他�Eタイプ�Euploadへ
      setStep("upload");
      setFaxData({
        ...faxData,
        fax_type: type,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[600px] py-6 px-6">

      {/* スチE�E��E�チE: 送信タイプ選抁E*/}
      {step === "type-selection" && (
        <FaxTypeSelectionScreen
          onSelectType={handleTypeSelection}
        />
      )}

      {/* スチE�E��E�チE: アチE�E�EローチE*/}
      {step === "upload" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ペ�Eジヘッダー */}
          <div className="text-center mb-8 space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep("type-selection");
                  setSelectedFaxType("");
                  setUploadedImages([]);
                }}
                className="h-8 px-3 text-xs text-[#6b7280] hover:text-slate-900"
              >
                ↁEタイプ選択に戻めE              </Button>
            </div>
            <h2 className="text-[24px] font-semibold text-slate-900 leading-[1.5]">
              {selectedFaxType === "visit_request" 
                ? "物件図面�E�E�E��E�Eイソク�E�E�E�をアチE�E�Eロードしてください"
                : "書類をアチE�E�Eロードしてください�E�E�E�任意！E}
            </h2>
            <p className="text-[14px] font-normal text-[#6b7280] leading-[1.5]">
              {selectedFaxType === "visit_request"
                ? "冁E�E��E�依頼には物件図面の添付が忁E�E��E�です、EIが�E容を読み取り、E�E��E�信先候補を自動補完しまぁE
                : "書類�E添付�E任意です。添付しなぁE�E��E�合�E名刺のみが送信されまぁE}
            </p>
            {selectedFaxType !== "visit_request" && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // ファイルなしで編雁E�E��E�面へ
                    setUploadedImages([]);
                    setAllFaxData([]);
                    setCurrentImageIndex(0);
                    setStep("edit");
                  }}
                  className="h-9 px-4 text-sm rounded-md bg-white hover:bg-[#f9fafb] border-[#e5e7eb] text-[#6b7280] hover:text-slate-900 font-normal"
                >
                  ファイルを添付せずに続けめE                </Button>
              </div>
            )}
          </div>

          {/* 大きなドラチE�E��E��E�E�E�E�E��E�ロチE�E�Eエリア */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className="border-4 border-dashed border-[#2563eb] bg-gradient-to-br from-blue-50 to-white rounded-xl p-16 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden min-h-[400px] flex items-center justify-center"
          >
            {/* 背景裁E�E��E� */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-10 left-10 w-32 h-32 bg-[#2563eb] rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#2563eb] rounded-full blur-3xl"></div>
            </div>

            <CardContent className="flex flex-col items-center justify-center text-center space-y-6 relative z-10 w-full">
              {/* アイコン */}
              <div className="p-8 bg-white rounded-2xl shadow-lg group-hover:scale-110 transition-all duration-300 border-2 border-[#2563eb]">
                {isAnalyzing ? (
                  <Loader2 className="w-16 h-16 text-[#2563eb] animate-spin" />
                ) : (
                  <Upload className="w-16 h-16 text-[#2563eb]" />
                )}
              </div>

              {/* チE�E��E�スチE*/}
              <div className="space-y-3">
                <p className="text-[24px] font-semibold text-slate-900 leading-[1.5]">
                  {isAnalyzing ? "AIが解析してぁE�E��E�ぁE.." : "PDF・画像をここにドラチE�E��E��E�E�E�E�E��E�ロチE�E�E"}
                </p>
                <p className="text-[16px] font-normal text-[#6b7280] leading-[1.5]">
                  また�EクリチE�E��E�してファイルを選抁E(JPG, PNG, PDF) - 褁E�E��E�選択可
                </p>
                <p className="text-[14px] font-normal text-[#2563eb] leading-[1.5] mt-4">
                  ✨ AIが�E動でFAX番号・物件名�E管琁E�E��E�社名を抽出しまぁE                </p>
              </div>

              {/* プログレスバ�E */}
              {isAnalyzing && (
                <div className="w-full max-w-md space-y-3">
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] transition-all duration-300 rounded-full shadow-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-[#2563eb] leading-relaxed">{progress}% 完亁E/p>
                </div>
              )}

              {/* ファイル選択�Eタン */}
              <div className="relative mt-4">
                <Input
                  type="file"
                  id="file-upload-input"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  multiple
                  disabled={isAnalyzing}
                />
                <Button
                  disabled={isAnalyzing}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  className="h-12 px-8 text-[16px] rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      ファイルを選抁E                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </div>

          {/* 選択されたファイルのリスト表示 */}
          {uploadedImages.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">選択されたファイル:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-sm text-slate-900">
                    {img.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* スチE�E��E�チE: 編雁E*/}
      {step === "edit" && (
        <EditScreen
          initialData={allFaxData[currentImageIndex] || { ...faxData, fax_type: selectedFaxType }}
          uploadedImage={uploadedImages.length > 0 ? uploadedImages[currentImageIndex]?.imageUrl : null || initialEditData?.uploadedImageUrl || null}
          uploadedImages={uploadedImages}
          currentImageIndex={currentImageIndex}
          faxType={selectedFaxType}
          onImageChange={(index) => {
            setCurrentImageIndex(index);
            // 現在のチE�E�Eタを保存してから刁E�E��E�替ぁE            if (allFaxData[currentImageIndex]) {
              const updated = [...allFaxData];
              updated[currentImageIndex] = { ...allFaxData[currentImageIndex] };
              setAllFaxData(updated);
            }
          }}
          onImageRemove={() => {
            if (uploadedImages.length === 1) {
              // 最後�E1枚�E場合�E削除してuploadスチE�E��E�プに戻めE              setUploadedImages([]);
              setAllFaxData([]);
              setCurrentImageIndex(0);
              setStep("upload");
            } else {
              // 褁E�E��E�枚ある場合�E現在の画像を削除
              const newImages = uploadedImages.filter((_, i) => i !== currentImageIndex);
              const newData = allFaxData.filter((_, i) => i !== currentImageIndex);
              setUploadedImages(newImages);
              setAllFaxData(newData);
              if (currentImageIndex >= newImages.length) {
                setCurrentImageIndex(newImages.length - 1);
              }
            }
          }}
          onImageAdd={async (file: File) => {
            try {
              setIsAnalyzing(true);
              setProgress(0);
              
              // OCR処琁E              const text = await processFile(file);
              
              // 画像URLを生戁E              let imageFile = file;
              if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                imageFile = await convertPdfToImage(file);
              }
              
              const imageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (e.target?.result) {
                    resolve(e.target.result as string);
                  } else {
                    reject(new Error('Failed to read file'));
                  }
                };
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
              });

              // 新しい画像を追加
              const newImage = { file: imageFile, imageUrl, text, fileName: file.name };
              setUploadedImages([...uploadedImages, newImage]);
              setAllFaxData([...allFaxData, { ...faxData, fax_type: selectedFaxType }]);
              setCurrentImageIndex(uploadedImages.length);
              setIsAnalyzing(false);
              setProgress(0);
            } catch (error) {
              console.error("Failed to add image:", error);
              alert(`画像�E追加に失敗しました: ${error instanceof Error ? error.message : '不�Eなエラー'}`);
              setIsAnalyzing(false);
              setProgress(0);
            }
          }}
          onBack={() => {
            if (selectedFaxType === "business_card_only") {
              setStep("type-selection");
            } else if (uploadedImages.length === 0) {
              setStep("upload");
            } else {
              setStep("upload");
            }
            setUploadedImages([]);
            setAllFaxData([]);
            setCurrentImageIndex(0);
            if (onEditDataCleared) onEditDataCleared();
          }}
          onNext={(updatedData) => {
            // 名刺だけFAXまた�Eファイルなし�E場合�E、画像なしでチE�E�Eタを保孁E            if (selectedFaxType === "business_card_only" || uploadedImages.length === 0) {
              setAllFaxData([{ ...updatedData, fax_type: selectedFaxType, image_url: null }]);
              setStep("preview");
              if (onEditDataCleared) onEditDataCleared();
              return;
            }

            // 現在の画像�EチE�E�Eタを更新�E�E�E�画像URLも含める�E�E�E�E            const updated = [...allFaxData];
            updated[currentImageIndex] = { 
              ...updatedData,
              fax_type: selectedFaxType,
              image_url: uploadedImages[currentImageIndex]?.imageUrl || null
            };
            setAllFaxData(updated);
            
            // 最後�E画像�E場合�Eプレビューへ、そぁE�E��E�なければ次の画像へ
            if (currentImageIndex < uploadedImages.length - 1) {
              const nextIndex = currentImageIndex + 1;
              setCurrentImageIndex(nextIndex);
              // 次の画像�EチE�E�Eタを読み込む�E�E�E�既存データがあれ�Eそれを使用、なければ空チE�E�Eタ�E�E�E�E              setFaxData(updated[nextIndex] || {
                fax_number: "",
                company_name: "",
                company_phone: "",
                property_name: "",
                room_number: "",
                visit_date: "",
                visit_time: "",
                staff_name: "",
                notes: "",
                useBand: false,
                fax_type: selectedFaxType
              });
            } else {
              setStep("preview");
              if (onEditDataCleared) onEditDataCleared();
            }
          }}
        />
      )}

      {/* スチE�E��E�チE: プレビュー */}
      {step === "preview" && (
        <PdfScreen
          allData={allFaxData}
          uploadedImages={uploadedImages}
          currentIndex={0}
          onBack={() => {
            if (selectedFaxType === "business_card_only" || uploadedImages.length === 0) {
              setStep("edit");
            } else {
              setStep("edit");
            }
          }}
          onComplete={(allResults) => {
            setCompletedData(allResults);
            setStep("complete");
          }}
        />
      )}

      {/* スチE�E��E�チE: 完亁E*/}
      {step === "complete" && (
        <CompleteScreen
          data={completedData}
          onReset={() => {
            setCompletedData(null);
            setUploadedImages([]);
            setCurrentImageIndex(0);
            setFaxData({ fax_number: "", company_name: "", company_phone: "", property_name: "", room_number: "", nearest_station: "", address: "", visit_date: "", visit_time: "", staff_name: "", notes: "", useBand: false });
            setSelectedFaxType("");
            setStep("type-selection");
            if (onEditDataCleared) onEditDataCleared();
            onAnalyzeComplete();
          }}
          onNavigateToHistory={onNavigateToHistory || onAnalyzeComplete}
        />
      )}
    </div>
  );
}
