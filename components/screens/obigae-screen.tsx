import { useEffect, useState, useRef } from "react";

export function ObigaeScreen() {
  const [loading, setLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 担当者一覧を取得
  useEffect(() => {
    fetch("/api/users").then(res => res.json()).then(data => setUsers(data));
  }, []);

  // 画像読み込み処理
  function handleFileChange(file: File) {
    setFileSelected(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setImageBase64(e.target.result as string);
    };
    reader.readAsDataURL(file);
    setPdfUrl(null); // ファイルが変わったらプレビューリセット
  }

  // 帯替えPDF生成実行
  async function handleGenerate() {
    if (!imageBase64) return;
    setLoading(true);

    try {
      const res = await fetch("/api/obigae", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          user_id: selectedUserId
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } else {
        alert("生成に失敗しました");
      }
    } catch (e) {
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">帯替え印刷ツール</h1>
      <p className="text-gray-600 mb-6">
        管理会社の図面（マイソク）をアップロードしてください。<br />
        下部の連絡先情報を隠し、自社の帯情報に差し替えたPDFを作成します。
      </p>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* 左側：操作パネル */}
        <div className="w-full lg:w-1/3 space-y-6 bg-white p-6 rounded shadow h-fit">

          {/* ファイルアップロード */}
          <div
            className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                handleFileChange(files[0]);
              }
            }}
          >
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFileChange(files[0]);
                }
              }}
            />
            <div className="text-4xl mb-2">🖼️</div>
            {fileSelected ? (
              <p className="font-bold text-blue-600">{fileSelected.name}</p>
            ) : (
              <p className="text-gray-500 font-bold">画像を選択またはドロップ</p>
            )}
          </div>

          {/* 担当者選択 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">帯に表示する担当者</label>
            <select
              className="w-full border p-2 rounded"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">（担当者なし）</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={!fileSelected || loading}
            className={`w-full py-4 rounded font-bold text-white shadow-lg text-lg
              ${!fileSelected || loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            {loading ? "生成中..." : "✨ 帯替えPDFを作成"}
          </button>
        </div>

        {/* 右側：プレビューエリア */}
        <div className="flex-1 bg-gray-200 rounded-lg p-4 min-h-[500px] flex items-center justify-center border">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full min-h-[600px] bg-white shadow rounded" />
          ) : (
            <div className="text-gray-500 text-center">
              <span className="text-4xl block mb-2">📄</span>
              <p>ここにプレビューが表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}