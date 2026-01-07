"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Building2, MapPin, Phone, Printer, User, Calendar, Clock, Image as ImageIcon, FileText, Send, Clock as ClockIcon, RotateCcw, CheckCircle2, Search, Sparkles, History, X, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface EditScreenProps {
  initialData: any;
  uploadedImage?: string | null;
  uploadedImages?: Array<{ file: File; imageUrl: string; text: string }>;
  currentImageIndex?: number;
  onImageChange?: (index: number) => void;
  onImageRemove?: () => void;
  onImageAdd?: (file: File) => void;
  onBack: () => void;
  onNext: (data: any) => void;
  faxType?: string; // 送信タイチE
}

export function EditScreen({ initialData, uploadedImage, uploadedImages, currentImageIndex = 0, onImageChange, onImageRemove, onImageAdd, onBack, onNext, faxType }: EditScreenProps) {
  const [formData, setFormData] = useState({
    company_name: initialData?.company_name || "",
    fax_number: initialData?.fax_number || "",
    company_phone: initialData?.company_phone || "",
    property_name: initialData?.property_name || "",
    room_number: initialData?.room_number || "",
    visit_date: initialData?.visit_date || "",
    visit_time: initialData?.visit_time || "",
    visit_hour: initialData?.visit_hour || "",
    visit_minute: initialData?.visit_minute || "",
    staff_id: initialData?.staff_id || "",
    staff_name: initialData?.staff_name || "",
    notes: initialData?.notes || "",
  });
  
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; business_card?: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; category: string; content: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [sendMode, setSendMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [retryEnabled, setRetryEnabled] = useState(false);
  const [retryMax, setRetryMax] = useState(3);
  const [retryInterval, setRetryInterval] = useState(60);
  
  // 送信先検索・候補表示用のstate
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<Array<{ id: number; name: string; fax: string | null; phone: string | null; properties: Array<{ name: string }> }>>([]);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<Array<{ company_name: string; fax_number: string; company_phone: string | null; property_name: string | null; last_sent_at: string; count: number }>>([]);
  const [showRecentDestinations, setShowRecentDestinations] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // ユーザー一覧とチE��プレートを取征E
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
          // 初期チE�Eタにstaff_idがある場合、対応するユーザーを設宁E
          if (initialData?.staff_id) {
            const user = data.users.find((u: any) => u.id === Number(initialData.staff_id));
            if (user) {
              setSelectedUser(user);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to fetch users:", err));
    
    // チE��プレートを取征E
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        let fetchedTemplates: Array<{ id: number; name: string; category: string; content: string }> = [];
        if (data.templates) {
          fetchedTemplates = data.templates;
        } else if (Array.isArray(data)) {
          fetchedTemplates = data;
        }
        setTemplates(fetchedTemplates);

        // 送信タイプに応じてテンプレートを自動選択
        if (faxType && fetchedTemplates.length > 0) {
          const typeToCategoryMap: Record<string, string> = {
            visit_request: "内見申請",
            application: "申込書送付",
            additional_documents: "不足書類送付",
            greeting: "案内報告",
            correction: "その他",
            cancellation: "その他",
            contract: "その他",
          };
          
          const targetCategory = typeToCategoryMap[faxType];
          if (targetCategory) {
            // 該当カテゴリのテンプレートを検索
            const matchingTemplate = fetchedTemplates.find(
              (t) => t.category === targetCategory
            );
            if (matchingTemplate) {
              setSelectedTemplate(matchingTemplate.id);
              // テンプレートの内容をnotesに設定
              setFormData((prev) => ({
                ...prev,
                notes: matchingTemplate.content,
              }));
            }
          }
        }
      })
      .catch((err) => console.error("Failed to fetch templates:", err));

    // 最近�E送信先を取征E
    fetch("/api/faxes/recent-destinations")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data)) {
          setRecentDestinations(data);
        }
      })
      .catch((err) => console.error("Failed to fetch recent destinations:", err));
  }, [faxType, initialData?.staff_id]);

  // 管琁E��社名検索
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

  // AI自動補完！ECR結果から送信先を推測�E�E
  useEffect(() => {
    if (initialData?.ocr_text && !isAutoCompleting) {
      setIsAutoCompleting(true);
      // OCRチE��ストから管琁E��社名�E物件名を抽出して検索
      const ocrText = initialData.ocr_text || "";
      
      // 管琁E��社名�E候補を検索
      if (ocrText.length > 10 && !formData.company_name) {
        // OCRチE��ストから会社名らしき部刁E��抽出�E�簡易版�E�E
        const companyMatch = ocrText.match(/(株式会社|有限会社|合同会社|合賁E��社|合名会社)[^\s\n]{0,20}/);
        if (companyMatch) {
          const companyName = companyMatch[0];
          fetch(`/api/companies/search?q=${encodeURIComponent(companyName)}`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                const matchedCompany = data[0];
                setFormData(prev => ({
                  ...prev,
                  company_name: matchedCompany.name,
                  fax_number: matchedCompany.fax || prev.fax_number,
                  company_phone: matchedCompany.phone || prev.company_phone
                }));
              }
            })
            .catch((err) => console.error("Failed to auto-complete company:", err));
        }
      }

      // 物件名の候補を検索
      if (ocrText.length > 10 && !formData.property_name) {
        const propertyMatch = ocrText.match(/([^\s\n]{2,15}(マンション|アパート|ハイツ|コーポ|レジデンス|パレス|タワー|ヒルズ|ハイム|ハウス|荘|庄))/);
        if (propertyMatch) {
          const propertyName = propertyMatch[0];
          fetch(`/api/properties/search?q=${encodeURIComponent(propertyName)}`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                const matchedProperty = data[0];
                setFormData(prev => ({
                  ...prev,
                  property_name: matchedProperty.name,
                  company_name: matchedProperty.company?.name || prev.company_name,
                  fax_number: matchedProperty.company?.fax || prev.fax_number,
                  company_phone: matchedProperty.company?.phone || prev.company_phone
                }));
              }
            })
            .catch((err) => console.error("Failed to auto-complete property:", err));
        }
      }

      setTimeout(() => setIsAutoCompleting(false), 1000);
    }
  }, [initialData?.ocr_text]);

  // 画像が刁E��替わったときに、その画像に対応するデータを読み込む
  useEffect(() => {
    if (initialData) {
      // 時間を時間と刁E��に刁E��
      let visitHour = "";
      let visitMinute = "";
      if (initialData.visit_time) {
        const [hour, minute] = initialData.visit_time.split(':');
        visitHour = hour || "";
        visitMinute = minute || "";
      }
      
      setFormData({
        company_name: initialData.company_name || "",
        fax_number: initialData.fax_number || "",
        company_phone: initialData.company_phone || "",
        property_name: initialData.property_name || "",
        room_number: initialData.room_number || "",
        visit_date: initialData.visit_date || "",
        visit_time: initialData.visit_time || "",
        visit_hour: visitHour,
        visit_minute: visitMinute,
        staff_id: initialData.staff_id || "",
        staff_name: initialData.staff_name || "",
        notes: initialData.notes || "",
      });
      
      // 拁E��老E��選択されてぁE��場合、ユーザー惁E��を設宁E
      if (initialData.staff_id && users.length > 0) {
        const user = users.find((u: any) => u.id === Number(initialData.staff_id));
        if (user) {
          setSelectedUser(user);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 時間オプション（0-23時）- 表示は「9時」形式（先頭の0を削除）
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, '0'), // 内部値は「09」形式
    label: `${i}時` // 表示は「9時」形式
  }));

  // 分数オプション（5分単位）
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    return {
      value: String(minute).padStart(2, '0'),
      label: `${minute}分`
    };
  });

  // 時間と分数が変更されたときに、visit_timeを更新
  const handleTimeChange = () => {
    if (formData.visit_hour && formData.visit_minute) {
      const timeValue = `${formData.visit_hour}:${formData.visit_minute}`;
      setFormData((prev) => ({ ...prev, visit_time: timeValue }));
    }
  };

  useEffect(() => {
    handleTimeChange();
  }, [formData.visit_hour, formData.visit_minute]);

  return (
    <div className="py-6 px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">情報の確認・編集</h2>
          <p className="text-[14px] font-normal text-[#6b7280] mt-2 leading-[1.5]">OCRで読み取った内容を確認し、誤りがあれば修正してください</p>
        </div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-9 px-4 text-[14px] rounded-md text-[#6b7280] hover:text-slate-900 hover:bg-[#f9fafb] font-normal gap-1"
        >
          <ArrowLeft className="w-4 h-4" />戻めE        </Button>
      </div>

      {/* 選択されたファイル一覧 */}
      {uploadedImages && uploadedImages.length > 0 && (
        <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg mb-4">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="text-[18px] font-semibold text-slate-900 leading-[1.5]">
              選択されたファイル ({uploadedImages.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {uploadedImages.map((img, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                    index === currentImageIndex 
                      ? "bg-blue-50 border-blue-300" 
                      : "bg-slate-50 border-[#e5e7eb]"
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-semibold ${
                    index === currentImageIndex
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-normal text-slate-900">{img.fileName || '画像ファイル'}</p>
                    <p className="text-xs text-[#6b7280]">
                      {img.fileName && img.fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : '画像'}
                    </p>
                  </div>
                  {index === currentImageIndex && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md font-normal">
                      編雁E��
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* アチE�E�Eロードした図面のプレビュー */}
      {uploadedImage && (
        <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg mb-4">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 leading-[1.5]">
                <ImageIcon className="w-5 h-5 text-[#2563eb]" /> アチE�E�Eロードした図面
              </CardTitle>
              {uploadedImages && uploadedImages.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImageChange && currentImageIndex > 0 && onImageChange(currentImageIndex - 1)}
                    disabled={currentImageIndex === 0}
                    className="h-8 px-3 text-[12px]"
                  >
                    前へ
                  </Button>
                  <span className="text-[14px] text-[#6b7280]">
                    {currentImageIndex + 1} / {uploadedImages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImageChange && currentImageIndex < uploadedImages.length - 1 && onImageChange(currentImageIndex + 1)}
                    disabled={currentImageIndex === uploadedImages.length - 1}
                    className="h-8 px-3 text-[12px]"
                  >
                    次へ
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center bg-slate-50 rounded-lg border border-[#e5e7eb] p-4">
              <img 
                src={uploadedImage} 
                alt={`アチE�E�Eロードした図面 ${currentImageIndex + 1}`} 
                className="max-w-full max-h-96 object-contain rounded-md shadow-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 送信先情報カーチE*/}
        <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 leading-[1.5]">
              <Building2 className="w-5 h-5 text-[#2563eb]" /> 送信允E(管琁E�E��E�社)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[14px] font-normal text-slate-700 flex items-center gap-2 leading-[1.5]">
                <Printer className="w-4 h-4" /> FAX番号 (OCR)
                <span className="text-xs bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-md ml-2 font-normal">
                  忁E�E��E�E                </span>
              </Label>
              <Input
                name="fax_number"
                value={formData.fax_number}
                onChange={handleChange}
                className="font-mono text-[14px] font-normal bg-blue-50/50 border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200 h-9"
                placeholder="03-0000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[14px] font-normal text-slate-700 leading-[1.5]">
                  管琁E�E��E�社吁E(OCR)
                  <span className="text-xs bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-md ml-2 font-normal">
                    忁E�E��E�E                  </span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecentDestinations(!showRecentDestinations)}
                  className="h-7 px-2 text-xs text-[#6b7280] hover:text-slate-900"
                >
                  <History className="w-3 h-3 mr-1" />
                  最近�E送信允E                </Button>
              </div>
              <div className="relative">
                <Input
                  name="company_name"
                  value={formData.company_name}
                  onChange={(e) => {
                    handleChange(e);
                    setCompanySearchQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (companySearchQuery.length >= 2) {
                      setShowCompanySearch(true);
                    }
                  }}
                  placeholder="侁E 株式会社サンプル不動産"
                  className="h-9 text-[14px] bg-blue-50/50 border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  required
                />
                {isAutoCompleting && (
                  <div className="absolute right-2 top-2">
                    <Sparkles className="w-4 h-4 text-[#2563eb] animate-pulse" />
                  </div>
                )}
                
                {/* 検索結果ドロチE�E�Eダウン */}
                {showCompanySearch && companySearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {companySearchResults.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            company_name: company.name,
                            fax_number: company.fax || prev.fax_number,
                            company_phone: company.phone || prev.company_phone
                          }));
                          setShowCompanySearch(false);
                          setCompanySearchQuery("");
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50 border-b border-[#e5e7eb] last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{company.name}</p>
                            {company.fax && (
                              <p className="text-xs text-[#6b7280] font-mono">FAX: {company.fax}</p>
                            )}
                            {company.properties.length > 0 && (
                              <p className="text-xs text-[#6b7280] mt-1">
                                物件: {company.properties.map(p => p.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <Search className="w-4 h-4 text-[#6b7280]" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 最近�E送信先ドロチE�Eダウン */}
                {showRecentDestinations && recentDestinations.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-[#e5e7eb] bg-slate-50">
                      <p className="text-xs font-semibold text-slate-700">最近の送信先</p>
                    </div>
                    {recentDestinations.map((dest, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            company_name: dest.company_name,
                            fax_number: dest.fax_number,
                            company_phone: dest.company_phone || prev.company_phone,
                            property_name: dest.property_name || prev.property_name
                          }));
                          setShowRecentDestinations(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50 border-b border-[#e5e7eb] last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{dest.company_name}</p>
                            <p className="text-xs text-[#6b7280] font-mono">FAX: {dest.fax_number}</p>
                            {dest.property_name && (
                              <p className="text-xs text-[#6b7280] mt-1">物件: {dest.property_name}</p>
                            )}
                            <p className="text-xs text-[#6b7280] mt-1">
                              {new Date(dest.last_sent_at).toLocaleDateString("ja-JP")} ({dest.count}囁E
                            </p>
                          </div>
                          <History className="w-4 h-4 text-[#6b7280]" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-[#e5e7eb]">
              <Label className="flex items-center gap-2 text-[14px] font-normal text-slate-700 leading-[1.5]">
                <Phone className="w-4 h-4" /> 電話番号 (OCR)
                <span className="text-xs bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-md ml-2 font-normal">
                  忁E�E��E�E                </span>
              </Label>
              <Input
                name="company_phone"
                value={formData.company_phone}
                onChange={handleChange}
                placeholder="侁E 03-1234-5678"
                className="h-9 text-[14px] bg-blue-50/50 border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                required
              />
              <p className="text-[14px] font-normal text-[#6b7280] leading-[1.5]">※ 送信後の解錠確認に使用します</p>
            </div>
            <div className="space-y-2 pt-3 border-t border-[#e5e7eb]">
              <Label className="text-[14px] font-normal text-slate-700 leading-[1.5]">
                物件吁E(OCR)
                <span className="text-xs bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-md ml-2 font-normal">
                  忁E�E��E�E                </span>
              </Label>
              <div className="relative">
                <Input
                  name="property_name"
                  value={formData.property_name}
                  onChange={(e) => {
                    handleChange(e);
                    // 物件名�E力時に管琁E��社を検索
                    if (e.target.value.length >= 2) {
                      fetch(`/api/properties/search?q=${encodeURIComponent(e.target.value)}`)
                        .then((res) => res.json())
                        .then((data) => {
                          if (Array.isArray(data) && data.length > 0) {
                            const matchedProperty = data[0];
                            // 物件名が一致する場合�Eみ自動補宁E
                            if (matchedProperty.name.includes(e.target.value) || e.target.value.includes(matchedProperty.name)) {
                              setFormData(prev => ({
                                ...prev,
                                property_name: matchedProperty.name,
                                company_name: matchedProperty.company?.name || prev.company_name,
                                fax_number: matchedProperty.company?.fax || prev.fax_number,
                                company_phone: matchedProperty.company?.phone || prev.company_phone
                              }));
                            }
                          }
                        })
                        .catch((err) => console.error("Failed to search property:", err));
                    }
                  }}
                  className="h-9 text-[14px] bg-blue-50/50 border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  placeholder="物件名を入力"
                  required
                />
                {isAutoCompleting && (
                  <div className="absolute right-2 top-2">
                    <Sparkles className="w-4 h-4 text-[#2563eb] animate-pulse" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-normal text-slate-700 leading-[1.5]">
                部屋番号 (OCR)
              </Label>
              <Input
                name="room_number"
                value={formData.room_number || ""}
                onChange={handleChange}
                placeholder="101（任意）"
                className="h-9 text-[14px] bg-blue-50/50 border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* 物件情報カード */}
        <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 leading-[1.5]">
              <MapPin className="w-5 h-5 text-green-600" /> 物件・冁E�E��E�惁E��
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-normal text-slate-700 flex items-center gap-2 leading-[1.5]">
                  <Calendar className="w-4 h-4" /> 冁E�E��E�希望日
                </Label>
                <Input
                  type="date"
                  name="visit_date"
                  value={formData.visit_date}
                  onChange={handleChange}
                  className="h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-normal text-slate-700 flex items-center gap-2 leading-[1.5]">
                  <Clock className="w-4 h-4" /> 冁E�E��E�希望時間
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Select
                      value={formData.visit_hour || ""}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, visit_hour: value }))}
                    >
                      <SelectTrigger className="h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="時" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {hourOptions.map((option) => (
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
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, visit_minute: value }))}
                    >
                      <SelectTrigger className="h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="分" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {minuteOptions.map((option) => (
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
            <div className="space-y-2">
              <Label className="text-[14px] font-normal text-slate-700 flex items-center gap-2 leading-[1.5]">
                <User className="w-4 h-4" /> 拁E�E��E�老E              </Label>
              <Select
                value={formData.staff_id || ""}
                onValueChange={(value) => {
                  const user = users.find((u: any) => u.id === Number(value));
                  setSelectedUser(user || null);
                  setFormData((prev) => ({ 
                    ...prev, 
                    staff_id: value,
                    staff_name: user?.name || ""
                  }));
                }}
              >
                <SelectTrigger className="h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                  <SelectValue 
                    placeholder="担当者を選択" 
                    displayValue={selectedUser ? selectedUser.name : formData.staff_name || ""}
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
              {selectedUser && (
                <p className="text-xs text-[#6b7280] leading-[1.5]">
                  選択中: {selectedUser.name} {selectedUser.business_card ? "（名刺あり）" : "（名刺なし）"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フローチE�E��E�ングアクションバ�E */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e5e7eb] p-6 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[14px] font-normal text-[#6b7280] hidden sm:block leading-[1.5]">
            入力�E容を確認して次へ進んでください
          </p>
          <Button
            onClick={() => {
              // 必須項目のバリデーション
              if (!formData.fax_number || !formData.company_name || !formData.company_phone || !formData.property_name) {
                alert("必須項目が入力されていません。FAX番号、管理会社名、電話番号、物件名は必須です。");
                return;
              }
              // 選択された担当者の名刺画像を含めて送信
              const dataToSend = {
                ...formData,
                business_card_image: selectedUser?.business_card || null,
                template_id: selectedTemplate,
                send_mode: sendMode,
                scheduled_at: sendMode === "scheduled" && scheduledDate && scheduledTime 
                  ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                  : null,
                retry_enabled: retryEnabled,
                retry_max: retryMax,
                retry_interval: retryInterval,
              };
              onNext(dataToSend);
            }}
            className="h-9 px-4 text-[14px] rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-1 w-full sm:w-auto"
          >
            プレビューを作�Eする <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
