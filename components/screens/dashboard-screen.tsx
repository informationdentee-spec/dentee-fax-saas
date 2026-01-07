"use client";

import { useState } from "react";

export function DashboardScreen() {
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false); // OCR解析中フラグ
  const [sentFax, setSentFax] = useState<any>(null);

  // ★追加: 画像データ（Base64）と帯替えフラグ
  const [imageParam, setImageParam] = useState<string>("");
  const [useBand, setUseBand] = useState(true);

  // フォームの状態管理
  const [form, setForm] = useState({
    property_id: "",
    company_id: "",
    user_id: "",
    fax_number: "",
    notes: "",
    ocr_property_name: "",
    ocr_company_name: "",
  });

  // OCR実行 & 画像読み込み関数
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    // ファイルが選択されていない場合は何もしない
    if (!e.target.files || e.target.files.length === 0) return;

    // ★重要: 配列の番目を指定してファイル単体を取得
    const file = e.target.files.item(0);

    setAnalyzing(true);

    // 1. プレビューとPDF埋め込み用に画像を読み込む
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImageParam(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // 2. OCR解析のためにサーバーへ送信
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // 抽出結果をフォームに自動入力
        setForm(prev => ({
          ...prev,
          fax_number: data.extracted.fax_number || prev.fax_number,
          ocr_property_name: data.extracted.property_name || prev.ocr_property_name,
          ocr_company_name: data.extracted.company_name || prev.ocr_company_name,
          notes: prev.notes + (prev.notes ? "\n" : "") + "【OCR読取テキスト】\n" + data.text.slice(0, 100) + "...",
        }));
        alert("画像を解析しました！フォームを確認してください。");
      } else {
        alert("OCR解析に失敗しました");
      }
    } catch (error) {
      console.error(error);
      alert("通信エラー");
    } finally {
      setAnalyzing(false);
    }
  }

  // PDFプレビュー機能（画像送信対応版）
  async function handlePreview() {
    if (!form.fax_number) return alert("FAX番号を入力してください");

    try {
      const res = await fetch("/api/pdf/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ocr_company_name: form.ocr_company_name || "プレビュー管理会社",
          ocr_property_name: form.ocr_property_name || "プレビュー物件",
          // ★ここで画像を送信します
          image: imageParam,
          use_band: useBand,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        alert("PDF生成に失敗しました");
      }
    } catch (e) {
      console.error(e);
      alert("プレビュー生成エラー");
    }
  }

  // FAX送信機能
  async function handleSend() {
    if (!form.user_id) return alert("担当者ID（数値）を入力してください");
    setSending(true);
    try {
      const res = await fetch("/api/faxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: Number(form.property_id) || 0,
          company_id: Number(form.company_id) || 0,
          user_id: Number(form.user_id),
          fax_number: form.fax_number,
          notes: form.notes,
          status: "success",
          ocr_property_name: form.ocr_property_name || "名称未定物件",
          ocr_company_name: form.ocr_company_name || "名称未定管理会社",
        }),
      });
      if (res.ok) {
        setSentFax(await res.json());
        alert("送信（保存）が完了しました！");
      } else {
        const err = await res.json();
        alert("送信失敗: " + (err.error || "データベースエラー"));
      }
    } catch (e) {
      console.error(e);
      alert("通信エラーが発生しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">📝 新規FAX作成</h2>

      {/* ファイルアップロードエリア */}
      <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-800 font-bold mb-2">📄 マイソク画像をアップロード</p>
        <p className="text-sm text-blue-600 mb-4">画像からFAX番号や物件名を自動で読み取ります</p>

        <label className="cursor-pointer bg-white text-blue-600 font-bold py-2 px-6 rounded border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors inline-block">
          {analyzing ? "🔍 解析中..." : "📂 ファイルを選択"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={analyzing}
          />
        </label>
      </div>

      {/* ★追加: 読み込み画像のプレビュー表示エリア */}
      {imageParam && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <p className="text-sm font-bold text-gray-700 mb-2">📷 読み込み画像確認</p>
          <div className="flex items-start gap-4">
            <img src={imageParam} alt="Preview" className="h-32 w-auto object-contain border bg-white" />
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={useBand}
                  onChange={(e) => setUseBand(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-bold text-blue-800">✨ 自社帯に差し替える (ヘッダー自動生成)</span>
              </label>
              <p className="text-xs text-gray-500 leading-relaxed">
                ONにすると、チラシ上部（ヘッダー）をカットして<br />
                自社のロゴ・連絡先に置き換えたPDFを作成します。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* フォーム入力エリア */}
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">物件名 (OCR)</label>
            <input
              type="text"
              className="w-full border p-2 rounded bg-gray-50"
              placeholder="例: サンプルマンション"
              value={form.ocr_property_name}
              onChange={(e) => setForm({ ...form, ocr_property_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">管理会社名 (OCR)</label>
            <input
              type="text"
              className="w-full border p-2 rounded bg-gray-50"
              placeholder="例: サンプル管理会社"
              value={form.ocr_company_name}
              onChange={(e) => setForm({ ...form, ocr_company_name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">FAX番号 <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full border p-2 rounded text-lg font-mono"
            placeholder="03-0000-0000"
            value={form.fax_number}
            onChange={(e) => setForm({ ...form, fax_number: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">担当者ID <span className="text-red-500">*</span></label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            placeholder="例: 1"
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">備考・メモ</label>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="鍵の場所や注意事項など"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      {sentFax && (
        <div className="bg-green-50 p-4 rounded border border-green-200 text-green-800">
          ✅ FAX履歴を保存しました (ID: {sentFax.id})
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={handlePreview}
          className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          type="button"
        >
          👁️ PDFプレビュー
        </button>

        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-sm"
        >
          {sending ? "送信中..." : "📠 FAX送信 (保存)"}
        </button>
      </div>

    </div>
  );
}