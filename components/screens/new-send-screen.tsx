"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Loader2, X, Send, History, Sparkles, ChevronDown, ChevronUp, UserCircle, Calendar, FileText, Paperclip, MessageSquare, ArrowLeft, Phone, Save, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Tesseract from "tesseract.js";

interface NewSendScreenProps {
  onSendComplete: () => void;
  onNavigateToHistory?: () => void;
  initialEditData?: any;
  onEditDataCleared?: () => void;
}

type PurposeType = "visit_request" | "additional_documents" | "application" | "other" | "business_card" | null;

const PURPOSE_OPTIONS = [
  {
    id: "visit_request" as PurposeType,
    name: "内見申請",
    description: "内見希望日時を送る",
    icon: Calendar,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    requiresPdf: true,
    pdfRequired: true,
  },
  {
    id: "application" as PurposeType,
    name: "申込書の送付",
    description: "入居申込書を送る",
    icon: FileText,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    requiresPdf: true,
    pdfRequired: true,
  },
  {
    id: "additional_documents" as PurposeType,
    name: "不足書類の提出",
    description: "追加書類を送る",
    icon: Paperclip,
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    requiresPdf: false,
    pdfRequired: false,
  },
  {
    id: "other" as PurposeType,
    name: "その他",
    description: "その他のFAX送信",
    icon: MessageSquare,
    color: "bg-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
    requiresPdf: false,
    pdfRequired: false,
  },
  {
    id: "business_card" as PurposeType,
    name: "名刺だけ送る",
    description: "名刺のみを送信",
    icon: UserCircle,
    color: "bg-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
    requiresPdf: false,
    pdfRequired: false,
  },
];

