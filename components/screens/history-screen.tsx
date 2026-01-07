"use client";

import { useEffect, useState, useRef } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Copy, RefreshCw, Loader2, Key, MessageSquare,
  Calendar, Building2, User, Send, History, Printer,
  FileText, Sparkles, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle,
  Filter, ArrowUpDown, Inbox, Download
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";

interface FaxRecord {
  id: number;
  sent_at: string;
  fax_number: string;
  status: string;
  unlock_method: string | null;
  notes: string | null;
  image_url?: string | null;
  visit_date?: string | null;
  visit_time?: string | null;
  company_phone?: string | null;
  user: { name: string };
  property: { name: string };
  company: { name: string; phone?: string | null };
  room_number?: string;
  nearest_station?: string;
  staff_name?: string;
  is_read?: boolean;
}

interface HistoryScreenProps {
  onDuplicate?: (data: any) => void;
}

export function HistoryScreen({ onDuplicate }: HistoryScreenProps = {}) {
  const [records, setRecords] = useState<FaxRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    keyword: "", 
    company: "", 
    status: "", 
    purpose: "",
    unread: false,
    sortBy: "date" as "date" | "company" | "property",
    sortOrder: "desc" as "asc" | "desc"
  });
  const [selectedFax, setSelectedFax] = useState<FaxRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showObigae, setShowObigae] = useState(false);
  const [obigaeImage, setObigaeImage] = useState<string | null>(null);
  const [obigaeLoading, setObigaeLoading] = useState(false);
  const [obigaePdfUrl, setObigaePdfUrl] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [obiImage, setObiImage] = useState<string | null>(null);
  const [obiScale, setObiScale] = useState(100); // 帯の縮尺（%）
  const [obiPosition, setObiPosition] = useState({ x: 0, y: 0 }); // 帯の位置
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mysokuImageRef = React.useRef<HTMLImageElement | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [diffSummary, setDiffSummary] = useState<string | null>(null);

  // 担当者一覧と帯画像を取得
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
        if (data.settings?.obi_image) {
          setObiImage(data.settings.obi_image);
        }
      })
      .catch((err) => console.error("Failed to fetch settings:", err));
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const res = await fetch(`/api/faxes?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタリングとソート
  useEffect(() => {
    let filtered = [...records];

    // キーワード検索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(r => 
        r.company?.name?.toLowerCase().includes(keyword) ||
        r.property?.name?.toLowerCase().includes(keyword) ||
        r.fax_number?.includes(keyword) ||
        r.notes?.toLowerCase().includes(keyword)
      );
    }

    // 管理会社フィルタ
    if (filters.company) {
      filtered = filtered.filter(r => r.company?.name === filters.company);
    }

    // ステータスフィルタ
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // 送信目的フィルタ
    if (filters.purpose) {
      filtered = filtered.filter(r => (r as any).purpose === filters.purpose);
    }

    // 未読フィルタ
    if (filters.unread) {
      filtered = filtered.filter(r => !r.is_read);
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "date":
          aValue = new Date(a.sent_at).getTime();
          bValue = new Date(b.sent_at).getTime();
          break;
        case "company":
          aValue = a.company?.name || "";
          bValue = b.company?.name || "";
          break;
        case "property":
          aValue = a.property?.name || "";
          bValue = b.property?.name || "";
          break;
        default:
          aValue = new Date(a.sent_at).getTime();
          bValue = new Date(b.sent_at).getTime();
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredRecords(filtered);
  }, [records, filters]);

  useEffect(() => {
    // 履歴画面を開いたときに、3ヶ月以上経過したレコードを自動削除
    const cleanupOldRecords = async () => {
      try {
        await fetch("/api/faxes/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Failed to cleanup old records:", error);
      }
    };
    
    cleanupOldRecords();
    fetchRecords();
  }, []);

  const handleDuplicate = async (id: number) => {
    if (!confirm("この履歴を複製して編集画面で開きますか？")) return;
    try {
      const res = await fetch(`/api/faxes/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      const faxData = await res.json();
      
      const editData = {
        fax_number: faxData.fax_number || "",
        company_name: faxData.company?.name || "",
        company_phone: faxData.company_phone || faxData.company?.phone || "",
        property_name: faxData.property?.name || "",
        room_number: faxData.room_number || "",
        visit_date: faxData.visit_date || "",
        visit_time: faxData.visit_time || "",
        visit_hour: faxData.visit_time ? faxData.visit_time.split(':')[0] : "",
        visit_minute: faxData.visit_time ? faxData.visit_time.split(':')[1] : "",
        staff_name: faxData.user?.name || "",
        staff_id: String(faxData.user_id || ""),
        uploadedImageUrl: faxData.image_url || null,
        purpose: faxData.purpose || null,
      };
      
      if (onDuplicate) {
        onDuplicate(editData);
      }
    } catch (error) {
      console.error("Duplicate error:", error);
      alert(`データの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": 
        return <Badge className="bg-green-100 text-[#16a34a] border-green-200 text-[12px] font-normal">送信成功</Badge>;
      case "failed": 
        return <Badge className="bg-red-100 text-[#dc2626] border-red-200 text-[12px] font-normal">送信失敗</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-[#2563eb] border-blue-200 text-[12px] font-normal">予約送信</Badge>;
      default: 
        return <Badge className="bg-slate-100 text-[#6b7280] border-[#e5e7eb] text-[12px] font-normal">送信待ち</Badge>;
    }
  };

  // FAX選択時の処理
  const handleFaxClick = async (fax: FaxRecord) => {
    setSelectedFax(fax);
    
    // 未読フラグを更新
    if (!fax.is_read) {
      try {
        await fetch(`/api/faxes/${fax.id}/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        setRecords(prev => prev.map(r => r.id === fax.id ? { ...r, is_read: true } as any : r));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  // AI要約を取得
  useEffect(() => {
    if (selectedFax) {
      setAiSummary(null);
      setDiffSummary(null);
      
      fetch(`/api/faxes/${selectedFax.id}/summary`)
        .then((res) => res.json())
        .then((data) => {
          if (data.summary) {
            setAiSummary(data.summary);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch AI summary:", err);
          setAiSummary(`このFAXは内見申請に関する内容です。物件名: ${selectedFax.property?.name || '不明'}、管理会社: ${selectedFax.company?.name || '不明'}。内見希望日: ${selectedFax.visit_date || '未設定'}`);
        });

      // 差分要約を取得（同じ管理会社・物件の前回FAXと比較）
      const previousFax = records
        .filter(r => 
          r.id !== selectedFax.id &&
          r.company?.name === selectedFax.company?.name &&
          r.property?.name === selectedFax.property?.name
        )
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

      if (previousFax) {
        // 簡易的な差分要約（実際のAI実装時はAPIから取得）
        setDiffSummary(`前回のFAX（${new Date(previousFax.sent_at).toLocaleDateString("ja-JP")}）と比較して、内見希望日が変更されています。`);
      }
    }
  }, [selectedFax, records]);

  // 管理会社一覧を取得（フィルタ用）
  const companies = Array.from(new Set(records.map(r => r.company?.name).filter(Boolean))) as string[];

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* ページヘッダー */}
      <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-200/60 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">送信履歴</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/faxes/export?type=sent&format=csv`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `送信履歴-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } else {
                      alert("CSVエクスポートに失敗しました");
                    }
                  } catch (error) {
                    console.error("Export error:", error);
                    alert("CSVエクスポートに失敗しました");
                  }
                }}
                className="h-8 px-3 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                CSVエクスポート
              </Button>
            </div>
            <p className="text-sm text-slate-500">送信したFAXの履歴を確認できます</p>
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <span>⚠️</span>
              <span>送信データの保存期間は３ヶ月となっております。</span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchRecords}
            disabled={isLoading}
            className="h-9 px-4 text-sm font-medium bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            更新
          </Button>
        </div>
      </div>

      {/* 2カラムレイアウト: 左側一覧、右側詳細 */}
      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* 左カラム: 送信FAX一覧 */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-w-0 overflow-hidden">
          {/* フィルタ・ソートバー */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            {/* 検索バー */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="管理会社名、物件名、FAX番号で検索..."
                className="pl-10 h-10 bg-white border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>

            {/* フィルタオプション */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.company}
                onValueChange={(value) => setFilters(prev => ({ ...prev, company: value }))}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[180px] bg-white">
                  <SelectValue placeholder="管理会社で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[150px] bg-white">
                  <SelectValue placeholder="ステータスで絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="success">送信成功</SelectItem>
                  <SelectItem value="failed">送信失敗</SelectItem>
                  <SelectItem value="scheduled">予約送信</SelectItem>
                  <SelectItem value="pending">送信待ち</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.purpose}
                onValueChange={(value) => setFilters(prev => ({ ...prev, purpose: value }))}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[180px] bg-white">
                  <SelectValue placeholder="送信目的で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="visit_request">内見申請</SelectItem>
                  <SelectItem value="application">申込書の送付</SelectItem>
                  <SelectItem value="additional_documents">不足書類の提出</SelectItem>
                  <SelectItem value="business_card">名刺だけ送る</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={filters.unread ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ ...prev, unread: !prev.unread }))}
                className="h-9 px-3 text-sm font-medium transition-colors"
              >
                <Inbox className="w-4 h-4 mr-2" />
                未読のみ
              </Button>

              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-");
                  setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                }}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[180px] bg-white">
                  <SelectValue 
                    placeholder="並び替え"
                    displayValue={
                      filters.sortBy === "date" && filters.sortOrder === "desc" ? "日時: 新しい順" :
                      filters.sortBy === "date" && filters.sortOrder === "asc" ? "日時: 古い順" :
                      filters.sortBy === "company" && filters.sortOrder === "asc" ? "管理会社: あいうえお順" :
                      filters.sortBy === "property" && filters.sortOrder === "asc" ? "物件名: あいうえお順" :
                      "並び替え"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">日時: 新しい順</SelectItem>
                  <SelectItem value="date-asc">日時: 古い順</SelectItem>
                  <SelectItem value="company-asc">管理会社: あいうえお順</SelectItem>
                  <SelectItem value="property-asc">物件名: あいうえお順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* FAX一覧テーブル */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="text-sm text-slate-500">読み込み中...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Inbox className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">該当するFAXがありません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="w-12 text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">未読</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">送信日時</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">管理会社</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">物件名</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">号室</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">FAX番号</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">ステータス</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((fax) => (
                    <TableRow
                      key={fax.id}
                      onClick={() => handleFaxClick(fax)}
                      className={`cursor-pointer transition-all border-b border-slate-50 ${
                        selectedFax?.id === fax.id 
                          ? "bg-blue-50/50 border-l-2 border-l-blue-500 hover:bg-blue-50" 
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      <TableCell className="w-12 py-3">
                        {!fax.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-900 py-3 font-medium">
                        {new Date(fax.sent_at).toLocaleString("ja-JP", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-slate-900 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{fax.company?.name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900 py-3">
                        {fax.property?.name || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-900 py-3">
                        {fax.room_number || "-"}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-900 py-3">
                        {fax.fax_number}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(fax.status)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(fax.id);
                            }}
                            className="h-11 px-6 text-base rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-semibold"
                            title="複製・再送"
                          >
                            <Copy className="w-5 h-5 mr-2" />
                            複製
                          </Button>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFax(fax);
                              setShowObigae(true);
                              setObigaeImage(fax.image_url || null);
                            }}
                            className="h-11 px-6 text-base rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-semibold"
                            title="帯替え印刷"
                          >
                            <Printer className="w-5 h-5 mr-2" />
                            帯替え印刷
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>

        {/* 右カラム: 詳細パネル */}
        <div className="w-[420px] flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {selectedFax ? (
            <>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">詳細情報</h2>
                <p className="text-xs text-slate-500">
                  {new Date(selectedFax.sent_at).toLocaleString("ja-JP")}
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* PDFプレビュー */}
                  {selectedFax.image_url && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        マイソク図面
                      </Label>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-3">
                        <img
                          src={selectedFax.image_url}
                          alt="マイソク図面"
                          className="w-full h-auto rounded-md cursor-pointer hover:opacity-90"
                          onClick={() => setShowDetail(true)}
                        />
                      </div>
                    </div>
                  )}

                  {/* AI要約 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      AI要約
                    </Label>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-lg p-4">
                      {aiSummary ? (
                        <p className="text-sm font-normal text-slate-900 leading-relaxed">{aiSummary}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#2563eb]" />
                          <p className="text-sm font-normal text-slate-600">要約を生成中...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 差分要約 */}
                  {diffSummary && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        差分要約
                      </Label>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-50/50 border border-yellow-100 rounded-lg p-4">
                        <p className="text-sm font-normal text-slate-900 leading-relaxed">{diffSummary}</p>
                      </div>
                    </div>
                  )}

                  {/* 抽出データ */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">
                      抽出データ
                    </Label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">物件名:</span>
                        <span className="font-semibold text-slate-900">{selectedFax.property?.name || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">管理会社:</span>
                        <span className="font-semibold text-slate-900">{selectedFax.company?.name || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">FAX番号:</span>
                        <span className="font-mono text-slate-900">{selectedFax.fax_number}</span>
                      </div>
                      {selectedFax.room_number && (
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">号室:</span>
                          <span className="font-semibold text-slate-900">{selectedFax.room_number}</span>
                        </div>
                      )}
                      {selectedFax.visit_date && (
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">内見予約日:</span>
                          <span className="font-semibold text-slate-900">{selectedFax.visit_date} {selectedFax.visit_time || ""}</span>
                        </div>
                      )}
                      {selectedFax.company_phone && (
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">電話番号:</span>
                          <span className="font-semibold text-slate-900">{selectedFax.company_phone}</span>
                        </div>
                      )}
                      {selectedFax.unlock_method && (
                        <div className="pt-2 border-t border-[#e5e7eb]">
                          <span className="text-[#6b7280] block mb-1">解錠方法:</span>
                          <span className="font-semibold text-slate-900">{selectedFax.unlock_method}</span>
                        </div>
                      )}
                      {selectedFax.notes && (
                        <div className="pt-2 border-t border-[#e5e7eb]">
                          <span className="text-[#6b7280] block mb-1">備考:</span>
                          <span className="font-normal text-slate-900 whitespace-pre-wrap text-xs">{selectedFax.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={() => setShowDetail(true)}
                      className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal w-full"
                    >
                      詳細を確認
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDuplicate(selectedFax.id)}
                      className="h-11 px-6 text-base rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-semibold w-full"
                    >
                      <Copy className="w-5 h-5 mr-2" /> 複製・再送
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowObigae(true);
                        setObigaeImage(selectedFax.image_url || null);
                      }}
                      className="h-11 px-6 text-base rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-semibold w-full"
                    >
                      <Printer className="w-5 h-5 mr-2" /> 帯替え印刷
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-[#6b7280]" />
                <p className="text-sm font-normal text-[#6b7280] leading-relaxed">
                  FAXを選択して<br />詳細を確認してください
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {showDetail && selectedFax && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(false)}>
          <Card 
            className="bg-white border-[#e5e7eb] shadow-lg rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6 border-b border-[#e5e7eb] pb-4">
                <h3 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">送信履歴の詳細</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetail(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* マイソク画像の表示 */}
                {selectedFax.image_url && (
                  <div>
                    <p className="text-xs text-[#6b7280] mb-2 font-normal">マイソク図面</p>
                    <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-slate-50 p-4">
                      <img 
                        src={selectedFax.image_url} 
                        alt="マイソク図面" 
                        className="max-w-full max-h-96 object-contain mx-auto rounded-md"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-[#6b7280] mb-1 font-normal">送信日時</p>
                  <p className="text-[14px] font-normal text-slate-900 leading-[1.5]">
                    {new Date(selectedFax.sent_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-[#6b7280] mb-1 font-normal">送信先</p>
                  <p className="text-[14px] font-semibold text-slate-900 leading-[1.5]">
                    {selectedFax.company?.name || "（管理会社不明）"}
                  </p>
                  <p className="text-[14px] font-mono text-[#6b7280] leading-[1.5]">
                    FAX: {selectedFax.fax_number}
                  </p>
                  {selectedFax.company_phone && (
                    <p className="text-[14px] font-mono text-[#6b7280] leading-[1.5]">
                      TEL: {selectedFax.company_phone}
                    </p>
                  )}
                </div>
                
                <div>
                  <p className="text-xs text-[#6b7280] mb-1 font-normal">物件情報</p>
                  <p className="text-[14px] font-semibold text-slate-900 leading-[1.5]">
                    {selectedFax.property?.name || "（物件名不明）"}
                  </p>
                </div>
                
                {(selectedFax.visit_date || selectedFax.visit_time) && (
                  <div>
                    <p className="text-xs text-[#6b7280] mb-1 font-normal">内見予約</p>
                    <p className="text-[14px] font-normal text-slate-900 leading-[1.5]">
                      {selectedFax.visit_date && (
                        <span>日: {selectedFax.visit_date}</span>
                      )}
                      {selectedFax.visit_date && selectedFax.visit_time && " / "}
                      {selectedFax.visit_time && (
                        <span>時間: {selectedFax.visit_time}</span>
                      )}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-[#6b7280] mb-1 font-normal">担当者</p>
                  <p className="text-[14px] font-normal text-slate-900 leading-[1.5]">
                    {selectedFax.user?.name || "（担当者不明）"}
                  </p>
                </div>
                
                {selectedFax.unlock_method && (
                  <div>
                    <p className="text-xs text-[#6b7280] mb-1 font-normal">解錠方法</p>
                    <p className="text-[14px] font-normal text-slate-900 leading-[1.5] bg-blue-50 p-3 rounded-md border border-blue-200">
                      {selectedFax.unlock_method}
                    </p>
                  </div>
                )}
                
                {selectedFax.notes && (
                  <div>
                    <p className="text-xs text-[#6b7280] mb-1 font-normal">備考・注意事項</p>
                    <p className="text-[14px] font-normal text-slate-900 leading-[1.5] bg-slate-50 p-3 rounded-md border border-[#e5e7eb] whitespace-pre-wrap">
                      {selectedFax.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 帯替え印刷モーダル */}
      {showObigae && selectedFax && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowObigae(false)}>
          <Card 
            className="bg-white border-[#e5e7eb] shadow-lg rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-[#e5e7eb] pb-4">
              <CardTitle className="text-[18px] font-semibold text-slate-900 leading-[1.5] flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#2563eb]" />
                帯替え印刷
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-[14px] font-normal text-slate-700 mb-2 leading-[1.5]">
                    マイソク図面に自社の帯情報を付け足したPDFを作成します。
                  </p>
                </div>

                {/* マイソク画像の表示 */}
                <div className="space-y-2">
                  <Label className="text-[14px] font-normal text-slate-700 leading-[1.5]">
                    マイソク図面
                  </Label>
                  {obigaeImage ? (
                    <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-slate-50 p-4 relative">
                      <div className="relative inline-block w-full"
                        onMouseMove={(e) => {
                          if (isDragging && mysokuImageRef.current) {
                            const rect = mysokuImageRef.current.getBoundingClientRect();
                            const newX = e.clientX - dragStart.x;
                            const newY = e.clientY - dragStart.y;
                            setObiPosition({
                              x: Math.max(0, Math.min(newX, rect.width)),
                              y: Math.max(0, Math.min(newY, rect.height))
                            });
                          }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                      >
                        <img 
                          ref={mysokuImageRef}
                          src={obigaeImage} 
                          alt="マイソク図面" 
                          className="max-w-full max-h-96 mx-auto rounded-md"
                        />
                        {obiImage && (
                          <div 
                            className="absolute cursor-move"
                            style={{
                              left: `${obiPosition.x}px`,
                              top: `${obiPosition.y}px`,
                              transform: `scale(${obiScale / 100})`,
                              transformOrigin: 'top left',
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                              setDragStart({
                                x: e.clientX - obiPosition.x,
                                y: e.clientY - obiPosition.y
                              });
                            }}
                          >
                            <img
                              src={obiImage}
                              alt="帯"
                              className="max-w-full h-auto select-none pointer-events-none"
                              style={{ opacity: 0.9 }}
                              draggable={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-[#e5e7eb] rounded-lg p-4 bg-slate-50">
                      <p className="text-sm text-[#6b7280]">マイソク図面が選択されていません</p>
                    </div>
                  )}
                </div>

                {/* 帯画像プレビュー */}
                {obiImage && (
                  <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
                    <Label className="text-[14px] font-normal text-slate-700 leading-[1.5]">
                      自社帯画像プレビュー
                    </Label>
                    <div className="w-full border border-[#e5e7eb] rounded-md overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={obiImage}
                        alt="自社帯画像"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* 帯の位置と縮尺調整 */}
                {obigaeImage && obiImage && (
                  <div className="space-y-4 pt-4 border-t border-[#e5e7eb]">
                    <h3 className="text-[16px] font-semibold text-slate-900">帯の位置と縮尺調整</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">縮尺: {obiScale}%</Label>
                        <Slider
                          value={[obiScale]}
                          onValueChange={(val) => setObiScale(val[0])}
                          max={200}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">X軸位置: {obiPosition.x}px</Label>
                        <Slider
                          value={[obiPosition.x]}
                          onValueChange={(val) => setObiPosition(prev => ({ ...prev, x: val[0] }))}
                          max={mysokuImageRef.current ? mysokuImageRef.current.offsetWidth : 400}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">Y軸位置: {obiPosition.y}px</Label>
                        <Slider
                          value={[obiPosition.y]}
                          onValueChange={(val) => setObiPosition(prev => ({ ...prev, y: val[0] }))}
                          max={mysokuImageRef.current ? mysokuImageRef.current.offsetHeight : 400}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF生成ボタン */}
                <div className="flex gap-3 pt-4 border-t border-[#e5e7eb]">
                  <Button
                    onClick={async () => {
                      if (!obigaeImage) {
                        alert("マイソク図面をアップロードしてください。");
                        return;
                      }
                      if (!obiImage) {
                        alert("自社帯画像をアップロードしてください。");
                        return;
                      }
                      setObigaeLoading(true);
                      try {
                        const res = await fetch("/api/obigae", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            image: obigaeImage,
                            obi_image: obiImage,
                            obi_scale: obiScale,
                            obi_position_x: obiPosition.x,
                            obi_position_y: obiPosition.y,
                          }),
                        });
                        if (res.ok) {
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          setObigaePdfUrl(url);
                        } else {
                          alert("帯替えPDFの生成に失敗しました。");
                        }
                      } catch (error) {
                        console.error("Obigae generation error:", error);
                        alert("エラーが発生しました。");
                      } finally {
                        setObigaeLoading(false);
                      }
                    }}
                    disabled={obigaeLoading || !obigaeImage || !obiImage}
                    className="h-11 px-6 text-base rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-1"
                  >
                    {obigaeLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> 生成中...
                      </>
                    ) : (
                      "帯替えPDFを生成"
                    )}
                  </Button>
                </div>

                {/* PDFプレビュー */}
                {obigaePdfUrl && (
                  <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
                    <Label className="text-[14px] font-normal text-slate-700 leading-[1.5]">
                      生成された帯替えPDF
                    </Label>
                    <div className="bg-slate-100 rounded-lg p-4 min-h-[500px] flex items-center justify-center border border-[#e5e7eb]">
                      <iframe 
                        src={obigaePdfUrl || ""} 
                        className="w-full h-full min-h-[600px] bg-white shadow rounded border-0"
                        title="帯替えPDFプレビュー"
                      />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        onClick={() => {
                          if (obigaePdfUrl) {
                            const link = document.createElement('a');
                            link.href = obigaePdfUrl;
                            link.download = `帯替え_${selectedFax.property?.name || '図面'}_${new Date().toISOString().split('T')[0]}.pdf`;
                            link.click();
                          }
                        }}
                        className="h-11 px-6 text-base rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold gap-2"
                      >
                        <Printer className="w-5 h-5" /> ダウンロード
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setObigaePdfUrl(null)}
                        className="h-11 px-6 text-base rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-normal"
                      >
                        閉じる
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
