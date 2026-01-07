"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Phone, Save, Home, Building2, Lock, StickyNote } from "lucide-react";

interface CompleteScreenProps {
  data: any;
  onReset: () => void;
  onNavigateToHistory?: () => void;
}

export function CompleteScreen({ data, onReset, onNavigateToHistory }: CompleteScreenProps) {
  // 複数データの場合は配列、単一の場合はオブジェクト
  const allResults = Array.isArray(data) ? data : [data];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [unlockMethods, setUnlockMethods] = useState<Array<string>>(new Array(allResults.length).fill(""));
  const [notesList, setNotesList] = useState<Array<string>>(new Array(allResults.length).fill(""));
  const [savedStatus, setSavedStatus] = useState<Array<boolean>>(new Array(allResults.length).fill(false));
  
  const currentData = allResults[currentIndex];
  const unlockMethod = unlockMethods[currentIndex] || "";
  const notes = notesList[currentIndex] || "";
  const isSaved = savedStatus[currentIndex] || false;

  const handleSave = async () => {
    // データにidがない場合、送信結果からidを取得
    let faxId = currentData?.id;
    
    if (!faxId && currentData) {
      // 送信直後の場合、APIレスポンスにidが含まれている可能性がある
      console.warn("IDが見つかりません。データを確認します:", currentData);
      
      // 送信結果を再取得するか、エラーを表示
      if (currentData.fax_number) {
        // 最新のFAXレコードを検索してIDを取得
        try {
          const searchRes = await fetch(`/api/faxes`);
          if (searchRes.ok) {
            const faxes = await searchRes.json();
            // FAX番号と送信日時で一致するレコードを探す
            const matchingFax = Array.isArray(faxes) 
              ? faxes.find((f: any) => 
                  f.fax_number === currentData.fax_number && 
                  (!currentData.sent_at || new Date(f.sent_at).getTime() - new Date(currentData.sent_at).getTime() < 60000)
                ) 
              : null;
            if (matchingFax) {
              faxId = matchingFax.id;
              // データを更新
              const updatedResults = [...allResults];
              updatedResults[currentIndex] = { ...updatedResults[currentIndex], id: faxId };
              // allResultsを更新する方法がないため、currentDataを直接更新
              Object.assign(currentData, { id: faxId });
            }
          }
        } catch (e) {
          console.error("Failed to search fax:", e);
        }
      }
    }
    
    if (!faxId) {
      console.error("Current data:", currentData);
      return alert("エラー: 履歴IDが見つかりません。ページを再読み込みして再度お試しください。");
    }
    
    try {
      const res = await fetch(`/api/faxes/${faxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          unlock_method: unlockMethod, 
          notes: notes,
          status: currentData?.status || "success"
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      // 現在のインデックスの保存状態を更新
      const updated = [...savedStatus];
      updated[currentIndex] = true;
      setSavedStatus(updated);
      
      // すべて保存済みの場合、または最後の項目の場合、履歴画面へ遷移
      if (updated.every(s => s) || currentIndex === allResults.length - 1) {
        if (onNavigateToHistory) {
          setTimeout(() => {
            onNavigateToHistory();
          }, 500);
        }
      } else {
        // 次の項目へ
        setCurrentIndex(currentIndex + 1);
      }
    } catch (e) {
      alert("保存に失敗しました");
    }
  };

  const handleUnlockMethodChange = (value: string) => {
    const updated = [...unlockMethods];
    updated[currentIndex] = value;
    setUnlockMethods(updated);
  };

  const handleNotesChange = (value: string) => {
    const updated = [...notesList];
    updated[currentIndex] = value;
    setNotesList(updated);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-50 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight leading-[1.5]">送信が完了しました</h2>
        <p className="text-[14px] font-normal text-[#6b7280] leading-[1.5]">
          {allResults.length > 1 ? `${allResults.length}件の` : ""}管理会社へ届いています。<br />
          続けて電話連絡を行い、解錠方法を確認しましょう。
        </p>
        {allResults.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="h-8 px-3 text-[12px]"
            >
              前へ
            </Button>
            <span className="text-[14px] text-[#6b7280]">
              {currentIndex + 1} / {allResults.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(allResults.length - 1, currentIndex + 1))}
              disabled={currentIndex === allResults.length - 1}
              className="h-8 px-3 text-[12px]"
            >
              次へ
            </Button>
          </div>
        )}
      </div>

      {/* Next Action カード */}
      <Card className="border-[#e5e7eb] shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="bg-[#2563eb] text-white px-6 py-4 font-normal flex justify-between items-center">
          <span className="flex items-center gap-2 text-[18px] leading-[1.5]">
            <Phone className="w-5 h-5" /> 管理会社へ電話する
          </span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm font-normal">
            Next Action
          </span>
        </div>
        <CardContent className="p-6 space-y-4">

          {/* 電話番号表示 */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-6 rounded-lg border border-[#e5e7eb] gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-slate-600 font-normal mb-2 flex items-center justify-center sm:justify-start gap-1 uppercase tracking-wide leading-[1.5]">
                <Building2 className="w-4 h-4" /> 管理会社 連絡先
              </p>
              <h3 className="text-[18px] font-semibold text-slate-900 mb-1 leading-[1.5]">{currentData?.company_name || "管理会社"}</h3>
              <p className="text-2xl font-mono font-semibold text-[#2563eb] tracking-tight leading-[1.5]">
                {currentData?.company_phone || currentData?.fax_number || "---"}
              </p>
            </div>
            {currentData?.company_phone && (
              <Button
                size="icon"
                className="rounded-full h-12 w-12 shadow-md bg-[#2563eb] hover:bg-[#1d4ed8] hover:scale-105 transition-all"
                asChild
              >
                <a href={`tel:${currentData.company_phone}`}>
                  <Phone className="w-6 h-6" />
                </a>
              </Button>
            )}
          </div>

          {/* 入力フォーム */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[14px] font-normal text-slate-700 flex items-center gap-2 leading-[1.5]">
                <Lock className="w-4 h-4 text-slate-500" /> 解錠方法 (KB番号など)
              </label>
              <Input
                placeholder="例: 現地KB 1234, 管理室で借用..."
                className="bg-white h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                value={unlockMethod}
                onChange={e => handleUnlockMethodChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-normal text-slate-700 flex items-center gap-2 leading-[1.5]">
                <StickyNote className="w-4 h-4 text-slate-500" /> 備考・注意事項
              </label>
              <Textarea
                placeholder="その他、言われたことや注意事項"
                className="bg-white min-h-[100px] text-[14px] font-normal border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200 leading-[1.5]"
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaved}
              className={`w-full h-9 px-4 text-[14px] rounded-md font-normal shadow-sm transition-all duration-300 gap-1 ${
                isSaved
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> 履歴に保存しました
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> 解錠方法を履歴に保存する
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>

      <div className="text-center pt-4 space-y-2">
        {onNavigateToHistory && (
          <Button
            onClick={() => {
              if (onNavigateToHistory) {
                onNavigateToHistory();
              }
            }}
            className="h-9 px-4 text-[14px] rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-1 mr-2"
          >
            <Home className="w-4 h-4 mr-2" /> 履歴を確認する
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onReset}
          className="h-9 px-4 text-[14px] rounded-md text-[#6b7280] hover:text-slate-700 hover:bg-[#f9fafb] font-normal gap-1"
        >
          <Home className="w-4 h-4 mr-2" /> トップに戻る
        </Button>
      </div>
    </div>
  );
}
