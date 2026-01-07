"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, RefreshCw, Loader2, Inbox,
  Calendar, Building2, FileText, Sparkles, AlertCircle,
  Lightbulb, ArrowRight, CheckCircle2, Clock, AlertTriangle, Download
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReceivedFaxRecord {
  id: number;
  from_fax_number: string;
  from_company_name: string | null;
  received_at: string;
  image_url?: string | null;
  ocr_text?: string | null;
  ai_summary?: string | null;
  is_read: boolean;
  property_name?: string | null;
  room_number?: string | null;
  notes?: string | null;
  document_type?: string | null;
  urgency?: string | null;
  context_prediction?: string | null;
  next_actions?: string | null;
}

interface ContextPrediction {
  predicted_type: string; // "内見希望の件", "契約書類の送付依頼", "解約通知, "その他
  confidence: number; // 0-100
  related_sent_fax_id?: number; // 関連する送信FAXのID
  explanation: string; // 詳細な説明
}

interface NextAction {
  action: string; // "内見日程を調整して返信", "契約書類を確認する", "解約手続きを進める", "その他"
  priority: "high" | "medium" | "low";
  description: string;
}

export function ReceivedFaxScreen() {
  const [records, setRecords] = useState<ReceivedFaxRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ReceivedFaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    keyword: "", 
    unread: false,
    documentType: "",
    urgency: "",
    sortBy: "date" as "date" | "company" | "urgency",
    sortOrder: "desc" as "asc" | "desc"
  });
  const [selectedFax, setSelectedFax] = useState<ReceivedFaxRecord | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [contextPrediction, setContextPrediction] = useState<ContextPrediction | null>(null);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/received-faxes`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      // ダミーデータを設定（開発用）
      if (data.length === 0) {
        const dummyData: ReceivedFaxRecord[] = [
          {
            id: 1,
            from_fax_number: "03-1234-5678",
            from_company_name: "株式会社サンプル不動産",
            received_at: new Date().toISOString(),
            image_url: null,
            ocr_text: "内見希望の件\n\nいつもお世話になっております。\n\n以下の物件の内見をお願いいたします。\n\n物件名: サンプルマンション101号室\n希望日時: 2024年12月20日 14:00\n\nよろしくお願いいたします。",
            ai_summary: "内見希望の件。サンプルマンション101号室について、12月20日14:00に内見を希望するFAX。",
            is_read: false,
            property_name: "サンプルマンション",
            room_number: "101",
            document_type: "内見希望の件",
            urgency: "high",
            context_prediction: JSON.stringify({
              predicted_type: "内見希望の件",
              confidence: 95,
              explanation: "送信元の不動産会社からの問い合わせで、特定の物件名と部屋番号が記載されていることから、内見希望のFAXである可能性が高いです。"
            }),
            next_actions: JSON.stringify([
              {
                action: "内見日程を調整して返信",
                priority: "high",
                description: "送信元に内見日程を調整してFAXを返信する"
              },
              {
                action: "物件情報を確認",
                priority: "medium",
                description: "不動産会社に物件情報を確認する"
              },
              {
                action: "カレンダーに内見予定を登録",
                priority: "low",
                description: "内見日程が確定したらカレンダーに予定を登録する"
              }
            ])
          },
          {
            id: 2,
            from_fax_number: "03-2345-6789",
            from_company_name: "株式会社ABC不動産",
            received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            image_url: null,
            ocr_text: "契約書類の送付依頼\n\nいつもお世話になっております。\n\n以下の物件の契約書類を送付いただきたくお願いいたします。\n\n物件名: サンプルコート202号室\n\n契約書類の内容\n・賃貸借契約書\n・重要事項説明書\n\nよろしくお願いいたします。",
            ai_summary: "契約書類の送付依頼。サンプルコート202号室の賃貸借契約書と重要事項説明書の送付を依頼するFAX。",
            is_read: false,
            property_name: "サンプルコート",
            room_number: "202",
            document_type: "契約書類の送付依頼",
            urgency: "medium",
            context_prediction: JSON.stringify({
              predicted_type: "契約書類の送付依頼",
              confidence: 88,
              explanation: "1時間前に送信された不動産会社からの契約書類の送付依頼で、物件名と部屋番号が記載されており、契約書類の送付を依頼する内容です。"
            }),
            next_actions: JSON.stringify([
              {
                action: "契約書類を確認する",
                priority: "high",
                description: "契約書類と物件情報を確認してFAXを送信する"
              },
              {
                action: "重要事項説明書を準備",
                priority: "medium",
                description: "重要事項説明書を準備して送付する"
              }
            ])
          },
          {
            id: 3,
            from_fax_number: "03-3456-7890",
            from_company_name: "株式会社XYZ不動産",
            received_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            image_url: null,
            ocr_text: "解約通知の件\n\n解約のご連絡をいただきありがとうございます。\n\n物件: パークハイツ305号室\n解約予定日: 2025年1月末\n\n解約手続きの書類を送付いたしますので、ご確認の上ご返信をお願いいたします。",
            ai_summary: "解約通知の返信。パークハイツ305号室の解約予定日が2025年1月末で、解約手続きの書類を送付する旨を伝えるFAX。",
            is_read: true,
            property_name: "パークハイツ",
            room_number: "305",
            document_type: "解約通知",
            urgency: "medium",
            context_prediction: JSON.stringify({
              predicted_type: "解約通知",
              confidence: 92,
              explanation: "送信元の不動産会社からの連絡で、解約予定日が記載されており、解約通知の返信である可能性が高いです。"
            }),
            next_actions: JSON.stringify([
              {
                action: "解約の書類を準備",
                priority: "high",
                description: "解約の書類を準備して送付する"
              },
              {
                action: "契約書類を確認",
                priority: "medium",
                description: "契約書類を確認して解約手続きを進める"
              }
            ])
          }
        ];
        setRecords(dummyData);
      } else {
        setRecords(data);
      }
    } catch (error) {
      console.error(error);
      // エラー時のフォールバック
      const dummyData: ReceivedFaxRecord[] = [
        {
          id: 1,
          from_fax_number: "03-1234-5678",
          from_company_name: "株式会社サンプル不動産",
          received_at: new Date().toISOString(),
          image_url: null,
          ocr_text: "内見希望の件\n\nいつもお世話になっております。\n\n以下の物件の内見をお願いいたします。\n\n物件名: サンプルマンション101号室\n希望日時: 2024年12月20日 14:00\n\nよろしくお願いいたします。",
          ai_summary: "内見希望の件。サンプルマンション101号室について、12月20日14:00に内見を希望するFAX。",
          is_read: false,
          property_name: "サンプルマンション",
          room_number: "101",
          document_type: "内見希望の件",
          urgency: "high",
          context_prediction: JSON.stringify({
            predicted_type: "内見希望の件",
            confidence: 95,
            explanation: "送信元の不動産会社からの問い合わせで、特定の物件名と部屋番号が記載されていることから、内見希望のFAXである可能性が高いです。"
          }),
          next_actions: JSON.stringify([
            {
              action: "内見日程を調整して返信",
              priority: "high",
              description: "送信元に内見日程を調整してFAXを返信する"
            },
            {
              action: "物件情報を確認",
              priority: "medium",
              description: "不動産会社に物件情報を確認する"
            },
            {
              action: "カレンダーに内見予定を登録",
              priority: "low",
              description: "内見日程が確定したらカレンダーに予定を登録する"
            }
          ])
        }
      ];
      setRecords(dummyData);
    } finally {
      setIsLoading(false);
    }
  };

  // フィルターとソート
  useEffect(() => {
    let filtered = [...records];

    // キーワード検索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(r => 
        r.from_company_name?.toLowerCase().includes(keyword) ||
        r.from_fax_number?.includes(keyword) ||
        r.property_name?.toLowerCase().includes(keyword) ||
        r.ocr_text?.toLowerCase().includes(keyword) ||
        r.document_type?.toLowerCase().includes(keyword)
      );
    }

    // 書類タイプフィルター
    if (filters.documentType) {
      filtered = filtered.filter(r => r.document_type === filters.documentType);
    }

    // 緊急度フィルター
    if (filters.urgency) {
      filtered = filtered.filter(r => r.urgency === filters.urgency);
    }

    // 未読フィルター
    if (filters.unread) {
      filtered = filtered.filter(r => !r.is_read);
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "date":
          aValue = new Date(a.received_at).getTime();
          bValue = new Date(b.received_at).getTime();
          break;
        case "company":
          aValue = a.from_company_name || "";
          bValue = b.from_company_name || "";
          break;
        case "urgency":
          const urgencyOrder = { "high": 3, "medium": 2, "low": 1, null: 0 };
          aValue = urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0;
          bValue = urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0;
          break;
        default:
          aValue = new Date(a.received_at).getTime();
          bValue = new Date(b.received_at).getTime();
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
    fetchRecords();
  }, []);

  // FAX選択時の処理
  const handleFaxClick = async (fax: ReceivedFaxRecord) => {
    setSelectedFax(fax);
    setAiSummary(null);
    setContextPrediction(null);
    setNextActions([]);
    
    // 未読マークを更新
    if (!fax.is_read) {
      try {
        await fetch(`/api/received-faxes/${fax.id}/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        setRecords(prev => prev.map(r => r.id === fax.id ? { ...r, is_read: true } : r));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // AI要約を設定
    if (fax.ai_summary) {
      setAiSummary(fax.ai_summary);
    } else if (fax.ocr_text) {
      // ダミー要約を生成（実際のAPI呼び出しに置き換える）
      setTimeout(() => {
        setAiSummary(`受信FAXの要約 ${fax.from_company_name || fax.from_fax_number}からの受信。${fax.property_name ? `物件名: ${fax.property_name}` : ""}に関する問い合わせです`);
      }, 500);
    }

    // コンテキスト予測を取得
    setIsLoadingContext(true);
    try {
      if (fax.context_prediction) {
        // DBに保存されているデータを読み込む
        try {
          const prediction = JSON.parse(fax.context_prediction);
          setContextPrediction(prediction);
          setIsLoadingContext(false);
        } catch (e) {
          // JSON解析エラーの場合、APIから取得
          const contextRes = await fetch(`/api/received-faxes/${fax.id}/context`);
          if (contextRes.ok) {
            const contextData = await contextRes.json();
            if (contextData.prediction) {
              setContextPrediction(contextData.prediction);
            }
          }
          setIsLoadingContext(false);
        }
      } else {
        // APIから取得
        const contextRes = await fetch(`/api/received-faxes/${fax.id}/context`);
        if (contextRes.ok) {
          const contextData = await contextRes.json();
          if (contextData.prediction) {
            setContextPrediction(contextData.prediction);
          }
        }
        setIsLoadingContext(false);
      }
    } catch (error) {
      console.error("Failed to fetch context prediction:", error);
      setIsLoadingContext(false);
    }

    // 次のアクションを取得
    try {
      if (fax.next_actions) {
        // DBに保存されているデータを読み込む
        try {
          const actions = JSON.parse(fax.next_actions);
          if (Array.isArray(actions)) {
            setNextActions(actions);
          }
        } catch (e) {
          // JSON解析エラーの場合、APIから取得
          const actionsRes = await fetch(`/api/received-faxes/${fax.id}/next-actions`);
          if (actionsRes.ok) {
            const actionsData = await actionsRes.json();
            if (actionsData.actions && Array.isArray(actionsData.actions)) {
              setNextActions(actionsData.actions);
            }
          }
        }
      } else {
        // APIから取得
        const actionsRes = await fetch(`/api/received-faxes/${fax.id}/next-actions`);
        if (actionsRes.ok) {
          const actionsData = await actionsRes.json();
          if (actionsData.actions && Array.isArray(actionsData.actions)) {
            setNextActions(actionsData.actions);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch next actions:", error);
    }
  };

  const getUrgencyBadge = (urgency: string | null | undefined) => {
    if (!urgency) return null;
    switch (urgency) {
      case "high":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-medium px-2 py-0.5">緊急</Badge>;
      case "medium":
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-medium px-2 py-0.5">中</Badge>;
      case "low":
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-medium px-2 py-0.5">低</Badge>;
      default:
        return null;
    }
  };

  const getDocumentTypeBadge = (type: string | null | undefined) => {
    if (!type) return null;
    return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium px-2 py-0.5">{type}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "medium":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "low":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <ArrowRight className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* ページヘッダー */}
      <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-200/60 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">受信FAX一覧</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/faxes/export?type=received&format=csv`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `受信履歴-${new Date().toISOString().split('T')[0]}.csv`;
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
            <p className="text-sm text-slate-500">受信したFAXの管理と確認を行います</p>
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

      {/* 2カラムレイアウト: 左カラム受信FAX一覧、右カラム詳細パネル */}
      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* 左カラム: 受信FAX一覧 */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-w-0 overflow-hidden">
          {/* フィルターセクション */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            {/* 検索ボックス */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="送信元会社名、FAX番号、物件名で検索..."
                className="pl-10 h-10 bg-white border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>

            {/* フィルターオプション */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.unread ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ ...prev, unread: !prev.unread }))}
                className="h-9 px-3 text-sm font-medium transition-colors"
              >
                <Inbox className="w-4 h-4 mr-1.5" />
                未読のみ
              </Button>

              <Select
                value={filters.documentType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[160px] bg-white">
                  <SelectValue placeholder="書類タイプ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="内見希望の件">内見希望の件</SelectItem>
                  <SelectItem value="契約書類の送付依頼">契約書類の送付依頼</SelectItem>
                  <SelectItem value="解約通知">解約通知</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.urgency}
                onValueChange={(value) => setFilters(prev => ({ ...prev, urgency: value }))}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[130px] bg-white">
                  <SelectValue placeholder="緊急度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="high">緊急</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-");
                  setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                }}
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 w-[190px] bg-white">
                  <SelectValue placeholder="並び順" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">受信日時: 新しい順</SelectItem>
                  <SelectItem value="date-asc">受信日時: 古い順</SelectItem>
                  <SelectItem value="urgency-desc">緊急度: 高い順</SelectItem>
                  <SelectItem value="company-asc">送信元: あいうえお順</SelectItem>
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
                <p className="text-sm text-slate-500">該当するFAXが見つかりません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="w-12 text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">未読</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">受信日時</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">送信元</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">物件名</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">書類タイプ</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">緊急度</TableHead>
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
                        {new Date(fax.received_at).toLocaleString("ja-JP", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-slate-900 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{fax.from_company_name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900 py-3">
                        {fax.property_name || "-"}
                      </TableCell>
                      <TableCell className="py-3">
                        {getDocumentTypeBadge(fax.document_type)}
                      </TableCell>
                      <TableCell className="py-3">
                        {getUrgencyBadge(fax.urgency)}
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
                  {new Date(selectedFax.received_at).toLocaleString("ja-JP")}
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* PDFプレビュー */}
                  {selectedFax.image_url && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        受信FAX画像
                      </Label>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-3">
                        <img
                          src={selectedFax.image_url}
                          alt="受信FAX"
                          className="w-full h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity"
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
                        <div className="space-y-2.5">
                          <p className="text-sm text-slate-900 leading-relaxed">{aiSummary}</p>
                          <div className="flex items-center gap-1.5 text-xs text-blue-600">
                            <Sparkles className="w-3 h-3" />
                            <span>AIが自動生成</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <p className="text-sm text-slate-600">要約を生成中...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* コンテキスト予測 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-500" />
                      コンテキスト予測
                    </Label>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-100 rounded-lg p-4">
                      {isLoadingContext ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          <p className="text-sm text-slate-600">予測中...</p>
                        </div>
                      ) : contextPrediction ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">{contextPrediction.predicted_type}</span>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-medium px-2 py-0.5">
                              信頼度: {contextPrediction.confidence}%
                            </Badge>
                          </div>
                          <div className="bg-white/60 rounded-md p-3 border border-purple-100">
                            <p className="text-xs text-slate-700 leading-relaxed">{contextPrediction.explanation}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-purple-600">
                            <Lightbulb className="w-3 h-3" />
                            <span>送信元の不動産会社からの問い合わせで予測</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">コンテキスト予測を取得中...</p>
                      )}
                    </div>
                  </div>

                  {/* 次のアクション */}
                  {nextActions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-500" />
                        推奨アクション
                      </Label>
                      <div className="space-y-2.5">
                        {nextActions.map((action, index) => (
                          <Card 
                            key={index} 
                            className={`border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              action.priority === "high" 
                                ? "border-red-200 bg-gradient-to-br from-red-50 to-red-50/50" 
                                : action.priority === "medium" 
                                ? "border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-50/50" 
                                : "border-green-200 bg-gradient-to-br from-green-50 to-green-50/50"
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${
                                  action.priority === "high" ? "bg-red-100" :
                                  action.priority === "medium" ? "bg-yellow-100" :
                                  "bg-green-100"
                                }`}>
                                  {getPriorityIcon(action.priority)}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900 leading-snug">{action.action}</p>
                                    {action.priority === "high" && (
                                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-medium px-1.5 py-0">優先</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 pt-1">
                        <ArrowRight className="w-3 h-3" />
                        <span>AIが推奨する次のアクション</span>
                      </div>
                    </div>
                  )}

                  {/* 基本情報 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-900">
                      基本情報
                    </Label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">送信元</span>
                        <span className="font-semibold text-slate-900 text-right">{selectedFax.from_company_name || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">FAX番号</span>
                        <span className="font-mono text-slate-900">{selectedFax.from_fax_number}</span>
                      </div>
                      {selectedFax.property_name && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">物件名</span>
                          <span className="font-semibold text-slate-900 text-right">{selectedFax.property_name}</span>
                        </div>
                      )}
                      {selectedFax.room_number && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">部屋番号</span>
                          <span className="font-semibold text-slate-900">{selectedFax.room_number}</span>
                        </div>
                      )}
                      {selectedFax.document_type && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">書類タイプ</span>
                          <span className="font-semibold text-slate-900 text-right">{selectedFax.document_type}</span>
                        </div>
                      )}
                      {selectedFax.urgency && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">緊急度</span>
                          {getUrgencyBadge(selectedFax.urgency)}
                        </div>
                      )}
                      {selectedFax.ocr_text && (
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                          <span className="text-slate-500 block">OCRテキスト</span>
                          <span className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed block">{selectedFax.ocr_text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm text-slate-500 leading-relaxed">
                  FAXを選択すると<br />詳細情報を確認できます
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
