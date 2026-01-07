"use client"

import { useState } from "react"
import { CheckCircle, Phone, Save, Printer, Image as ImageIcon } from "lucide-react"

interface CompletionScreenProps {
  faxData: any
  onSave: (data: { unlock_method: string, notes: string }) => void
  onSkip: () => void
}

export function CompletionScreen({ faxData, onSave, onSkip }: CompletionScreenProps) {
  const [unlockMethod, setUnlockMethod] = useState("")
  const [notes, setNotes] = useState("")

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-2xl bg-[var(--bg)] rounded-[16px] shadow-xl border border-[var(--border)] overflow-hidden">

        {/* Step 1: ヘッダー */}
        <div className="bg-green-600 p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1 tracking-tight">管理会社に送信しました</h1>
            <p className="text-green-100 font-medium opacity-90">FAX送信完了</p>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* Step 2: 電話確認フロー */}
          <div className="bg-blue-50 border border-blue-100 rounded-[12px] p-6 relative">
            <div className="absolute -top-3 left-6 bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Next Action
            </div>
            <h2 className="text-blue-900 font-bold text-lg mb-2 mt-1">
              管理会社への電話確認
            </h2>
            <p className="text-sm text-blue-700/80 mb-6 leading-relaxed">
              管理会社に電話をして、<span className="font-bold border-b border-blue-300">解錠方法</span>や<span className="font-bold border-b border-blue-300">注意事項</span>を確認しましょう。
            </p>

            <div className="flex items-center justify-between bg-white p-4 rounded-[10px] border border-blue-200 shadow-sm group">
              <div>
                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">管理会社電話番号</p>
                <p className="text-3xl font-mono font-bold text-slate-800 tracking-tighter group-hover:text-[var(--primary)] transition-colors">
                  {faxData.company_phone || "03-9876-5432"}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-bold">
                  {faxData.company_name}
                </p>
              </div>
              <a href={`tel:${faxData.company_phone}`} className="bg-blue-100 text-[var(--primary)] p-3 rounded-full hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm">
                <Phone size={24} />
              </a>
            </div>
          </div>

          {/* 入力フォーム */}
          <div className="space-y-4">
            <div>
              <label className="label-base">解錠方法</label>
              <input
                className="input-base bg-slate-50 focus:bg-white"
                placeholder="例：暗証番号1234、鍵は現地ボックス..."
                value={unlockMethod}
                onChange={(e) => setUnlockMethod(e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">注意事項・メモ</label>
              <textarea
                className="input-base h-24 py-3 resize-none bg-slate-50 focus:bg-white"
                placeholder="例：ペット不可、2階なので階段注意..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* ★追加: 帯替え印刷セクション（1枚目から移動） */}
          <div className="border-t border-dashed border-slate-200 pt-6">
            <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-[12px] p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-full text-slate-600 border border-slate-200 shadow-sm shrink-0">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">マイソクの帯を自社用に差し替えて印刷</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    自社ロゴや帯に差し替えた状態で印刷し、<br />お客様へお渡しできます。
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-secondary h-[40px] text-sm shrink-0 whitespace-nowrap"
              >
                <ImageIcon size={16} />
                印刷する
              </button>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={onSkip}
              className="px-6 py-4 text-[var(--muted)] font-bold hover:bg-slate-50 rounded-[10px] transition-colors text-sm"
            >
              スキップ
            </button>
            <button
              onClick={() => onSave({ unlock_method: unlockMethod, notes })}
              className="flex-1 btn-primary h-[56px] bg-slate-900 hover:bg-slate-800 shadow-lg"
            >
              <Save size={18} />
              保存して完了
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}