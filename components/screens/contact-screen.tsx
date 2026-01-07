"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";

interface ContactScreenProps {
  onClose: () => void;
}

export function ContactScreen({ onClose }: ContactScreenProps) {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("お問い合わせを受け付けました。ありがとうございます。");
        setFormData({
          company_name: "",
          contact_name: "",
          email: "",
          message: "",
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`送信に失敗しました: ${errorData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error("Contact submission error:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-6">
      <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
        <CardHeader className="border-b border-[#e5e7eb] pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
            <Mail className="w-5 h-5 text-[#2563eb]" />
            ご不明点等のお問い合わせ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-normal text-slate-700 leading-relaxed">
                会社名 <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                placeholder="例: 株式会社〇〇不動産"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal text-slate-700 leading-relaxed">
                ご担当者様名 <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                placeholder="例: 山田 太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal text-slate-700 leading-relaxed">
                ご返信先のメールアドレス <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                placeholder="例: contact@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-normal text-slate-700 leading-relaxed">
                問い合わせ内容 <span className="text-[#dc2626]">*</span>
              </Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="min-h-[120px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                placeholder="お問い合わせ内容をご記入ください"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    送信する
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




