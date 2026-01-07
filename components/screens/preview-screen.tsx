import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

interface PreviewScreenProps {
  data: any;
  onBack: () => void;
  onSendComplete: (result: any) => void;
}

export function PreviewScreen({ data, onBack, onSendComplete }: PreviewScreenProps) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      // API連携のモック（本来は /api/send-fax へPOST）
      // const res = await fetch("/api/send-fax", { ... });

      console.log("Sending FAX...", data);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒待機

      onSendComplete({
        success: true,
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Sending failed:", error);
      alert("送信に失敗しました。");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">送信プレビュー</h2>
        <p className="text-gray-500">内容を確認してFAX送信を実行してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左側：送信宛先情報 */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">送信宛先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">管理会社</p>
              <p className="font-semibold">{data.company_name || "（未入力）"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">FAX番号</p>
              <p className="font-semibold text-lg">{data.fax_number}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-gray-500 text-xs">物件名</p>
              <p className="font-medium">{data.property_name}</p>
              <p className="font-medium">{data.room_number}</p>
            </div>
          </CardContent>
        </Card>

        {/* 右側：PDFプレビューイメージ（モック） */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>内見依頼書イメージ</span>
              <span className="text-xs font-normal text-gray-400">A4サイズ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center bg-gray-100 min-h-[400px] rounded-md p-4">
            <div className="bg-white shadow-lg w-full max-w-sm aspect-[1/1.414] p-8 flex flex-col text-xs text-gray-800 border">
              <div className="text-center border-b-2 border-black pb-2 mb-4">
                <h1 className="text-xl font-bold">内見依頼書</h1>
              </div>
              <div className="mb-4">
                <p className="font-bold text-lg mb-1">{data.company_name} 御中</p>
                <p>FAX: {data.fax_number}</p>
              </div>
              <div className="border border-gray-300 p-2 mb-4 bg-gray-50">
                <p className="mb-1">以下の物件の内見をお願いいたします。</p>
                <div className="mt-2 pl-2 border-l-2 border-gray-300">
                  <p><span className="font-bold">物件名:</span> {data.property_name}</p>
                  <p><span className="font-bold">号室:</span> {data.room_number}</p>
                  <p><span className="font-bold">住所:</span> {data.address}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-dashed">
                  <p><span className="font-bold">希望日:</span> {data.visit_date || "未定"}</p>
                  <p><span className="font-bold">希望時間:</span> {data.visit_time || "未定"}</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <p className="font-bold">株式会社サンプル不動産</p>
                    <p>担当: 山田 太郎</p>
                    <p>TEL: 03-1111-2222</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 max-w-xl mx-auto pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={sending}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          修正する
        </Button>
        <Button
          onClick={handleSend}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={sending}
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              FAXを送信する
            </>
          )}
        </Button>
      </div>
    </div>
  );
}