export function NewSendScreen({ onSendComplete, onNavigateToHistory, initialEditData, onEditDataCleared }: NewSendScreenProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeType>(null);
  const [showVisitRequestPreview, setShowVisitRequestPreview] = useState(false);
  const [showPhoneCallScreen, setShowPhoneCallScreen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [companyData, setCompanyData] = useState<any>(null);
  const [unlockMethod, setUnlockMethod] = useState("");
  const [phoneCallNotes, setPhoneCallNotes] = useState("");
  const [currentPhoneCallIndex, setCurrentPhoneCallIndex] = useState(0);
  const [savedFaxId, setSavedFaxId] = useState<number | null>(null);
  const [hasPdf, setHasPdf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    previewUrl: string;
    companyName: string;
    faxNumber: string;
    phoneNumber: string;
    property_name: string;
    room_number: string;
    visit_date: string;
    visit_time: string;
    visit_hour: string;
    visit_minute: string;
    staff_id: string;
    staff_name: string;
    unlock_method: string;
    phone_call_notes: string;
  }>>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState({
    fax_number: "",
    company_name: "",
    company_phone: "",
    property_name: "",
    room_number: "",
    visit_date: "",
    visit_time: "",
    visit_hour: "",
    visit_minute: "",
    title: "",
    body: "",
    staff_id: "",
    staff_name: "",
  });

  // オプション
  const [attachBusinessCard, setAttachBusinessCard] = useState(false);
  const [scheduledSend, setScheduledSend] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [retryEnabled, setRetryEnabled] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedBusinessCardTemplate, setSelectedBusinessCardTemplate] = useState<string | null>(null);
  const [businessCardTemplates, setBusinessCardTemplates] = useState<Array<{ id: string; name: string; template: string; image: string | null }>>([]);
  const [saveVisitRequestTemplate, setSaveVisitRequestTemplate] = useState(false);
  const [visitRequestTemplateName, setVisitRequestTemplateName] = useState("");

  // 検索・候補
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<Array<{
    id: number | null;
    name: string;
    fax: string | null;
    phone: string | null;
    properties?: Array<{ name: string; room_number: string | null }>;
    source?: string;
    lastSentAt?: Date | null;
    count?: number;
  }>>([]);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertySearchResults, setPropertySearchResults] = useState<Array<{ id: number; name: string; room_number: string | null; company: { name: string; fax: string | null; phone: string | null } }>>([]);
  const [recentDestinations, setRecentDestinations] = useState<Array<{ company_name: string; fax_number: string; company_phone: string | null; property_name?: string | null }>>([]);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email?: string; business_card?: string; agent_tel?: string; agent_email?: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; email?: string; business_card?: string; agent_tel?: string; agent_email?: string } | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; category: string; content: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [businessCardPreview, setBusinessCardPreview] = useState<string | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const selectedPurposeConfig = PURPOSE_OPTIONS.find(p => p.id === selectedPurpose);

  // 複製・再送時の初期データ設定
  useEffect(() => {
    if (initialEditData) {
      setFormData({
        fax_number: initialEditData.fax_number || "",
        company_name: initialEditData.company_name || "",
        company_phone: initialEditData.company_phone || "",
        property_name: initialEditData.property_name || "",
        room_number: initialEditData.room_number || "",
        visit_date: initialEditData.visit_date || "",
        visit_time: initialEditData.visit_time || "",
        visit_hour: initialEditData.visit_hour || "",
        visit_minute: initialEditData.visit_minute || "",
        title: "",
        body: "",
        staff_id: initialEditData.staff_id || "",
        staff_name: initialEditData.staff_name || "",
      });

      // 目的を設定
      if (initialEditData.purpose) {
        setSelectedPurpose(initialEditData.purpose as PurposeType);
      }

      // プレビュー画像を設定
      if (initialEditData.uploadedImageUrl) {
        setPreviewImageUrl(initialEditData.uploadedImageUrl);
        setHasPdf(true);
      }

      // 担当者を設定
      if (initialEditData.staff_id && users.length > 0) {
        const user = users.find((u: any) => u.id === Number(initialEditData.staff_id));
        if (user) {
          setSelectedUser(user);
        }
      }
    }
  }, [initialEditData, users]);

  // 初期データ取得
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
          // デフォルトで最初のユーザーを選択
          if (data.users.length > 0 && !formData.staff_id) {
            const firstUser = data.users[0];
            setSelectedUser(firstUser);
            setFormData(prev => ({
              ...prev,
              staff_id: String(firstUser.id),
              staff_name: firstUser.name
            }));
          }
        }
        // 会社情報を取得
        if (data.company) {
          setCompanyData(data.company);
        }
        // 名刺テンプレートを取得
        if (data.settings?.business_card_template || data.settings?.business_card_image) {
          const templates = [];
          if (data.settings.business_card_template) {
            templates.push({
              id: "template",
              name: "HTMLテンプレート",
              template: data.settings.business_card_template,
              image: null,
            });
          }
          if (data.settings.business_card_image) {
            templates.push({
              id: "image",
              name: "アップロード画像",
              template: "",
              image: data.settings.business_card_image,
            });
          }
          setBusinessCardTemplates(templates);
          if (templates.length > 0) {
            setSelectedBusinessCardTemplate(templates[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch users:", err));

    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) setTemplates(data.templates);
        else if (Array.isArray(data)) setTemplates(data);
      })
      .catch((err) => console.error("Failed to fetch templates:", err));

    fetch("/api/faxes/recent-destinations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentDestinations(data);
      })
      .catch((err) => console.error("Failed to fetch recent destinations:", err));
  }, []);

  // 目的選択時にテンプレートを自動選択
  useEffect(() => {
    if (selectedPurpose && templates.length > 0) {
      const purposeToCategory: Record<string, string> = {
        visit_request: "内見申請",
        application: "申込書送付",
        additional_documents: "不足書類送付",
        other: "その他",
      };

      const targetCategory = purposeToCategory[selectedPurpose];
      if (targetCategory) {
        const matchingTemplate = templates.find(t => t.category === targetCategory);
        if (matchingTemplate) {
          setSelectedTemplate(matchingTemplate.id);
          setFormData(prev => ({ ...prev, body: matchingTemplate.content }));
        }
      }
    }
  }, [selectedPurpose, templates]);

  // OCR結果から自動補完（PDFアップロード時のみ）
  useEffect(() => {
    if (ocrText && !isAutoCompleting && hasPdf) {
      setIsAutoCompleting(true);
      const extracted = extractInfoFromText(ocrText);

      if (extracted.faxNumber || extracted.companyName || extracted.propertyName) {
        setFormData(prev => ({
          ...prev,
          fax_number: extracted.faxNumber || prev.fax_number,
          company_name: extracted.companyName || prev.company_name,
          company_phone: extracted.phoneNumber || prev.company_phone,
          property_name: extracted.propertyName || prev.property_name,
        }));
      }

      setTimeout(() => setIsAutoCompleting(false), 1500);
    }
  }, [ocrText, hasPdf]);

  // 会社名検索
  useEffect(() => {
    if (companySearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetch(`/api/companies/search?q=${encodeURIComponent(companySearchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setCompanySearchResults(data);
              setShowCompanySearch(true);
            }
          })
          .catch((err) => console.error("Failed to search companies:", err));
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCompanySearchResults([]);
      setShowCompanySearch(false);
    }
  }, [companySearchQuery]);

  // 物件名検索（物件名から管理会社情報を自動補完）
  useEffect(() => {
    if (propertySearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetch(`/api/properties/search?q=${encodeURIComponent(propertySearchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setPropertySearchResults(data);
              setShowPropertySearch(true);
            }
          })
          .catch((err) => console.error("Failed to search properties:", err));
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPropertySearchResults([]);
      setShowPropertySearch(false);
    }
  }, [propertySearchQuery]);

  // 名刺プレビュー生成（担当者選択時、または名刺添付時）
  useEffect(() => {
    // 担当者が選択されている場合、または名刺添付が有効な場合
    if ((attachBusinessCard || selectedPurpose === "business_card" || selectedUser) && formData.company_name) {
      // まず、担当者の名刺画像があるか確認
      if (selectedUser?.business_card) {
        // 名刺画像がある場合はそれを使用
        setBusinessCardPreview(`<img src="${selectedUser.business_card}" style="width: 100%; height: auto;" />`);
        return;
      }

      // 名刺画像がない場合は、テンプレートから生成
      const selectedTemplate = businessCardTemplates.find(t => t.id === selectedBusinessCardTemplate);
      if (selectedTemplate) {
        if (selectedTemplate.image) {
          // 画像の場合
          setBusinessCardPreview(`<img src="${selectedTemplate.image}" style="width: 100%; height: auto;" />`);
        } else if (selectedTemplate.template) {
          // HTMLテンプレートの場合
          const previewHtml = selectedTemplate.template
            .replace(/\{\{company_name\}\}/g, formData.company_name || "会社名")
            .replace(/\{\{agent_name\}\}/g, formData.staff_name || selectedUser?.name || "担当者名")
            .replace(/\{\{agent_tel\}\}/g, selectedUser?.agent_tel || formData.company_phone || "090-0000-0000")
            .replace(/\{\{agent_email\}\}/g, selectedUser?.agent_email || "agent@example.com");
          setBusinessCardPreview(previewHtml);
        }
      } else {
        // フォールバック: APIから取得
        fetch("/api/settings/business-card-template")
          .then((res) => res.json())
          .then((data) => {
            if (data.template) {
              const previewHtml = data.template
                .replace(/\{\{company_name\}\}/g, formData.company_name || "会社名")
                .replace(/\{\{agent_name\}\}/g, formData.staff_name || selectedUser?.name || "担当者名")
                .replace(/\{\{agent_tel\}\}/g, selectedUser?.agent_tel || formData.company_phone || "090-0000-0000")
                .replace(/\{\{agent_email\}\}/g, selectedUser?.agent_email || "agent@example.com");
              setBusinessCardPreview(previewHtml);
            }
          })
          .catch((err) => console.error("Failed to fetch business card template:", err));
      }
    } else {
      setBusinessCardPreview(null);
    }
  }, [attachBusinessCard, selectedPurpose, formData.company_name, formData.staff_name, formData.company_phone, selectedBusinessCardTemplate, businessCardTemplates, selectedUser]);

  // PDFを画像に変換
  const convertPdfToImage = async (file: File): Promise<string> => {
    try {
      // ブラウザ環境でのみ実行
      if (typeof window === 'undefined') {
        throw new Error('PDF conversion is only available in browser');
      }

      // pdfjs-distをブラウザ用ES Moduleとして動的インポート
      const pdfjsLib = await import('pdfjs-dist');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.js?url');

      // Workerを設定（ブラウザ用）
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context not available');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to convert PDF to image'));
          }
        });
      });
    } catch (error) {
      throw error;
    }
  };

  // ファイル処理
  const processFile = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      let imageUrl: string;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        imageUrl = await convertPdfToImage(file);
      } else {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setPreviewImageUrl(imageUrl);
      setProgress(50);

      // 申込書の場合はOCR処理をスキップ
      if (selectedPurpose === "application") {
        setOcrText("");
        setHasPdf(true);
        setUploadedFile(file);
        setIsAnalyzing(false);
        setProgress(0);
        return;
      }

      const { data: { text } } = await Tesseract.recognize(imageUrl, 'jpn+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(50 + Math.round(m.progress * 50));
          }
        },
      });

      setOcrText(text);
      setHasPdf(true);
      setUploadedFile(file);
    } catch (error) {
      console.error("File processing error:", error);
      alert(`ファイルの処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const extractInfoFromText = (text: string) => {
    const cleanText = text.replace(/\s+/g, ' ').trim();

    const faxMatch = cleanText.match(/(FAX|Fax|fax|F|f)[\s:：]*([0-9\-\(\)]+)/);
    const faxNumber = faxMatch ? faxMatch[2] : null;

    const companyMatch = cleanText.match(/(株式会社|有限会社|合同会社|合資会社|合名会社)[^\s\n]{0,30}/);
    const companyName = companyMatch ? companyMatch[0] : null;

    const phoneMatch = cleanText.match(/(TEL|Tel|tel|電話|T|t)[\s:：]*([0-9\-\(\)]+)/);
    const phoneNumber = phoneMatch ? phoneMatch[2] : null;

    const propertyMatch = cleanText.match(/([^\s\n]{2,15}(マンション|アパート|ハイツ|コーポ|レジデンス|パレス|タワー|ヒルズ|ハイム|ハウス|荘|庄))/);
    const propertyName = propertyMatch ? propertyMatch[0] : null;

    return { faxNumber, companyName, phoneNumber, propertyName };
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // 内見申請の場合は複数ファイル対応
      if (selectedPurpose === "visit_request") {
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            let previewUrl: string;
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              previewUrl = await convertPdfToImage(file);
            } else {
              previewUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            }
            return {
              file,
              previewUrl,
              companyName: "",
              faxNumber: "",
              phoneNumber: "",
              property_name: formData.property_name || "",
              room_number: formData.room_number || "",
              visit_date: "",
              visit_time: "",
              visit_hour: "",
              visit_minute: "",
              staff_id: "",
              staff_name: "",
              unlock_method: "",
              phone_call_notes: "",
            };
          })
        );
        const currentLength = uploadedFiles.length;
        setUploadedFiles(prev => [...prev, ...processedFiles]);
        setHasPdf(true);
        // 新しく追加されたファイルを選択状態にする
        if (currentLength === 0) {
          setSelectedFileIndex(0);
        } else {
          setSelectedFileIndex(currentLength);
        }
      } else {
        // その他の目的の場合は1ファイルのみ処理
        await processFile(files[0]);
      }
    }
  };

  const handleSend = async () => {
    // 複数ファイルアップロードの場合（内見申請）
    if (selectedPurpose === "visit_request" && uploadedFiles.length > 0) {
      // 各ファイルのバリデーション
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const faxNumber = (file.faxNumber || "").trim();
        const companyName = (file.companyName || "").trim();
        const visitDate = (file.visit_date || "").trim();
        const visitTime = file.visit_time || (file.visit_hour && file.visit_minute ? `${file.visit_hour}:${file.visit_minute}` : "");

        if (!faxNumber) {
          alert(`ファイル${i + 1}のFAX番号を入力してください`);
          return;
        }
        if (!companyName) {
          alert(`ファイル${i + 1}の管理会社名を入力してください`);
          return;
        }
        if (!visitDate) {
          alert(`ファイル${i + 1}の内見希望日を入力してください`);
          return;
        }
        if (!visitTime) {
          alert(`ファイル${i + 1}の内見希望時間を入力してください`);
          return;
        }
      }

      if (!confirm(`${uploadedFiles.length}件のFAXを送信しますか？`)) return;

      try {
        const savedFaxIds: number[] = [];
        let hasError = false;

        // 各ファイルごとに個別に送信
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const visitTime = file.visit_time || (file.visit_hour && file.visit_minute ? `${file.visit_hour}:${file.visit_minute}` : "");

          const sendData = {
            ...formData,
            fax_number: file.faxNumber.trim(),
            company_name: file.companyName.trim(),
            company_phone: file.phoneNumber.trim() || formData.company_phone?.trim() || null,
            purpose: selectedPurpose,
            image_url: file.previewUrl,
            scheduled_at: scheduledSend && scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : null,
            status: scheduledSend ? "scheduled" : "success",
            retry_enabled: retryEnabled,
            retry_max: 3,
            retry_interval: 60,
            template_id: selectedTemplate,
            notes: formData.body,
            visit_date: file.visit_date,
            visit_time: visitTime,
            staff_id: file.staff_id || formData.staff_id,
            staff_name: file.staff_name || formData.staff_name,
            user_id: file.staff_id || formData.staff_id,
          };

          const res = await fetch("/api/faxes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sendData),
          });

          if (res.ok) {
            const resultData = await res.json();
            savedFaxIds.push(resultData.id);
          } else {
            const errorData = await res.json().catch(() => ({}));
            alert(`ファイル${i + 1}の送信に失敗しました: ${errorData.error || '不明なエラー'}`);
            hasError = true;
            break;
          }
        }

        if (!hasError) {
          // 最初のファイルのIDを保存（電話確認画面で使用）
          if (savedFaxIds.length > 0) {
            setSavedFaxId(savedFaxIds[0]);
          }

          // その他のテンプレートを保存
          if (saveTemplate && templateName) {
            fetch("/api/templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: templateName,
                category: "その他",
                content: formData.body,
              }),
            }).catch((err) => console.error("Failed to save template:", err));
          }

          // 内見申請の場合は電話画面に遷移
          setShowVisitRequestPreview(false);
          setShowPhoneCallScreen(true);
        }
      } catch (error) {
        console.error("Send error:", error);
        alert("通信エラーが発生しました");
      }
    } else {
      // 通常のフォームの場合
      const faxNumber = (formData.fax_number || "").trim();
      const companyName = (formData.company_name || "").trim();

      if (!faxNumber) {
        alert("送信先（FAX番号・管理会社名）を入力してください\nFAX番号が入力されていません");
        return;
      }
      if (!companyName) {
        alert("送信先（FAX番号・管理会社名）を入力してください\n管理会社名が入力されていません");
        return;
      }

      // PDF必須の目的でPDFがアップロードされていない場合
      if (selectedPurposeConfig?.pdfRequired && !hasPdf) {
        alert("この目的ではPDFのアップロードが必須です");
        return;
      }

      if (!confirm("この内容でFAXを送信しますか？")) return;

      try {
        const sendData = {
          ...formData,
          fax_number: formData.fax_number?.trim(),
          company_name: formData.company_name?.trim(),
          purpose: selectedPurpose, // 送信目的を追加
          image_url: selectedPurpose === "business_card" ? null : previewImageUrl,
          scheduled_at: scheduledSend && scheduledDate && scheduledTime
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : null,
          status: scheduledSend ? "scheduled" : "success",
          retry_enabled: retryEnabled,
          retry_max: 3,
          retry_interval: 60,
          template_id: selectedTemplate,
          notes: formData.body,
        };

        const res = await fetch("/api/faxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendData),
        });

        if (res.ok) {
          const resultData = await res.json();
          setSavedFaxId(resultData.id);

          // その他のテンプレートを保存
          if (saveTemplate && templateName) {
            fetch("/api/templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: templateName,
                category: "その他",
                content: formData.body,
              }),
            }).catch((err) => console.error("Failed to save template:", err));
          }

          // 内見申請の場合は電話画面に遷移
          if (selectedPurpose === "visit_request") {
            setShowVisitRequestPreview(false);
            setShowPhoneCallScreen(true);
          } else {
            // リセット
            setHasPdf(false);
            setPreviewImageUrl(null);
            setUploadedFile(null);
            setSelectedPurpose(null);
            setFormData({
              fax_number: "",
              company_name: "",
              company_phone: "",
              property_name: "",
              room_number: "",
              visit_date: "",
              visit_time: "",
              title: "",
              body: "",
              staff_id: "",
              staff_name: "",
            });
            setBusinessCardPreview(null);

            onSendComplete();
            if (onNavigateToHistory) onNavigateToHistory();
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`送信に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      } catch (error) {
        console.error("Send error:", error);
        alert("通信エラーが発生しました");
      }
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({ ...prev, body: template.content }));
    }
  };

  // 内見依頼書プレビュー画面が表示されたときにプレビューインデックスをリセット
  useEffect(() => {
    if (showVisitRequestPreview && uploadedFiles.length > 0) {
      if (currentPreviewIndex >= uploadedFiles.length) {
        setCurrentPreviewIndex(0);
      }
    }
  }, [showVisitRequestPreview]);

  // 内見依頼書プレビュー画面
  if (showVisitRequestPreview) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">内見依頼書プレビュー</h2>
            <p className="text-[14px] font-normal text-[#6b7280] mt-1 leading-[1.5]">
              内容を確認してFAX送信を実行してください
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowVisitRequestPreview(false)}
            className="h-9 px-4 text-[14px] rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] hover:border-[#d1d5db] font-normal gap-1"
          >
            <ArrowLeft className="w-4 h-4" />戻る          </Button>
        </div>

        {selectedPurpose === "visit_request" && uploadedFiles.length > 0 ? (
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardContent className="p-6">
              <Tabs value={String(currentPreviewIndex)} onValueChange={(v) => setCurrentPreviewIndex(Number(v))}>
                <TabsList className="mb-6">
                  {uploadedFiles.map((_, index) => (
                    <TabsTrigger key={index} value={String(index)}>
                      ファイル{index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {uploadedFiles.map((fileData, index) => (
                  <TabsContent key={index} value={String(index)}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 左側：送信宛先情報 */}
                      <Card className="lg:col-span-1 bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                        <CardContent className="p-6 space-y-4">
                          <h3 className="text-[16px] font-semibold text-slate-900">送信宛先</h3>
                          <div className="space-y-3 text-sm">
                            <div>
                              <Label className="text-xs font-normal text-[#6b7280]">管理会社</Label>
                              <p className="font-semibold text-slate-900 mt-1">{fileData.companyName || "（未入力）"}</p>
                            </div>
                            <div>
                              <Label className="text-xs font-normal text-[#6b7280]">FAX番号</Label>
                              <p className="font-semibold text-lg text-slate-900 mt-1">{fileData.faxNumber || "（未入力）"}</p>
                            </div>
                            {fileData.phoneNumber && (
                              <div>
                                <Label className="text-xs font-normal text-[#6b7280]">電話番号</Label>
                                <p className="font-medium text-slate-900 mt-1">{fileData.phoneNumber}</p>
                              </div>
                            )}
                            <div className="border-t border-[#e5e7eb] pt-3 mt-3">
                              <Label className="text-xs font-normal text-[#6b7280]">内見希望日時</Label>
                              <p className="font-medium text-slate-900 mt-1">
                                {fileData.visit_date && (fileData.visit_time || (fileData.visit_hour && fileData.visit_minute))
                                  ? `${new Date(fileData.visit_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })} ${fileData.visit_time || `${fileData.visit_hour}:${fileData.visit_minute}`}`
                                  : "未定"}
                              </p>
                            </div>
                            {fileData.staff_name && (
                              <div className="border-t border-[#e5e7eb] pt-3 mt-3">
                                <Label className="text-xs font-normal text-[#6b7280]">担当者</Label>
                                <p className="font-medium text-slate-900 mt-1">{fileData.staff_name}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 右側：内見依頼書プレビュー */}
                      <Card className="lg:col-span-2 bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-semibold text-slate-900">内見依頼書</h3>
                            <span className="text-xs font-normal text-[#6b7280]">A4サイズ</span>
                          </div>
                          <div className="flex items-center justify-center bg-slate-100 min-h-[600px] rounded-lg p-8">
                            {(() => {
                              const displayCompanyName = fileData.companyName || formData.company_name || "（未入力）";
                              return (
                                <div className="bg-white shadow-lg w-full max-w-md aspect-[1/1.414] p-8 flex flex-col text-sm text-slate-900 border border-[#e5e7eb]">
                                  <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
                                    <h1 className="text-2xl font-bold">内見依頼書</h1>
                                  </div>
                                  <div className="mb-6">
                                    <p className="font-bold text-lg mb-1">{displayCompanyName} 御中</p>
                                  </div>
                                  <div className="border border-slate-300 p-4 mb-6 bg-slate-50 rounded">
                                    <p className="mb-3 text-sm">以下の物件の内見をお願いいたします。</p>
                                    <div className="mt-3 pl-3 border-l-2 border-slate-400 space-y-1">
                                      <p><span className="font-bold">物件名:</span> {fileData.property_name || formData.property_name || "（未入力）"}</p>
                                      <p><span className="font-bold">号室:</span> {fileData.room_number || formData.room_number || "（未入力）"}</p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-dashed border-slate-300 space-y-1">
                                      <p><span className="font-bold">希望日:</span> {fileData.visit_date ? new Date(fileData.visit_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : "未定"}</p>
                                      <p><span className="font-bold">希望時間:</span> {fileData.visit_time || (fileData.visit_hour && fileData.visit_minute ? `${fileData.visit_hour}:${fileData.visit_minute}` : "未定")}</p>
                                    </div>
                                  </div>
                                  <div className="mt-auto pt-6 border-t border-slate-300">
                                    <div className="flex items-center gap-4">
                                      {(() => {
                                        const fileUser = users.find((u: any) => u.id === Number(fileData.staff_id));
                                        return fileUser?.business_card ? (
                                          <img src={fileUser.business_card} alt="名刺" className="w-48 h-28 object-contain border border-slate-300 rounded shadow-sm" />
                                        ) : businessCardPreview ? (
                                          <div className="w-48 h-28 border border-slate-300 rounded overflow-hidden bg-white shadow-sm">
                                            <iframe
                                              srcDoc={businessCardPreview}
                                              className="w-full h-full border-0 scale-100"
                                              title="名刺プレビュー"
                                              style={{ transform: 'scale(1)' }}
                                            />
                                          </div>
                                        ) : (
                                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                            <UserCircle className="w-6 h-6 text-slate-600" />
                                          </div>
                                        );
                                      })()}
                                      <div className="text-sm flex-1">
                                        <p className="font-bold text-base">{fileData.staff_name || (() => {
                                          const fileUser = users.find((u: any) => u.id === Number(fileData.staff_id));
                                          return fileUser?.name || selectedUser?.name || "担当者名";
                                        })()}</p>
                                        {companyData && (
                                          <>
                                            <p className="text-xs text-slate-600 mt-1">{companyData.name || ""}</p>
                                            {companyData.address && (
                                              <p className="text-xs text-slate-600">{companyData.address}</p>
                                            )}
                                            {companyData.phone && (
                                              <p className="text-xs text-slate-600 mt-1">TEL: {companyData.phone}</p>
                                            )}
                                          </>
                                        )}
                                        {(() => {
                                          const fileUser = users.find((u: any) => u.id === Number(fileData.staff_id));
                                          return fileUser?.agent_email && (
                                            <p className="text-xs text-slate-600 mt-1">Email: {fileUser.agent_email}</p>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：送信宛先情報 */}
            <Card className="lg:col-span-1 bg-white border-[#e5e7eb] shadow-sm rounded-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-[16px] font-semibold text-slate-900">送信宛先</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <Label className="text-xs font-normal text-[#6b7280]">管理会社</Label>
                    <p className="font-semibold text-slate-900 mt-1">{formData.company_name || "（未入力）"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-normal text-[#6b7280]">FAX番号</Label>
                    <p className="font-semibold text-lg text-slate-900 mt-1">{formData.fax_number || "（未入力）"}</p>
                  </div>
                  <div className="border-t border-[#e5e7eb] pt-3">
                    <Label className="text-xs font-normal text-[#6b7280]">物件名</Label>
                    <p className="font-medium text-slate-900 mt-1">{formData.property_name || "（未入力）"}</p>
                    {formData.room_number && (
                      <p className="font-medium text-slate-900">{formData.room_number}</p>
                    )}
                  </div>
                  <div className="border-t border-[#e5e7eb] pt-3">
                    <Label className="text-xs font-normal text-[#6b7280]">内見希望日時</Label>
                    <p className="font-medium text-slate-900 mt-1">
                      {formData.visit_date && (formData.visit_time || (formData.visit_hour && formData.visit_minute))
                        ? `${new Date(formData.visit_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })} ${formData.visit_time || `${formData.visit_hour}:${formData.visit_minute}`}`
                        : "未定"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 右側：内見依頼書プレビュー */}
            <Card className="lg:col-span-2 bg-white border-[#e5e7eb] shadow-sm rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-semibold text-slate-900">内見依頼書</h3>
                  <span className="text-xs font-normal text-[#6b7280]">A4サイズ</span>
                </div>
                <div className="flex items-center justify-center bg-slate-100 min-h-[600px] rounded-lg p-8">
                  <div className="bg-white shadow-lg w-full max-w-md aspect-[1/1.414] p-8 flex flex-col text-sm text-slate-900 border border-[#e5e7eb]">
                    <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
                      <h1 className="text-2xl font-bold">内見依頼書</h1>
                    </div>
                    <div className="mb-6">
                      <p className="font-bold text-lg mb-1">{formData.company_name || "（未入力）"} 御中</p>
                    </div>
                    <div className="border border-slate-300 p-4 mb-6 bg-slate-50 rounded">
                      <p className="mb-3 text-sm">以下の物件の内見をお願いいたします。</p>
                      <div className="mt-3 pl-3 border-l-2 border-slate-400 space-y-1">
                        <p><span className="font-bold">物件名:</span> {formData.property_name || "（未入力）"}</p>
                        <p><span className="font-bold">号室:</span> {formData.room_number || "（未入力）"}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-dashed border-slate-300 space-y-1">
                        <p><span className="font-bold">希望日:</span> {formData.visit_date ? new Date(formData.visit_date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : "未定"}</p>
                        <p><span className="font-bold">希望時間:</span> {formData.visit_time || (formData.visit_hour && formData.visit_minute ? `${formData.visit_hour}:${formData.visit_minute}` : "未定")}</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-6 border-t border-slate-300">
                      <div className="flex items-center gap-4">
                        {selectedUser?.business_card ? (
                          <img src={selectedUser.business_card} alt="名刺" className="w-48 h-28 object-contain border border-slate-300 rounded shadow-sm" />
                        ) : businessCardPreview ? (
                          <div className="w-48 h-28 border border-slate-300 rounded overflow-hidden bg-white shadow-sm">
                            <iframe
                              srcDoc={businessCardPreview}
                              className="w-full h-full border-0 scale-100"
                              title="名刺プレビュー"
                              style={{ transform: 'scale(1)' }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-slate-600" />
                          </div>
                        )}
                        <div className="text-sm flex-1">
                          <p className="font-bold text-base">{formData.staff_name || selectedUser?.name || "担当者名"}</p>
                          {companyData && (
                            <>
                              <p className="text-xs text-slate-600 mt-1">{companyData.name || ""}</p>
                              {companyData.address && (
                                <p className="text-xs text-slate-600">{companyData.address}</p>
                              )}
                              {companyData.phone && (
                                <p className="text-xs text-slate-600 mt-1">TEL: {companyData.phone}</p>
                              )}
                            </>
                          )}
                          {selectedUser?.agent_email && (
                            <p className="text-xs text-slate-600 mt-1">Email: {selectedUser.agent_email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowVisitRequestPreview(false)}
            className="h-10 px-6 text-sm rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] hover:border-[#d1d5db] font-normal"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            修正する
          </Button>
          <Button
            onClick={handleSend}
            className="flex-1 h-10 px-6 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
            {scheduledSend ? "送信を予約する" : "FAXを送信する"}
          </Button>
        </div>
      </div>
    );
  }

  // 管理会社電話画面
  if (showPhoneCallScreen) {
    const handleSavePhoneCall = async () => {
      if (!savedFaxId) return;

      try {
        const res = await fetch(`/api/faxes/${savedFaxId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unlock_method: unlockMethod,
            notes: phoneCallNotes,
          }),
        });

        if (res.ok) {
          // リセット
          setHasPdf(false);
          setPreviewImageUrl(null);
          setUploadedFile(null);
          setSelectedPurpose(null);
          setShowPhoneCallScreen(false);
          setFormData({
            fax_number: "",
            company_name: "",
            company_phone: "",
            property_name: "",
            room_number: "",
            visit_date: "",
            visit_time: "",
            title: "",
            body: "",
            staff_id: "",
            staff_name: "",
          });
          setBusinessCardPreview(null);
          setUnlockMethod("");
          setPhoneCallNotes("");
          setSavedFaxId(null);

          onSendComplete();
          if (onNavigateToHistory) onNavigateToHistory();
        } else {
          alert("保存に失敗しました");
        }
      } catch (error) {
        console.error("Save error:", error);
        alert("通信エラーが発生しました");
      }
    };

    return (
      <div className="max-w-7xl mx-auto py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">管理会社への電話確認</h2>
            <p className="text-[14px] font-normal text-[#6b7280] mt-1 leading-[1.5]">
              解錠方法や注意事項を確認しましょう            </p>
          </div>
        </div>

        {selectedPurpose === "visit_request" && uploadedFiles.length > 0 ? (
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardContent className="p-6 space-y-6">
              <Tabs value={String(currentPhoneCallIndex)} onValueChange={(v) => setCurrentPhoneCallIndex(Number(v))}>
                <TabsList className="mb-6">
                  {uploadedFiles.map((_, index) => (
                    <TabsTrigger key={index} value={String(index)}>
                      ファイル{index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {uploadedFiles.map((fileData, index) => {
                  const displayCompanyName = fileData.companyName || formData.company_name || "（未入力）";
                  const displayPhoneNumber = fileData.phoneNumber || formData.company_phone || "";
                  return (
                    <TabsContent key={index} value={String(index)}>
                      {/* 電話番号表示 */}
                      <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 p-6 rounded-lg border border-blue-200 gap-4 mb-6">
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-blue-700 font-normal mb-2 flex items-center justify-center sm:justify-start gap-1 uppercase tracking-wide">
                            <Phone className="w-4 h-4" /> 管理会社 連絡先（ファイル{index + 1}）
                          </p>
                          <h3 className="text-[18px] font-semibold text-slate-900 mb-1">{displayCompanyName}</h3>
                          <p className="text-2xl font-mono font-semibold text-[#2563eb] tracking-tight">
                            {displayPhoneNumber || fileData.faxNumber || formData.fax_number || "---"}
                          </p>
                        </div>
                        {displayPhoneNumber && (
                          <Button
                            size="lg"
                            className="rounded-full h-14 w-14 shadow-md bg-[#2563eb] hover:bg-[#1d4ed8]"
                            asChild
                          >
                            <a href={`tel:${displayPhoneNumber}`}>
                              <Phone className="w-6 h-6" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* 入力フォーム */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-900">解錠方法</Label>
                          <Textarea
                            value={fileData.unlock_method || ""}
                            onChange={(e) => {
                              const newFiles = [...uploadedFiles];
                              newFiles[index].unlock_method = e.target.value;
                              setUploadedFiles(newFiles);
                            }}
                            placeholder="例: 現地ポストに鍵を入れておきます"
                            className="min-h-[80px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-900">備考・メモ</Label>
                          <Textarea
                            value={fileData.phone_call_notes || ""}
                            onChange={(e) => {
                              const newFiles = [...uploadedFiles];
                              newFiles[index].phone_call_notes = e.target.value;
                              setUploadedFiles(newFiles);
                            }}
                            placeholder="電話で確認した内容や注意事項を記入してください"
                            className="min-h-[100px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardContent className="p-6 space-y-6">
              {/* 電話番号表示 */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 p-6 rounded-lg border border-blue-200 gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-blue-700 font-normal mb-2 flex items-center justify-center sm:justify-start gap-1 uppercase tracking-wide">
                    <Phone className="w-4 h-4" /> 管理会社 連絡先
                  </p>
                  <h3 className="text-[18px] font-semibold text-slate-900 mb-1">{formData.company_name || "（未入力）"}</h3>
                  <p className="text-2xl font-mono font-semibold text-[#2563eb] tracking-tight">
                    {formData.company_phone || formData.fax_number || "---"}
                  </p>
                </div>
                {formData.company_phone && (
                  <Button
                    size="lg"
                    className="rounded-full h-14 w-14 shadow-md bg-[#2563eb] hover:bg-[#1d4ed8]"
                    asChild
                  >
                    <a href={`tel:${formData.company_phone}`}>
                      <Phone className="w-6 h-6" />
                    </a>
                  </Button>
                )}
              </div>

              {/* 入力フォーム */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">解錠方法</Label>
                  <Textarea
                    value={unlockMethod}
                    onChange={(e) => setUnlockMethod(e.target.value)}
                    placeholder="例: 現地ポストに鍵を入れておきます"
                    className="min-h-[80px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">備考・メモ</Label>
                  <Textarea
                    value={phoneCallNotes}
                    onChange={(e) => setPhoneCallNotes(e.target.value)}
                    placeholder="電話で確認した内容や注意事項を記入してください"
                    className="min-h-[100px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* アクションボタン */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#e5e7eb]">
          <Button
            variant="outline"
            onClick={() => {
              setShowPhoneCallScreen(false);
              setShowVisitRequestPreview(true);
            }}
            className="h-10 px-6 text-sm rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] hover:border-[#d1d5db] font-normal"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
          <Button
            onClick={handleSavePhoneCall}
            className="flex-1 h-10 px-6 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            保存して完了
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-6">
      {/* ヘッダー */}
      <div className="space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">新規送信</h2>
          <p className="text-[14px] font-normal text-[#6b7280] mt-1 leading-[1.5]">
            PDFをドラッグ&ドロップするか、名刺だけ送信できます          </p>
        </div>

        {/* 目的選択（プルダウン） */}
        <div className="max-w-md">
          <Label className="text-sm font-semibold text-slate-900 mb-2 block">送信の目的</Label>
          <Select
            value={selectedPurpose || ""}
            onValueChange={(value) => {
              setSelectedPurpose(value as PurposeType);
              // 目的変更時にリセット
              if (selectedPurpose && selectedPurpose !== value) {
                setHasPdf(false);
                setPreviewImageUrl(null);
                setUploadedFile(null);
                setOcrText("");
                setFormData({
                  fax_number: "",
                  company_name: "",
                  company_phone: "",
                  property_name: "",
                  room_number: "",
                  visit_date: "",
                  visit_time: "",
                  title: "",
                  body: "",
                  staff_id: "",
                  staff_name: "",
                });
              }
            }}
          >
            <SelectTrigger className="h-10 text-sm border-[#e5e7eb] bg-white">
              <SelectValue
                placeholder="送信の目的を選択してください"
                displayValue={selectedPurpose ? PURPOSE_OPTIONS.find(p => p.id === selectedPurpose)?.name || "" : ""}
              />
            </SelectTrigger>
            <SelectContent>
              {PURPOSE_OPTIONS.map((purpose) => {
                const Icon = purpose.icon;
                return (
                  <SelectItem key={purpose.id || ""} value={purpose.id || ""}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#6b7280]" />
                      <span>{purpose.name}</span>
                      {purpose.pdfRequired && (
                        <span className="ml-2 text-xs text-red-600">(PDF必須)</span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PDFドロップエリア（目的選択後、PDF必須または未アップロード時） */}
      {selectedPurpose && !hasPdf && (selectedPurposeConfig?.pdfRequired || selectedPurpose !== "business_card") && (
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-xl p-16 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group relative overflow-hidden ${selectedPurposeConfig?.pdfRequired
              ? "border-[#2563eb] bg-gradient-to-br from-blue-50/50 to-white"
              : "border-[#e5e7eb] bg-[#f9fafb]"
            }`}
        >
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#2563eb] rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#2563eb] rounded-full blur-3xl"></div>
          </div>

          <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
            <div className="p-6 bg-white rounded-2xl shadow-lg group-hover:scale-105 transition-all duration-300 border border-[#e5e7eb]">
              {isAnalyzing ? (
                <Loader2 className="w-12 h-12 text-[#2563eb] animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-[#2563eb]" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[20px] font-semibold text-slate-900 leading-[1.5]">
                {isAnalyzing ? "AIが解析しています..." : selectedPurposeConfig?.pdfRequired ? "PDFをここにドラッグ&ドロップ" : "PDFを添付する（任意）"}
              </p>
              <p className="text-[14px] font-normal text-[#6b7280] leading-[1.5]">
                またはクリックしてファイルを選択 (JPG, PNG, PDF)
              </p>
              {isAutoCompleting && (
                <div className="flex items-center justify-center gap-2 text-[#2563eb] mt-3">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">AIが自動補完中...</span>
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div className="w-full max-w-md space-y-2">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-[#6b7280]">{progress}% 完了</p>
              </div>
            )}

            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              disabled={isAnalyzing}
              multiple
            />
            <Button
              disabled={isAnalyzing}
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-6 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  ファイルを選択                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PDFアップロード不要の場合は「ファイルを添付せずに続ける」ボタン */}
      {selectedPurpose && !selectedPurposeConfig?.pdfRequired && !hasPdf && selectedPurpose !== "business_card" && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              // PDFなしで続行
            }}
            className="h-9 px-6 text-sm rounded-md bg-white hover:bg-[#f9fafb] border-[#e5e7eb] text-[#6b7280] hover:text-slate-900 font-normal"
          >
            ファイルを添付せずに続ける
          </Button>
        </div>
      )}

      {/* フォームエリア（目的選択後、またはPDFアップロード後、または名刺モード時） */}
      {selectedPurpose && (hasPdf || !selectedPurposeConfig?.pdfRequired || selectedPurpose === "business_card") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：プレビュー（内見申請で複数ファイルの場合は非表示） */}
          {hasPdf && !(selectedPurpose === "visit_request" && uploadedFiles.length > 0) && (
            <div className="lg:col-span-1">
              <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg sticky top-6">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-slate-900">PDFプレビュー</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setHasPdf(false);
                            setPreviewImageUrl(null);
                            setUploadedFile(null);
                            setUploadedFiles([]);
                            setOcrText("");
                            if (onEditDataCleared) onEditDataCleared();
                          }}
                          className="h-7 px-2 text-xs text-[#6b7280] hover:text-slate-900"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      {previewImageUrl && (
                        <img
                          src={previewImageUrl}
                          alt="プレビュー"
                          className="w-full h-auto border border-[#e5e7eb] rounded-lg shadow-sm"
                        />
                      )}
                      <div className="mt-4">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await processFile(file);
                            }
                          }}
                          className="hidden"
                          id="add-preview-image-input"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('add-preview-image-input')?.click()}
                          className="w-full h-8 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" /> 画像を追加
                        </Button>
                      </div>
                    </div>

                    {(attachBusinessCard || selectedPurpose === "business_card") && businessCardPreview && (
                      <div>
                        <Label className="text-sm font-semibold text-slate-900 mb-2 block">名刺プレビュー</Label>
                        <div className="border border-[#e5e7eb] rounded-lg p-3 bg-slate-50">
                          <iframe
                            srcDoc={businessCardPreview}
                            className="w-full h-40 border-0 rounded"
                            title="名刺プレビュー"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 右側：フォーム */}
          <div className={`space-y-6 ${hasPdf && !(selectedPurpose === "visit_request" && uploadedFiles.length > 0) ? "lg:col-span-2" : "lg:col-span-3"}`}>
            {/* 内見申請で複数ファイルの場合は統合レイアウト */}
            {selectedPurpose === "visit_request" && uploadedFiles.length > 0 ? (
              <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                <CardContent className="p-6 space-y-6">
                  {/* ファイルタブ */}
                  <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
                    {uploadedFiles.map((fileData, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedFileIndex(index)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${selectedFileIndex === index
                            ? "bg-[#2563eb] text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>ファイル {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFiles = uploadedFiles.filter((_, i) => i !== index);
                              setUploadedFiles(newFiles);
                              if (newFiles.length === 0) {
                                setHasPdf(false);
                                setSelectedFileIndex(0);
                              } else if (selectedFileIndex >= newFiles.length) {
                                setSelectedFileIndex(Math.max(0, newFiles.length - 1));
                              } else if (selectedFileIndex > index) {
                                setSelectedFileIndex(selectedFileIndex - 1);
                              }
                            }}
                            className={`h-5 w-5 p-0 ${selectedFileIndex === index ? "text-white hover:bg-blue-600" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('add-visit-files-input')?.click()}
                      className="ml-auto h-8 px-3 text-xs border-dashed"
                    >
                      <Plus className="w-3 h-3 mr-1" /> 追加
                    </Button>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="add-visit-files-input"
                    />
                  </div>

                  {/* 統合レイアウト：プレビューとフォーム */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左側：大きなプレビュー画像 */}
                    <div className="space-y-4">
                      <div className="relative w-full border border-[#e5e7eb] rounded-lg overflow-hidden bg-slate-50">
                        <img
                          src={uploadedFiles[selectedFileIndex]?.previewUrl}
                          alt={`プレビュー ${selectedFileIndex + 1}`}
                          className="w-full h-auto max-h-[600px] object-contain"
                        />
                      </div>
                    </div>

                    {/* 右側：送信先フォーム */}
                    <div className="space-y-4">
                      {uploadedFiles[selectedFileIndex] && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-900">
                              管理会社名 <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                value={uploadedFiles[selectedFileIndex].companyName}
                                onChange={(e) => {
                                  const newFiles = [...uploadedFiles];
                                  newFiles[selectedFileIndex].companyName = e.target.value;
                                  setUploadedFiles(newFiles);
                                  setCompanySearchQuery(e.target.value);
                                }}
                                placeholder="管理会社名またはFAX番号で検索"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                              {showCompanySearch && companySearchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 border border-[#e5e7eb] rounded-md bg-white shadow-lg max-h-80 overflow-y-auto">
                                  {companySearchResults.map((company, idx) => (
                                    <button
                                      key={company.id || `company-${idx}`}
                                      onClick={() => {
                                        const newFiles = [...uploadedFiles];
                                        newFiles[selectedFileIndex].companyName = company.name;
                                        newFiles[selectedFileIndex].faxNumber = company.fax || "";
                                        newFiles[selectedFileIndex].phoneNumber = company.phone || "";
                                        setUploadedFiles(newFiles);
                                        setShowCompanySearch(false);
                                        setCompanySearchQuery("");
                                      }}
                                      className="w-full text-left px-3 py-3 hover:bg-blue-50/50 text-sm text-slate-900 border-b border-[#e5e7eb] last:border-0 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold">{company.name}</span>
                                            {company.source === "history" && (
                                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                                過去の送信履歴
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="mt-1.5 space-y-0.5">
                                            {company.fax && (
                                              <div className="text-xs text-[#6b7280]">FAX: <span className="font-mono">{company.fax}</span></div>
                                            )}
                                            {company.phone && (
                                              <div className="text-xs text-[#6b7280]">TEL: <span className="font-mono">{company.phone}</span></div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">FAX番号 <span className="text-red-500">*</span></Label>
                              <Input
                                value={uploadedFiles[selectedFileIndex].faxNumber}
                                onChange={(e) => {
                                  const newFiles = [...uploadedFiles];
                                  newFiles[selectedFileIndex].faxNumber = e.target.value;
                                  setUploadedFiles(newFiles);
                                }}
                                placeholder="03-1234-5678"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">電話番号</Label>
                              <Input
                                value={uploadedFiles[selectedFileIndex].phoneNumber}
                                onChange={(e) => {
                                  const newFiles = [...uploadedFiles];
                                  newFiles[selectedFileIndex].phoneNumber = e.target.value;
                                  setUploadedFiles(newFiles);
                                }}
                                placeholder="03-1234-5678"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                          </div>

                          {/* 物件名・号室 */}
                          <div className="grid grid-cols-2 gap-4 border-t border-[#e5e7eb] pt-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">物件名</Label>
                              <Input
                                value={uploadedFiles[selectedFileIndex].property_name || ""}
                                onChange={(e) => {
                                  const newFiles = [...uploadedFiles];
                                  newFiles[selectedFileIndex].property_name = e.target.value;
                                  setUploadedFiles(newFiles);
                                }}
                                placeholder="物件名"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">号室</Label>
                              <Input
                                value={uploadedFiles[selectedFileIndex].room_number || ""}
                                onChange={(e) => {
                                  const newFiles = [...uploadedFiles];
                                  newFiles[selectedFileIndex].room_number = e.target.value;
                                  setUploadedFiles(newFiles);
                                }}
                                placeholder="101"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                          </div>

                          {/* 内見希望日時 */}
                          <div className="space-y-4 border-t border-[#e5e7eb] pt-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">内見希望日 <span className="text-red-500">*</span></Label>
                              <Input
                                type="date"
                                value={uploadedFiles[selectedFileIndex].visit_date}
                                onChange={(e) => {
                                  const newFiles = [...uploadedFiles];
                                  newFiles[selectedFileIndex].visit_date = e.target.value;
                                  setUploadedFiles(newFiles);
                                }}
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">内見希望時間 <span className="text-red-500">*</span></Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Select
                                    value={uploadedFiles[selectedFileIndex].visit_hour || ""}
                                    onValueChange={(value) => {
                                      const newFiles = [...uploadedFiles];
                                      newFiles[selectedFileIndex].visit_hour = value;
                                      if (newFiles[selectedFileIndex].visit_minute) {
                                        newFiles[selectedFileIndex].visit_time = `${value}:${newFiles[selectedFileIndex].visit_minute}`;
                                      }
                                      setUploadedFiles(newFiles);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                                      <SelectValue placeholder="時" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                      {Array.from({ length: 24 }, (_, i) => ({
                                        value: String(i).padStart(2, '0'),
                                        label: `${i}時`
                                      })).map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Select
                                    value={uploadedFiles[selectedFileIndex].visit_minute || ""}
                                    onValueChange={(value) => {
                                      const newFiles = [...uploadedFiles];
                                      newFiles[selectedFileIndex].visit_minute = value;
                                      if (newFiles[selectedFileIndex].visit_hour) {
                                        newFiles[selectedFileIndex].visit_time = `${newFiles[selectedFileIndex].visit_hour}:${value}`;
                                      }
                                      setUploadedFiles(newFiles);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                                      <SelectValue placeholder="分" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                      {Array.from({ length: 12 }, (_, i) => {
                                        const minute = i * 5;
                                        return {
                                          value: String(minute).padStart(2, '0'),
                                          label: `${minute}分`
                                        };
                                      }).map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 担当者選択 */}
                          <div className="space-y-2 border-t border-[#e5e7eb] pt-4">
                            <Label className="text-sm font-semibold text-slate-900">担当者</Label>
                            <Select
                              value={uploadedFiles[selectedFileIndex].staff_id || ""}
                              onValueChange={(value) => {
                                const newFiles = [...uploadedFiles];
                                const selectedUser = users.find((u: any) => u.id === Number(value));
                                if (selectedUser) {
                                  newFiles[selectedFileIndex].staff_id = String(selectedUser.id);
                                  newFiles[selectedFileIndex].staff_name = selectedUser.name;
                                }
                                setUploadedFiles(newFiles);
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                                <SelectValue
                                  placeholder="担当者を選択"
                                  displayValue={uploadedFiles[selectedFileIndex].staff_name || ""}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={String(user.id)}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 送信ボタン */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[#e5e7eb]">
                    <Button
                      onClick={() => {
                        // 各ファイルのバリデーション
                        for (let i = 0; i < uploadedFiles.length; i++) {
                          const file = uploadedFiles[i];
                          const faxNumber = file.faxNumber?.trim();
                          const companyName = file.companyName?.trim();
                          const visitDate = (file.visit_date || "").trim();
                          const visitTime = file.visit_time || (file.visit_hour && file.visit_minute ? `${file.visit_hour}:${file.visit_minute}` : "");

                          if (!faxNumber || faxNumber === "") {
                            alert(`ファイル${i + 1}のFAX番号を入力してください`);
                            return;
                          }
                          if (!companyName || companyName === "") {
                            alert(`ファイル${i + 1}の管理会社名を入力してください`);
                            return;
                          }
                          if (!visitDate) {
                            alert(`ファイル${i + 1}の内見希望日を入力してください`);
                            return;
                          }
                          if (!visitTime) {
                            alert(`ファイル${i + 1}の内見希望時間を入力してください`);
                            return;
                          }
                        }
                        setShowVisitRequestPreview(true);
                      }}
                      className="flex-1 h-10 px-6 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      次へ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* 通常のレイアウト（内見申請以外、または単一ファイル） */
              <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                <CardContent className="p-6 space-y-6">
                  {/* 送信先セクション */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-semibold text-slate-900">送信先</h3>
                      {isAutoCompleting && (
                        <div className="flex items-center gap-1.5 text-[#2563eb]">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <span className="text-xs font-medium">AI補完中</span>
                        </div>
                      )}
                    </div>


                    {/* 物件名から管理会社情報を自動補完（追加書類送付など） */}
                    {selectedPurpose === "additional_documents" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-900">
                          物件名 <span className="text-xs font-normal text-[#6b7280]">（物件名から管理会社情報を自動補完）</span>
                        </Label>
                        <div className="relative">
                          <Input
                            value={propertySearchQuery}
                            onChange={(e) => {
                              setPropertySearchQuery(e.target.value);
                              setFormData(prev => ({ ...prev, property_name: e.target.value }));
                            }}
                            placeholder="物件名を入力"
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          />
                          {showPropertySearch && propertySearchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 border border-[#e5e7eb] rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                              {propertySearchResults.map((property) => (
                                <button
                                  key={property.id}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      property_name: property.name,
                                      room_number: property.room_number || prev.room_number,
                                      company_name: property.company.name,
                                      fax_number: property.company.fax || prev.fax_number,
                                      company_phone: property.company.phone || prev.company_phone,
                                    }));
                                    setShowPropertySearch(false);
                                    setPropertySearchQuery("");
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-[#f9fafb] text-sm text-slate-900 border-b border-[#e5e7eb] last:border-0"
                                >
                                  <div className="font-medium">{property.name}</div>
                                  <div className="text-xs text-[#6b7280] mt-0.5">
                                    {property.company.name} {property.company.fax && `・ FAX: ${property.company.fax}`}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 内見申請で複数ファイルの場合は通常のフォームを非表示 */}
                    {!(selectedPurpose === "visit_request" && uploadedFiles.length > 0) && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-900">
                            管理会社名 <span className="text-red-500">*</span>
                            <span className="text-xs font-normal text-[#6b7280] ml-2">（過去の送信履歴からも検索可能）</span>
                          </Label>
                          <div className="relative">
                            <Input
                              value={formData.company_name}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, company_name: e.target.value }));
                                setCompanySearchQuery(e.target.value);
                              }}
                              placeholder="管理会社名またはFAX番号で検索"
                              className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            />
                            {showCompanySearch && companySearchResults.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 border border-[#e5e7eb] rounded-md bg-white shadow-lg max-h-80 overflow-y-auto">
                                {companySearchResults.map((company, idx) => (
                                  <button
                                    key={company.id || `company-${idx}`}
                                    onClick={() => {
                                      // 管理会社を選択したら、FAX番号、電話番号、物件名、号室を自動補完
                                      const firstProperty = company.properties && company.properties.length > 0 ? company.properties[0] : null;
                                      setFormData(prev => ({
                                        ...prev,
                                        company_name: company.name,
                                        fax_number: company.fax || prev.fax_number,
                                        company_phone: company.phone || prev.company_phone,
                                        property_name: firstProperty?.name || prev.property_name,
                                        room_number: firstProperty?.room_number || prev.room_number,
                                      }));
                                      setShowCompanySearch(false);
                                      setCompanySearchQuery("");
                                    }}
                                    className="w-full text-left px-3 py-3 hover:bg-blue-50/50 text-sm text-slate-900 border-b border-[#e5e7eb] last:border-0 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">{company.name}</span>
                                          {company.source === "history" && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                              過去の送信履歴
                                            </Badge>
                                          )}
                                          {company.count && company.count > 1 && (
                                            <span className="text-xs text-[#6b7280]">({company.count}回送信)</span>
                                          )}
                                        </div>
                                        <div className="mt-1.5 space-y-0.5">
                                          {company.fax && (
                                            <div className="text-xs text-[#6b7280]">FAX: <span className="font-mono">{company.fax}</span></div>
                                          )}
                                          {company.phone && (
                                            <div className="text-xs text-[#6b7280]">TEL: <span className="font-mono">{company.phone}</span></div>
                                          )}
                                          {company.properties && company.properties.length > 0 && (
                                            <div className="text-xs text-[#6b7280] mt-1">
                                              物件: {company.properties.slice(0, 2).map(p => p.name).join(", ")}
                                              {company.properties.length > 2 && ` 他${company.properties.length - 2}件`}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {company.lastSentAt && (
                                        <div className="text-xs text-[#6b7280] whitespace-nowrap ml-2">
                                          {new Date(company.lastSentAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-900">FAX番号 <span className="text-red-500">*</span></Label>
                            <Input
                              value={formData.fax_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, fax_number: e.target.value }))}
                              placeholder="03-1234-5678"
                              className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-900">電話番号</Label>
                            <Input
                              value={formData.company_phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, company_phone: e.target.value }))}
                              placeholder="03-1234-5678"
                              className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </div>

                        {selectedPurpose !== "additional_documents" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">物件名</Label>
                              <Input
                                value={formData.property_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, property_name: e.target.value }))}
                                placeholder="物件名"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">号室</Label>
                              <Input
                                value={formData.room_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                                placeholder="101"
                                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                          </div>
                        )}

                        {selectedPurpose === "additional_documents" && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-900">号室</Label>
                            <Input
                              value={formData.room_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                              placeholder="101"
                              className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 内見申請で複数ファイルの場合は通常のフォームを非表示 */}
                    {selectedPurpose === "visit_request" && !(uploadedFiles.length > 0) && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-900">内見希望日 <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={formData.visit_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-900">内見希望時間 <span className="text-red-500">*</span></Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Select
                                value={formData.visit_hour || ""}
                                onValueChange={(value) => {
                                  setFormData(prev => ({ ...prev, visit_hour: value }));
                                  if (formData.visit_minute) {
                                    setFormData(prev => ({ ...prev, visit_time: `${value}:${prev.visit_minute}` }));
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                                  <SelectValue placeholder="時" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                  {Array.from({ length: 24 }, (_, i) => ({
                                    value: String(i).padStart(2, '0'),
                                    label: `${i}時`
                                  })).map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Select
                                value={formData.visit_minute || ""}
                                onValueChange={(value) => {
                                  setFormData(prev => ({ ...prev, visit_minute: value }));
                                  if (formData.visit_hour) {
                                    setFormData(prev => ({ ...prev, visit_time: `${prev.visit_hour}:${value}` }));
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                                  <SelectValue placeholder="分" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const minute = i * 5;
                                    return {
                                      value: String(minute).padStart(2, '0'),
                                      label: `${minute}分`
                                    };
                                  }).map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 担当者選択（内見申請で複数ファイルの場合は非表示） */}
                    {!(selectedPurpose === "visit_request" && uploadedFiles.length > 0) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-900">担当者</Label>
                        <Select
                          value={formData.staff_id || ""}
                          onValueChange={(value) => {
                            const user = users.find((u: any) => u.id === Number(value));
                            setSelectedUser(user || null);
                            setFormData(prev => ({
                              ...prev,
                              staff_id: value,
                              staff_name: user?.name || ""
                            }));
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                            <SelectValue
                              placeholder="担当者を選択"
                              displayValue={formData.staff_name || selectedUser?.name || ""}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={String(user.id)}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* 本文セクション（内見申請の場合は非表示） */}
                  {selectedPurpose !== "business_card" && selectedPurpose !== "visit_request" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between relative z-50">
                        <h3 className="text-[16px] font-semibold text-slate-900">本文</h3>
                        {templates.length > 0 && (
                          <Select value={selectedTemplate?.toString() || ""} onValueChange={(v) => handleTemplateSelect(Number(v))}>
                            <SelectTrigger className="h-8 w-[200px] text-xs border-[#e5e7eb] z-50">
                              <SelectValue placeholder="テンプレートを選択" />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              {templates.map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.name === t.category ? t.name : `${t.name}${t.category && t.category !== t.name ? ` (${t.category})` : ''}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <Textarea
                        value={formData.body}
                        onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="FAXの本文を入力..."
                        className="min-h-[120px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  )}


                  {/* 送信予約オプション */}
                  <div className="border-t border-[#e5e7eb] pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="scheduled-send"
                          checked={scheduledSend}
                          onCheckedChange={(checked) => setScheduledSend(checked === true)}
                        />
                        <Label htmlFor="scheduled-send" className="text-sm font-normal text-slate-900 cursor-pointer">
                          送信予約
                        </Label>
                      </div>
                      {scheduledSend && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-normal text-slate-700">日付</Label>
                            <Input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="h-8 text-sm bg-white text-slate-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-normal text-slate-700">時刻</Label>
                            <Select
                              value={scheduledTime || ""}
                              onValueChange={(value) => setScheduledTime(value)}
                            >
                              <SelectTrigger className="h-8 text-sm bg-white text-slate-900">
                                <SelectValue placeholder="時間を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 * 12 }, (_, i) => {
                                  const hour = Math.floor(i / 12);
                                  const minute = (i % 12) * 5;
                                  const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                  const displayTime = `${hour}:${minute.toString().padStart(2, '0')}`;
                                  return (
                                    <SelectItem key={timeValue} value={timeValue}>
                                      {displayTime}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 送信ボタン */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[#e5e7eb]">
                    {selectedPurpose === "visit_request" ? (
                      <Button
                        onClick={() => {
                          // 複数ファイルアップロードの場合
                          if (selectedPurpose === "visit_request" && uploadedFiles.length > 0) {
                            // 各ファイルのバリデーション
                            for (let i = 0; i < uploadedFiles.length; i++) {
                              const file = uploadedFiles[i];
                              const faxNumber = file.faxNumber?.trim();
                              const companyName = file.companyName?.trim();

                              if (!faxNumber || faxNumber === "") {
                                alert(`ファイル${i + 1}のFAX番号を入力してください`);
                                return;
                              }
                              if (!companyName || companyName === "") {
                                alert(`ファイル${i + 1}の管理会社名を入力してください`);
                                return;
                              }
                            }
                          } else {
                            // 通常のフォームの場合
                            const faxNumber = (formData.fax_number || "").trim();
                            const companyName = (formData.company_name || "").trim();

                            if (!faxNumber) {
                              alert("送信先（FAX番号・管理会社名）を入力してください\nFAX番号が入力されていません");
                              return;
                            }
                            if (!companyName) {
                              alert("送信先（FAX番号・管理会社名）を入力してください\n管理会社名が入力されていません");
                              return;
                            }
                          }

                          if (!formData.visit_date || !(formData.visit_time || (formData.visit_hour && formData.visit_minute))) {
                            alert("内見希望日時を入力してください");
                            return;
                          }
                          setShowVisitRequestPreview(true);
                        }}
                        className="flex-1 h-10 px-6 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
                      >
                        次へ
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSend}
                        className="flex-1 h-10 px-6 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
                      >
                        <Send className="w-4 h-4" />
                        {scheduledSend ? "送信を予約する" : "FAXを送信する"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
