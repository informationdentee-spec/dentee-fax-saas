import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ArrowLeft } from "lucide-react";

interface ConfirmScreenProps {
  data: any;
  onBack: () => void;
  onComplete: () => void;
}

export function ConfirmScreen({ data, onBack, onComplete }: ConfirmScreenProps) {
  const [loading, setLoading] = useState(false);

  // 送信ボタンが押されたときの処理
  const handleSend = async () => {
    // 確認ダイアログ
    if (!confirm("本当にFAXを送信しますか？")) return;

    setLoading(true);
    try {
      console.log("送信ボタンクリック：APIを呼び出します...");

      // ★ここが重要：/api/faxes にデータを送る
      const res = await fetch("/api/faxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        console.log("送信成功！");
        alert("送信が完了しました！PDFが生成されました。");
        onComplete(); // 完了画面へ移動
      } else {
        const err = await res.json();
        console.error("サーバーエラー:", err);
        alert("送信に失敗しました。サーバーログを確認してください。");
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 戻る
        </Button>
        <h2 className="text-2xl font-bold">送信内容の確認</h2>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">宛先（管理会社）</label>
            <p className="font-medium">{data.company_name || "未入力"}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">FAX番号</label>
            <p className="font-medium text-xl">{data.fax_number || "未入力"}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-500">物件名</label>
            <p className="font-medium">{data.property_name || "未入力"}</p>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 送信中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> FAXを送信する
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
