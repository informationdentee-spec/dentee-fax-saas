"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Paperclip,
  MessageSquare,
  Edit,
  XCircle,
  FileCheck,
  UserCircle,
} from "lucide-react";

interface FaxTypeSelectionScreenProps {
  onSelectType: (type: string) => void;
}

const FAX_TYPES = [
  {
    id: "visit_request",
    name: "内見依頼",
    description: "〇月〇日〇時に内見希望です",
    icon: Calendar,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    requiresPropertyImage: true,
    frequency: "最も頻度が高い",
  },
  {
    id: "application",
    name: "申込書の送付",
    description: "入居申込書を管理会社へ送る",
    icon: FileText,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    requiresPropertyImage: false,
    frequency: "FAX文化が最も残っている領域",
  },
  {
    id: "additional_documents",
    name: "不足書類の提出",
    description: "追加で求められた資料を送付",
    icon: Paperclip,
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    requiresPropertyImage: false,
    frequency: "毎日起きる",
  },
  {
    id: "greeting",
    name: "お礼・連絡",
    description: "内見対応ありがとうございました",
    icon: MessageSquare,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    requiresPropertyImage: false,
    frequency: "メールよりFAXが好まれる",
  },
  {
    id: "correction",
    name: "修正依頼・差し替え",
    description: "申込書のこの部分を修正しました",
    icon: Edit,
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    requiresPropertyImage: false,
    frequency: "日常茶飯事",
  },
  {
    id: "cancellation",
    name: "取り下げ・キャンセル",
    description: "申込を取り下げます",
    icon: XCircle,
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    requiresPropertyImage: false,
    frequency: "急ぎの連絡",
  },
  {
    id: "contract",
    name: "契約関連の書類送付",
    description: "契約書のドラフト、修正箇所の送付",
    icon: FileCheck,
    color: "bg-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    requiresPropertyImage: false,
    frequency: "紙文化が強い",
  },
  {
    id: "business_card_only",
    name: "名刺だけFAX",
    description: "名刺のみを送信",
    icon: UserCircle,
    color: "bg-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
    requiresPropertyImage: false,
    frequency: "連絡用",
  },
];

export function FaxTypeSelectionScreen({ onSelectType }: FaxTypeSelectionScreenProps) {
  return (
    <div className="max-w-6xl mx-auto py-6 px-6 space-y-6 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">
          送信タイプを選択してください
        </h2>
        <p className="text-[14px] font-normal text-[#6b7280] leading-[1.5]">
          送信する内容に応じてタイプを選択すると、適切なテンプレートが自動で適用されます
        </p>
      </div>

      {/* 送信タイプ一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FAX_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`${type.bgColor} ${type.borderColor} border-2 rounded-lg p-6 text-left hover:shadow-md transition-all hover:scale-[1.02] group`}
            >
              <div className="flex items-start gap-4">
                <div className={`${type.color} p-3 rounded-lg text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-[14px] font-semibold ${type.textColor} leading-[1.5]`}>
                      {type.name}
                    </h3>
                    {type.requiresPropertyImage && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5">
                        図面必須
                      </Badge>
                    )}
                  </div>
                  <p className={`text-[12px] font-normal ${type.textColor} leading-[1.5] mb-2`}>
                    {type.description}
                  </p>
                  <p className="text-[11px] font-normal text-[#6b7280] leading-[1.5]">
                    {type.frequency}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ヒント */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-blue-900 leading-[1.5] mb-1">
                送信タイプについて
              </p>
              <p className="text-[13px] font-normal text-blue-800 leading-[1.5]">
                「内見依頼」を選択した場合は物件図面（マイソク）の添付が必須です。その他のタイプでは図面の添付は任意です。名刺だけFAXの場合は名刺のみが送信されます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Paperclip,
  MessageSquare,
  Edit,
  XCircle,
  FileCheck,
  UserCircle,
} from "lucide-react";

interface FaxTypeSelectionScreenProps {
  onSelectType: (type: string) => void;
}

const FAX_TYPES = [
  {
    id: "visit_request",
    name: "内見依頼",
    description: "〇月〇日〇時に内見希望です",
    icon: Calendar,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    requiresPropertyImage: true,
    frequency: "最も頻度が高い",
  },
  {
    id: "application",
    name: "申込書の送付",
    description: "入居申込書を管理会社へ送る",
    icon: FileText,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    requiresPropertyImage: false,
    frequency: "FAX文化が最も残っている領域",
  },
  {
    id: "additional_documents",
    name: "不足書類の提出",
    description: "追加で求められた資料を送付",
    icon: Paperclip,
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    requiresPropertyImage: false,
    frequency: "毎日起きる",
  },
  {
    id: "greeting",
    name: "お礼・連絡",
    description: "内見対応ありがとうございました",
    icon: MessageSquare,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    requiresPropertyImage: false,
    frequency: "メールよりFAXが好まれる",
  },
  {
    id: "correction",
    name: "修正依頼・差し替え",
    description: "申込書のこの部分を修正しました",
    icon: Edit,
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    requiresPropertyImage: false,
    frequency: "日常茶飯事",
  },
  {
    id: "cancellation",
    name: "取り下げ・キャンセル",
    description: "申込を取り下げます",
    icon: XCircle,
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    requiresPropertyImage: false,
    frequency: "急ぎの連絡",
  },
  {
    id: "contract",
    name: "契約関連の書類送付",
    description: "契約書のドラフト、修正箇所の送付",
    icon: FileCheck,
    color: "bg-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    requiresPropertyImage: false,
    frequency: "紙文化が強い",
  },
  {
    id: "business_card_only",
    name: "名刺だけFAX",
    description: "名刺のみを送信",
    icon: UserCircle,
    color: "bg-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
    requiresPropertyImage: false,
    frequency: "連絡用",
  },
];

export function FaxTypeSelectionScreen({ onSelectType }: FaxTypeSelectionScreenProps) {
  return (
    <div className="max-w-6xl mx-auto py-6 px-6 space-y-6 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <h2 className="text-[18px] font-semibold text-slate-900 leading-[1.5]">
          送信タイプを選択してください
        </h2>
        <p className="text-[14px] font-normal text-[#6b7280] leading-[1.5]">
          送信する内容に応じてタイプを選択すると、適切なテンプレートが自動で適用されます
        </p>
      </div>

      {/* 送信タイプ一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FAX_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`${type.bgColor} ${type.borderColor} border-2 rounded-lg p-6 text-left hover:shadow-md transition-all hover:scale-[1.02] group`}
            >
              <div className="flex items-start gap-4">
                <div className={`${type.color} p-3 rounded-lg text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-[14px] font-semibold ${type.textColor} leading-[1.5]`}>
                      {type.name}
                    </h3>
                    {type.requiresPropertyImage && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5">
                        図面必須
                      </Badge>
                    )}
                  </div>
                  <p className={`text-[12px] font-normal ${type.textColor} leading-[1.5] mb-2`}>
                    {type.description}
                  </p>
                  <p className="text-[11px] font-normal text-[#6b7280] leading-[1.5]">
                    {type.frequency}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ヒント */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-blue-900 leading-[1.5] mb-1">
                送信タイプについて
              </p>
              <p className="text-[13px] font-normal text-blue-800 leading-[1.5]">
                「内見依頼」を選択した場合は物件図面（マイソク）の添付が必須です。その他のタイプでは図面の添付は任意です。名刺だけFAXの場合は名刺のみが送信されます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








