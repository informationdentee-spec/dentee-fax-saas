"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Send, ArrowLeft, Building2, Phone, Printer, FileText, User, Calendar, Clock, MapPin, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PdfScreenProps {
  data?: any;
  allData?: Array<any>;
  uploadedImages?: Array<any>;
  currentIndex?: number;
  onBack: () => void;
  onComplete: (result: any) => void;
}

export function PdfScreen({ data, allData, uploadedImages, currentIndex = 0, onBack, onComplete }: PdfScreenProps) {
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(currentIndex);
  
  // 複数データがある場合はallDataを使用、ない場合はdataを使用
  const previewData = allData && allData.length > 0 ? allData[currentPreviewIndex] : data;

  // 会社惁E��と名刺画像を取征E
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((settingsData) => {
        if (settingsData.company) {
          setCompanyData({
            ...settingsData.company,
            users: settingsData.users || []
          });
        }
      })
      .catch((err) => console.error("Failed to fetch company data:", err));
  }, []);

  const handleSend = async () => {
    if (!allData || allData.length === 0) {
      // 単一データの場合
      if (!confirm("この内容でFAXを送信しますか？")) return;
      setLoading(true);
      try {
        const sendData = {
          ...data,
          status: data.send_mode === "scheduled" ? "scheduled" : "success",
          sent_at: data.send_mode === "scheduled" && data.scheduled_at 
            ? new Date(data.scheduled_at) 
            : new Date(),
          scheduled_at: data.send_mode === "scheduled" && data.scheduled_at 
            ? new Date(data.scheduled_at) 
            : null,
          image_url: uploadedImages && uploadedImages[currentPreviewIndex] ? uploadedImages[currentPreviewIndex].imageUrl : null,
          template_id: data.template_id || null,
          retry_enabled: data.retry_enabled || false,
          retry_max: data.retry_max || 3,
          retry_interval: data.retry_interval || 60,
        };
        const res = await fetch("/api/faxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendData),
        });

        if (res.ok) {
          const resultData = await res.json();
          // 送信結果にidが含まれていることを確認
          if (!resultData.id) {
            console.error("Response data:", resultData);
            alert("送信は成功しましたが、履歴IDの取得に失敗しました。");
          }
          onComplete([resultData]);
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`送信に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      } catch (e) {
        alert("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    } else {
      // 複数データの場合
      if (!confirm(`${allData.length}件のFAXを送信しますか？`)) return;
      setLoading(true);
      try {
        const results = [];
        for (let i = 0; i < allData.length; i++) {
          const sendData = {
            ...allData[i],
            status: allData[i].send_mode === "scheduled" ? "scheduled" : "success",
            sent_at: allData[i].send_mode === "scheduled" && allData[i].scheduled_at 
              ? new Date(allData[i].scheduled_at) 
              : new Date(),
            scheduled_at: allData[i].send_mode === "scheduled" && allData[i].scheduled_at 
              ? new Date(allData[i].scheduled_at) 
              : null,
            image_url: uploadedImages && uploadedImages[i] ? uploadedImages[i].imageUrl : null,
            template_id: allData[i].template_id || null,
            retry_enabled: allData[i].retry_enabled || false,
            retry_max: allData[i].retry_max || 3,
            retry_interval: allData[i].retry_interval || 60,
          };
          const res = await fetch("/api/faxes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sendData),
          });

          if (res.ok) {
            const resultData = await res.json();
            // 送信結果にidが含まれていることを確認
            if (!resultData.id) {
              console.error(`送信${i + 1}のレスポンスデータ:`, resultData);
            }
            results.push(resultData);
          } else {
            const errorData = await res.json().catch(() => ({}));
            console.error(`送信${i + 1}に失敗しました:`, errorData.error || '不明なエラー');
          }
        }
        onComplete(results);
      } catch (e) {
        alert("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-6 space-y-4 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">送信プレビュー</h2>
          <p className="text-[14px] font-normal text-[#6b7280] mt-2 leading-[1.5]">
            {allData && allData.length > 1 
              ? `${allData.length}件のFAXイメージを確認してください` 
              : "相手に届くFAXイメージを確認してください"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allData && allData.length > 1 && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                disabled={currentPreviewIndex === 0}
                className="h-8 px-3 text-[12px]"
              >
                前へ
              </Button>
              <span className="text-[14px] text-[#6b7280]">
                {currentPreviewIndex + 1} / {allData.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPreviewIndex(Math.min(allData.length - 1, currentPreviewIndex + 1))}
                disabled={currentPreviewIndex === allData.length - 1}
                className="h-8 px-3 text-[12px]"
              >
                次へ
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="h-9 px-4 text-[14px] rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] hover:border-[#d1d5db] font-normal gap-1"
          >
            <ArrowLeft className="w-4 h-4" />修正する
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 左側: PDFプレビューと送信惁E�� */}
        <div className="flex-1 space-y-4">
          {/* PDFプレビュー */}
          {uploadedImages && uploadedImages[currentPreviewIndex] && (
            <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
              <CardHeader className="border-b border-[#e5e7eb] pb-4">
                <CardTitle className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 leading-[1.5]">
                  <FileText className="w-5 h-5 text-[#2563eb]" /> PDFプレビュー
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-slate-50 p-4">
                  <img
                    src={uploadedImages[currentPreviewIndex].imageUrl}
                    alt="PDFプレビュー"
                    className="w-full h-auto rounded-md"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 送信先情報 */}
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb] pb-4">
              <CardTitle className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 leading-[1.5]">
                <Building2 className="w-5 h-5 text-[#2563eb]" /> 送信先情報
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6b7280]" />
                  <span className="text-[14px] font-normal text-[#6b7280]">管理会社:</span>
                </div>
                <span className="text-[14px] font-semibold text-slate-900">{previewData?.company_name || "-"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#6b7280]" />
                  <span className="text-[14px] font-normal text-[#6b7280]">FAX番号:</span>
                </div>
                <span className="text-[14px] font-mono font-semibold text-slate-900">{previewData?.fax_number || "-"}</span>
              </div>
              {previewData?.company_phone && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#6b7280]" />
                    <span className="text-[14px] font-normal text-[#6b7280]">電話番号:</span>
                  </div>
                  <span className="text-[14px] font-mono font-semibold text-slate-900">{previewData.company_phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6b7280]" />
                  <span className="text-[14px] font-normal text-[#6b7280]">物件名:</span>
                </div>
                <span className="text-[14px] font-semibold text-slate-900">{previewData?.property_name || "-"}</span>
              </div>
              {previewData?.room_number && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                  <span className="text-[14px] font-normal text-[#6b7280]">号室:</span>
                  <span className="text-[14px] font-semibold text-slate-900">{previewData.room_number}</span>
                </div>
              )}
              {(previewData?.visit_date || previewData?.visit_time) && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#6b7280]" />
                    <span className="text-[14px] font-normal text-[#6b7280]">内見希望:</span>
                  </div>
                  <span className="text-[14px] font-semibold text-slate-900">
                    {previewData?.visit_date || ""} {previewData?.visit_time || ""}
                  </span>
                </div>
              )}
              {previewData?.staff_name && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#6b7280]" />
                    <span className="text-[14px] font-normal text-[#6b7280]">担当者:</span>
                  </div>
                  <span className="text-[14px] font-semibold text-slate-900">{previewData.staff_name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側: FAXイメージプレビュー */}
        <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200/50 p-8 rounded-2xl border border-slate-300 shadow-lg flex justify-center min-h-[700px] w-full">
          <div className="bg-white w-full max-w-[210mm] aspect-[1/1.414] shadow-2xl p-12 text-[14px] text-slate-800 flex flex-col relative transform transition-transform duration-300 origin-top border border-slate-200">
            {/* 擬似的なFAX用紙デザイン */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800/10"></div>

            <h1 className="text-[20px] font-semibold border-b-2 border-slate-900 pb-3 mb-8 tracking-wide leading-[1.5]">
              内見依頼書
            </h1>

            <div className="mb-10 space-y-2">
              <h2 className="text-[18px] font-semibold underline decoration-slate-400 underline-offset-4 leading-[1.5]">
                {previewData?.company_name ? `${previewData.company_name} 御中` : ""}
              </h2>
            </div>

            <div className="space-y-3 mb-6 text-[14px] leading-[1.5] text-slate-700">
              <p>拝啓</p>
              <p>
                貴社ますますご清栄のこととお慶び申し上げます。<br />
                下記物件の内見をお願いしたく、ご連絡いたしました。
              </p>
              <p>何卒よろしくお願い申し上げます。</p>
              <p className="text-right">敬具</p>
            </div>

            <div className="border border-slate-800 p-5 bg-slate-50/80 mb-6 rounded-sm">
              <p className="font-semibold border-b border-slate-400 pb-2 mb-3 text-[18px] text-slate-900 leading-[1.5]">
                物件惁E��
              </p>
              <div className="grid grid-cols-[80px_1fr] gap-y-3 text-[14px]">
                {previewData?.property_name && (
                  <>
                    <div className="text-slate-600 font-normal">物件名</div>
                    <div className="font-semibold text-slate-900 leading-[1.5]">{previewData.property_name}</div>
                  </>
                )}

                {previewData?.room_number && (
                  <>
                    <div className="text-slate-600 font-normal">号室</div>
                    <div className="font-semibold text-slate-900 leading-[1.5]">{previewData.room_number}</div>
                  </>
                )}

                {(previewData?.visit_date || previewData?.visit_time) && (
                  <>
                    <div className="text-slate-600 font-normal">希望日時</div>
                    <div className="font-semibold text-slate-900 leading-[1.5]">
                      {previewData?.visit_date || ""} {previewData?.visit_time || ""}
                    </div>
                  </>
                )}
                {previewData?.staff_name && (
                  <>
                    <div className="text-slate-600 font-normal">担当者</div>
                    <div className="font-semibold text-slate-900 leading-[1.5]">{previewData.staff_name}</div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-300 flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 mb-1 font-normal">送信元</p>
                <p className="font-semibold text-[18px] text-slate-900 leading-[1.5]">{companyData?.name || previewData?.company_name || "株式会社サンプル不動産"}</p>
                {(companyData?.license_number || previewData?.license_number) && (
                  <p className="text-slate-700 text-[14px] font-normal leading-[1.5]">免許番号: {companyData?.license_number || previewData?.license_number}</p>
                )}
                <p className="text-slate-700 text-[14px] font-normal leading-[1.5]">担当: {previewData?.staff_name || "山田 太郎"}</p>
                <p className="text-slate-700 text-[14px] font-normal leading-[1.5]">TEL: {companyData?.phone || "03-1111-2222"}</p>
              </div>
              {(previewData?.business_card_image || (previewData?.staff_id && companyData?.users?.find((u: any) => u.id === Number(previewData.staff_id))?.business_card)) ? (
                <div className="max-w-[90mm] max-h-[50mm] border border-slate-300 rounded-sm overflow-hidden bg-white flex items-center justify-center">
                  <img 
                    src={previewData?.business_card_image || (previewData?.staff_id && companyData?.users?.find((u: any) => u.id === Number(previewData.staff_id))?.business_card)} 
                    alt="名刺" 
                    className="max-w-full max-h-full object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 border border-slate-300 flex items-center justify-center bg-slate-100 text-xs text-slate-500 rounded-sm font-normal">
                  名刺貼付
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右サイドのアクションパネル */}
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          <Card className="p-6 bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <h3 className="font-semibold text-[#2563eb] mb-4 flex items-center gap-2 text-[18px] leading-[1.5]">
              <Send className="w-5 h-5" /> 最終確認
            </h3>
            <div className="space-y-4 mb-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <p className="text-xs text-blue-700 font-normal uppercase tracking-wider mb-1">
                  送信先
                </p>
                <p className="font-semibold text-slate-900 text-[14px] leading-[1.5]">
                  {previewData?.company_name || ""}
                </p>
                {allData && allData.length > 1 && (
                  <p className="text-xs text-[#6b7280] mt-1">
                    {allData.length}件中 {currentPreviewIndex + 1}件目
                  </p>
                )}
              </div>
            </div>

            <Button
              className="h-9 px-4 text-[14px] rounded-md w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal shadow-sm"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 w-4 h-4" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 w-4 h-4" />
                  {allData && allData.length > 1 ? `${allData.length}件のFAXを送信する` : "FAXを送信する"}
                </>
              )}
            </Button>
            <p className="text-xs text-center text-[#6b7280] mt-2 font-normal leading-[1.5]">
              送信履歴に自動で保存されます
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
