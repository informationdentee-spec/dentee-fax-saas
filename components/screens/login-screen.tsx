"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, Mail, User } from "lucide-react";

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 簡易的なログイン処理（実際の実装では適切な認証が必要）
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "ログインに失敗しました");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white border-[#e5e7eb] shadow-lg rounded-lg">
        <CardHeader className="text-center pb-6 border-b border-[#e5e7eb]">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-[#2563eb] text-white">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-[24px] font-semibold text-slate-900 leading-[1.5]">
            RealEstate FAX
          </CardTitle>
          <p className="text-[14px] font-normal text-[#6b7280] mt-2 leading-[1.5]">
            不動産FAX管理システム
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-[14px] leading-[1.5]">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-[14px] font-normal text-slate-700 leading-[1.5] flex items-center gap-2">
                <Mail className="w-4 h-4" /> メールアドレス
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[14px] font-normal text-slate-700 leading-[1.5] flex items-center gap-2">
                <Lock className="w-4 h-4" /> パスワード
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="h-9 text-[14px] border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 px-4 text-[14px] rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ログイン中...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  ログイン
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
            <p className="text-xs text-center text-[#6b7280] leading-[1.5]">
              パスワードを忘れた場合は管理者にお問い合わせください
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




