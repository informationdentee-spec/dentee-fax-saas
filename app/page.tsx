"use client";

import { useState, useEffect } from "react";
import { NewSendScreen } from "@/components/screens/new-send-screen";
import { HistoryScreen } from "@/components/screens/history-screen";
import { ReceivedFaxScreen } from "@/components/screens/received-fax-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { ContactScreen } from "@/components/screens/contact-screen";
import { AddressBookScreen } from "@/components/screens/address-book-screen";
import { UsageSummary } from "@/components/usage/UsageSummary";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilePlus, History, Settings, LogOut, Building2, Mail, Send, Inbox, Users, FileText, CreditCard, BarChart3, Download, ChevronRight, ChevronDown, Bell, BookOpen, User, MoreHorizontal, Wrench, XCircle, FileText as FileTextIcon, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [screen, setScreen] = useState<"top" | "upload" | "send-history" | "receive-history" | "settings" | "contact" | "features" | "account" | "address-book" | "others">("top");
  const [settingsTab, setSettingsTab] = useState<"members" | "company" | "templates" | "usage" | "credit" | "business-card" | "data" | "system">("members");
  const [featuresTab, setFeaturesTab] = useState<"templates" | "business-card" | "system" | "obi">("templates");
  const [accountTab, setAccountTab] = useState<"company" | "members" | "credit" | "usage">("company");
  const [othersTab, setOthersTab] = useState<"cancellation" | "terms" | "privacy">("cancellation");
  const [showFeaturesSubmenu, setShowFeaturesSubmenu] = useState(false);
  const [showAccountSubmenu, setShowAccountSubmenu] = useState(false);
  const [showOthersSubmenu, setShowOthersSubmenu] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationReasonDetail, setCancellationReasonDetail] = useState("");
  const [cancellationAlternative, setCancellationAlternative] = useState("");
  const [initialEditData, setInitialEditData] = useState<any>(null);

  // 設定画面に遷移したときにサブメニューを自動展開
  useEffect(() => {
    if (screen === "settings") {
      setShowSettingsSubmenu(true);
    }
  }, [screen]);

  // ログイン状態を確認
  useEffect(() => {
    // ローカルストレージからログイン状態を確認
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);


  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("currentUser");
  };

  // 画面切り替えハンドラ（送信完了後は送信履歴に遷移）
  const handleAnalyzeComplete = () => {
    setScreen("send-history");
  };

  // 履歴から編集画面への遷移ハンドラ
  const handleDuplicateFromHistory = (data: any) => {
    setInitialEditData(data);
    setScreen("upload");
  };

  // ログインしていない場合はログイン画面を表示
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased flex">
      {/* サイドバー */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        {/* ロゴエリア */}
        <div className="h-16 border-b border-slate-200 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                不動産FAXクラウド
              </h1>
            </div>
          </div>
        </div>

        {/* メニューエリア */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* TOP */}
          <Button
            variant="ghost"
            onClick={() => setScreen("top")}
            className={`w-full justify-start h-10 px-3 text-sm font-medium transition-all ${screen === "top"
                ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Building2 className="w-4 h-4 mr-3" />
            TOP
          </Button>

          {/* 新規送信 */}
          <Button
            variant="ghost"
            onClick={() => setScreen("upload")}
            className={`w-full justify-start h-10 px-3 text-sm font-medium transition-all ${screen === "upload"
                ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Send className="w-4 h-4 mr-3" />
            新規送信
          </Button>

          {/* 区切り線 */}
          <div className="my-2 border-t border-slate-200" />

          {/* 送信履歴 */}
          <Button
            variant="ghost"
            onClick={() => setScreen("send-history")}
            className={`w-full justify-start h-10 px-3 text-sm font-medium transition-all ${screen === "send-history"
                ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <History className="w-4 h-4 mr-3" />
            送信履歴
          </Button>

          {/* 受信履歴 */}
          <Button
            variant="ghost"
            onClick={() => setScreen("receive-history")}
            className={`w-full justify-start h-10 px-3 text-sm font-medium transition-all ${screen === "receive-history"
                ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Inbox className="w-4 h-4 mr-3" />
            受信履歴
          </Button>

          {/* アドレス帳 */}
          <Button
            variant="ghost"
            onClick={() => setScreen("address-book")}
            className={`w-full justify-start h-10 px-3 text-sm font-medium transition-all ${screen === "address-book"
                ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <BookOpen className="w-4 h-4 mr-3" />
            アドレス帳
          </Button>

          {/* 機能設定 */}
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowFeaturesSubmenu(!showFeaturesSubmenu);
              }}
              className={`w-full justify-between h-10 px-3 text-sm font-medium transition-all ${screen === "features"
                  ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center">
                <Settings className="w-4 h-4 mr-3" />
                機能設定
              </div>
              {showFeaturesSubmenu ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            {/* 機能設定配下のサブメニュー */}
            {showFeaturesSubmenu && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("features");
                    setFeaturesTab("templates");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "features" && featuresTab === "templates"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5 mr-2.5" />
                  テンプレート
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("features");
                    setFeaturesTab("business-card");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "features" && featuresTab === "business-card"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-2.5" />
                  名刺テンプレート
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("features");
                    setFeaturesTab("obi");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "features" && featuresTab === "obi"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5 mr-2.5" />
                  帯画像の生成
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("features");
                    setFeaturesTab("system");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "features" && featuresTab === "system"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <Mail className="w-3.5 h-3.5 mr-2.5" />
                  通知メール
                </Button>
              </div>
            )}
          </div>

          {/* アカウント */}
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAccountSubmenu(!showAccountSubmenu);
              }}
              className={`w-full justify-between h-10 px-3 text-sm font-medium transition-all ${screen === "account"
                  ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3" />
                アカウント
              </div>
              {showAccountSubmenu ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            {/* アカウント配下のサブメニュー */}
            {showAccountSubmenu && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("account");
                    setAccountTab("company");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "account" && accountTab === "company"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5 mr-2.5" />
                  会社情報
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("account");
                    setAccountTab("members");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "account" && accountTab === "members"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <Users className="w-3.5 h-3.5 mr-2.5" />
                  メンバー管理
                </Button>
                {/* Stripe関連UIは非表示（将来のためコードは残す） */}
                {false && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setScreen("account");
                      setAccountTab("credit");
                    }}
                    className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "account" && accountTab === "credit"
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-2.5" />
                    お支払い情報
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("account");
                    setAccountTab("usage");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "account" && accountTab === "usage"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-2.5" />
                  利用明細
                </Button>
              </div>
            )}
          </div>

          {/* その他 */}
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowOthersSubmenu(!showOthersSubmenu);
              }}
              className={`w-full justify-between h-10 px-3 text-sm font-medium transition-all ${screen === "others"
                  ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center">
                <MoreHorizontal className="w-4 h-4 mr-3" />
                その他
              </div>
              {showOthersSubmenu ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            {/* その他配下のサブメニュー */}
            {showOthersSubmenu && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("others");
                    setOthersTab("cancellation");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "others" && othersTab === "cancellation"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <XCircle className="w-3.5 h-3.5 mr-2.5" />
                  解約申請
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("others");
                    setOthersTab("terms");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "others" && othersTab === "terms"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <FileTextIcon className="w-3.5 h-3.5 mr-2.5" />
                  利用規約
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScreen("others");
                    setOthersTab("privacy");
                  }}
                  className={`w-full justify-start h-9 px-3 text-xs font-medium transition-all ${screen === "others" && othersTab === "privacy"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <Shield className="w-3.5 h-3.5 mr-2.5" />
                  プライバシーポリシー
                </Button>
              </div>
            )}
          </div>

          {/* お問い合わせ */}
          <Button
            variant="ghost"
            onClick={() => setScreen("contact")}
            className={`w-full justify-start h-10 px-3 text-sm font-medium transition-all ${screen === "contact"
                ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Mail className="w-4 h-4 mr-3" />
            お問い合わせ
          </Button>
        </nav>

        {/* ユーザー情報エリア */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name || "ユーザー"}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.email || ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              title="ログアウト"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm h-16 flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">
              {screen === "top" && "TOP"}
              {screen === "upload" && "新規送信"}
              {screen === "send-history" && "送信履歴"}
              {screen === "receive-history" && "受信履歴"}
              {screen === "settings" && "設定"}
              {screen === "contact" && "お問い合わせ"}
              {screen === "features" && "機能設定"}
              {screen === "account" && "アカウント"}
              {screen === "address-book" && "アドレス帳"}
              {screen === "others" && "その他"}
            </div>
          </div>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 overflow-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {screen === "top" && (
              <div className="max-w-7xl mx-auto py-6 px-6 space-y-6">
                {/* クイックアクション */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 新規送信 */}
                  <button
                    onClick={() => setScreen("upload")}
                    className="group relative overflow-hidden bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                        <Send className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">新規送信</h3>
                    <p className="text-sm text-slate-500">FAXを新規作成して送信します</p>
                  </button>

                  {/* 送信履歴 */}
                  <button
                    onClick={() => setScreen("send-history")}
                    className="group relative overflow-hidden bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                        <History className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">送信履歴</h3>
                    <p className="text-sm text-slate-500">過去に送信したFAXを確認します</p>
                  </button>

                  {/* 受信履歴 */}
                  <button
                    onClick={() => setScreen("receive-history")}
                    className="group relative overflow-hidden bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                        <Inbox className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">受信履歴</h3>
                    <p className="text-sm text-slate-500">受信したFAXを確認します</p>
                  </button>
                </div>

                {/* お知らせセクション */}
                <div className="mt-8">
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">お知らせ</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">重要</span>
                          <span className="text-xs text-slate-500">2026年1月14日</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">システムメンテナンスのお知らせ</h3>
                        <p className="text-sm text-slate-600">
                          2026年1月14日（水）2:00-4:00の間、システムメンテナンスを実施いたします。
                          この間はサービスをご利用いただけません。ご不便をおかけして申し訳ございません。
                        </p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">新機能</span>
                          <span className="text-xs text-slate-500">2026年1月1日</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">アドレス帳機能の追加予定</h3>
                        <p className="text-sm text-slate-600">
                          よく使用する送信先を登録できるアドレス帳機能を追加予定です。詳細は後日お知らせいたします。
                        </p>
                      </div>
                      <div className="border-l-4 border-slate-300 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded">お知らせ</span>
                          <span className="text-xs text-slate-500">2026年1月6日</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">サービス利用規約の更新</h3>
                        <p className="text-sm text-slate-600">
                          サービス利用規約を更新いたしました。詳細は設定画面からご確認ください。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 利用状況サマリー */}
                <div className="mt-8">
                  <UsageSummary userId={currentUser?.supabase_user_id || undefined} />
                </div>
              </div>
            )}
            {screen === "upload" && (
              <NewSendScreen
                onSendComplete={handleAnalyzeComplete}
                onNavigateToHistory={handleAnalyzeComplete}
                initialEditData={initialEditData}
                onEditDataCleared={() => setInitialEditData(null)}
              />
            )}
            {screen === "send-history" && <HistoryScreen onDuplicate={handleDuplicateFromHistory} />}
            {screen === "receive-history" && <ReceivedFaxScreen />}
            {screen === "settings" && (
              <SettingsScreen
                activeTab={settingsTab}
                onTabChange={setSettingsTab}
                onNavigateToSend={() => setScreen("upload")}
                onNavigateToReceive={() => setScreen("receive-history")}
              />
            )}
            {screen === "features" && (
              <SettingsScreen
                activeTab={featuresTab === "templates" ? "templates" : featuresTab === "business-card" ? "business-card" : featuresTab === "obi" ? "system" : "system"}
                onTabChange={(tab) => {
                  if (tab === "templates") setFeaturesTab("templates");
                  else if (tab === "business-card") setFeaturesTab("business-card");
                  else if (tab === "system") {
                    // obiタブの場合はsystemタブとして扱うが、obiコンテンツを表示
                    setFeaturesTab("obi");
                  }
                }}
                onNavigateToSend={() => setScreen("upload")}
                onNavigateToReceive={() => setScreen("receive-history")}
                allowedTabs={["templates", "business-card", "system"]}
                showObiTab={featuresTab === "obi"}
              />
            )}
            {screen === "account" && (
              <SettingsScreen
                activeTab={accountTab === "company" ? "company" : accountTab === "members" ? "members" : accountTab === "credit" ? "credit" : "usage"}
                onTabChange={(tab) => {
                  if (tab === "company") setAccountTab("company");
                  else if (tab === "members") setAccountTab("members");
                  else if (tab === "credit") setAccountTab("credit");
                  else if (tab === "usage") setAccountTab("usage");
                }}
                onNavigateToSend={() => setScreen("upload")}
                onNavigateToReceive={() => setScreen("receive-history")}
                allowedTabs={["company", "members", "usage"]}
              />
            )}
            {screen === "others" && (
              <div className="max-w-7xl mx-auto py-6 px-6">
                <div className="space-y-6">
                  {othersTab === "cancellation" && (
                    <Card className="bg-white border-[#e5e7eb]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-slate-700" />
                          解約申請
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* 解約のルール */}
                        <div className="pb-6 border-b border-[#e5e5e5]">
                          <h3 className="font-semibold text-slate-900 mb-3">解約のルール</h3>
                          <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                            <li>解約申請をいただいた月の末日をもって退会となります（当月申請 → 翌月末退会）。</li>
                            <li>退会日まではサービスをご利用いただけます。</li>
                            <li>解約月の利用料金は月末締めで計算され、次回請求時に精算されます。</li>
                            <li>解約理由の入力は必須です。</li>
                          </ul>
                        </div>

                        {/* 注意事項 */}
                        <div className="pb-6 border-b border-[#e5e5e5]">
                          <h3 className="font-semibold text-slate-900 mb-3">注意事項</h3>
                          <p className="text-sm text-slate-700">
                            解約後はデータが削除されます。必要なデータは事前に保存してください。
                          </p>
                        </div>

                        {/* 申請ルール */}
                        <div className="pb-6 border-b border-[#e5e5e5]">
                          <h3 className="font-semibold text-slate-900 mb-3">申請ルール</h3>
                          <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                            <li>解約申請は、アカウント管理者のみが行うことができます。</li>
                            <li>解約理由は必須項目です。詳細な理由をご記入ください。</li>
                            <li>解約申請後、確認メールが送信されます。メール内のリンクから解約を確定してください。</li>
                            <li>解約確定後、解約処理が開始されます。</li>
                          </ul>
                        </div>

                        {/* 解約申請フォーム */}
                        <div className="space-y-4 pt-4">
                          <h3 className="font-semibold text-slate-900 mb-4">解約申請フォーム</h3>
                          <form onSubmit={async (e) => {
                            e.preventDefault();

                            if (!cancellationReason || !cancellationReasonDetail) {
                              alert("解約理由と解約理由詳細は必須項目です。");
                              return;
                            }

                            if (!confirm("解約申請を送信しますか？\n\n解約後はデータの復元ができません。")) {
                              return;
                            }

                            try {
                              const data = {
                                reason: cancellationReason,
                                reason_detail: cancellationReasonDetail,
                                alternative: cancellationAlternative || null,
                              };

                              const res = await fetch("/api/cancellation", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(data),
                              });

                              if (res.ok) {
                                alert("解約申請を受け付けました。確認メールを送信いたします。");
                                setCancellationReason("");
                                setCancellationReasonDetail("");
                                setCancellationAlternative("");
                              } else {
                                const errorData = await res.json().catch(() => ({}));
                                alert(`解約申請に失敗しました: ${errorData.error || '不明なエラー'}`);
                              }
                            } catch (error) {
                              console.error("Cancellation error:", error);
                              alert("エラーが発生しました。もう一度お試しください。");
                            }
                          }} className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">
                                解約理由 <span className="text-slate-600">*</span>
                              </Label>
                              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                                <SelectTrigger className="h-10">
                                  <SelectValue
                                    placeholder="解約理由を選択してください"
                                    displayValue={
                                      cancellationReason === "cost" ? "料金が高い" :
                                        cancellationReason === "not_used" ? "使用頻度が低い" :
                                          cancellationReason === "alternative" ? "代替手段に変更" :
                                            cancellationReason === "functionality" ? "機能が不足している" :
                                              cancellationReason === "support" ? "サポートが不十分" :
                                                cancellationReason === "business_closed" ? "事業を閉鎖" :
                                                  cancellationReason === "other" ? "その他" :
                                                    undefined
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cost">料金が高い</SelectItem>
                                  <SelectItem value="not_used">使用頻度が低い</SelectItem>
                                  <SelectItem value="alternative">代替手段に変更</SelectItem>
                                  <SelectItem value="functionality">機能が不足している</SelectItem>
                                  <SelectItem value="support">サポートが不十分</SelectItem>
                                  <SelectItem value="business_closed">事業を閉鎖</SelectItem>
                                  <SelectItem value="other">その他</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">
                                解約理由詳細 <span className="text-slate-600">*</span>
                              </Label>
                              <Textarea
                                value={cancellationReasonDetail}
                                onChange={(e) => setCancellationReasonDetail(e.target.value)}
                                className="min-h-[120px]"
                                placeholder="解約理由の詳細をご記入ください"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-900">
                                解約後の代替手段
                              </Label>
                              <Select value={cancellationAlternative} onValueChange={setCancellationAlternative}>
                                <SelectTrigger className="h-10">
                                  <SelectValue
                                    placeholder="選択してください（任意）"
                                    displayValue={
                                      cancellationAlternative === "other_service" ? "他のサービスに変更" :
                                        cancellationAlternative === "inhouse" ? "自社で構築" :
                                          cancellationAlternative === "temporary" ? "一時的な解約" :
                                            cancellationAlternative === "none" ? "特にない" :
                                              undefined
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="other_service">他のサービスに変更</SelectItem>
                                  <SelectItem value="inhouse">自社で構築</SelectItem>
                                  <SelectItem value="temporary">一時的な解約</SelectItem>
                                  <SelectItem value="none">特にない</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e5e5]">
                              <Button
                                type="submit"
                                className="bg-slate-700 hover:bg-slate-800 text-white"
                              >
                                解約申請を送信
                              </Button>
                            </div>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {othersTab === "terms" && (
                    <Card className="bg-white border-[#e5e7eb]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileTextIcon className="w-5 h-5 text-blue-600" />
                          利用規約
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none space-y-6">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第1条（適用）</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              本規約は、当社が提供する不動産AI Fax「eeFax」（以下「本サービス」）の利用条件を定めるものです。本規約は、本サービスの利用に関して、当社と利用者との間の権利義務関係を定めることを目的とし、利用者は本規約に同意した上で本サービスを利用するものとします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第2条（利用登録）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
                              <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                              <li>本規約に違反したことがある者からの申請である場合</li>
                              <li>その他、当社が利用登録を相当でないと判断した場合</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第3条（ユーザーIDおよびパスワードの管理）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              利用者は、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                              ユーザーIDまたはパスワードが第三者に使用されたことによって生じた損害は、当社に故意または重大な過失がある場合を除き、当社は一切の責任を負いません。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第4条（利用料金および支払方法）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              利用者は、本サービスの利用に対して、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                              利用料金の支払を遅滞した場合、利用者は年14.6%の割合による遅延損害金を当社に支払うものとします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第5条（禁止事項）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
                              <li>法令または公序良俗に違反する行為</li>
                              <li>犯罪行為に関連する行為</li>
                              <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                              <li>当社、ほかの利用者、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                              <li>本サービスによって得られた情報を商業的に利用する行為</li>
                              <li>当社のサービスの運営を妨害するおそれのある行為</li>
                              <li>不正アクセスをし、またはこれを試みる行為</li>
                              <li>その他、当社が不適切と判断する行為</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第6条（本サービスの提供の停止等）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
                              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                              <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第7条（保証の否認および免責）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、本サービスに起因して利用者に生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社と利用者との間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第8条（サービス内容の変更等）</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、利用者に通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによって利用者に生じた損害について一切の責任を負いません。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第9条（利用規約の変更）</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該利用者は変更後の規約に同意したものとみなします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第10条（個人情報の取扱い）</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第11条（通知または連絡）</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              利用者と当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、利用者から、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時に利用者へ到達したものとみなします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第12条（権利義務の譲渡の禁止）</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              利用者は、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">第13条（準拠法・裁判管轄）</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              本規約の解釈にあたっては、日本法を準拠法とします。
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                              本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
                            </p>
                          </div>

                          <div className="pt-4 border-t border-[#e5e7eb]">
                            <p className="text-xs text-slate-500">
                              制定日：2026年1月1日<br />
                              最終改定日：2026年1月6日
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {othersTab === "privacy" && (
                    <Card className="bg-white border-[#e5e7eb]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          プライバシーポリシー
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none space-y-6">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">1. 個人情報の取り扱いについて</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社（以下「当社」といいます。）は、不動産AI Fax「eeFax」（以下「本サービス」といいます。）の提供にあたり、お客様の個人情報を適切に取り扱います。当社は、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）その他の関係法令を遵守し、お客様の個人情報を適切に取り扱います。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">2. 個人情報の定義</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">3. 収集する個人情報</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              当社は、本サービスの提供にあたり、以下の個人情報を収集する場合があります。
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
                              <li>氏名、メールアドレス、電話番号、FAX番号等の連絡先情報</li>
                              <li>会社名、部署名、役職等の企業情報</li>
                              <li>住所、郵便番号等の所在地情報</li>
                              <li>サービス利用状況に関する情報（送受信履歴、利用日時、利用内容等）</li>
                              <li>決済に関する情報（クレジットカード情報、請求情報等）</li>
                              <li>端末情報、IPアドレス、Cookie等の技術的情報</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">4. 個人情報の利用目的</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              当社は、収集した個人情報を以下の目的で利用します。
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
                              <li>本サービスの提供、運営、維持、改善</li>
                              <li>利用料金の請求、決済処理</li>
                              <li>お客様からのお問い合わせへの対応</li>
                              <li>本サービスに関する重要なお知らせの配信</li>
                              <li>利用規約違反や不正利用の防止</li>
                              <li>本サービスの利用状況の分析、統計データの作成</li>
                              <li>新サービス、機能の開発、改善</li>
                              <li>その他、上記利用目的に付随する目的</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">5. 個人情報の第三者提供</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              当社は、以下の場合を除き、お客様の個人情報を第三者に提供することはありません。
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
                              <li>お客様の同意がある場合</li>
                              <li>法令に基づく場合</li>
                              <li>人の生命、身体または財産の保護のために必要がある場合</li>
                              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                              <li>国の機関等への協力が必要な場合</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">6. 個人情報の委託</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、本サービスの提供にあたり、個人情報の取扱いの全部または一部を外部に委託する場合があります。この場合、当社は、個人情報保護法に基づき、委託先に対して必要かつ適切な監督を行います。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">7. 個人情報の安全管理</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のため、必要かつ適切な措置を講じます。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">8. 個人情報の開示、訂正、削除等</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              お客様は、当社に対して、ご自身の個人情報の開示、訂正、削除、利用停止等を求めることができます。これらの請求を行う場合は、当社が別途定める方法により、当社までご連絡ください。
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、お客様からご請求があった場合、個人情報保護法に基づき、速やかに対応いたします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">9. Cookie等の利用</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、本サービスの提供にあたり、Cookie等の技術を利用する場合があります。Cookie等の利用により、お客様の利用状況を分析し、サービス改善に役立てることがあります。お客様は、ブラウザの設定により、Cookieの受け取りを拒否することができますが、その場合、本サービスの一部機能が利用できなくなる場合があります。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">10. プライバシーポリシーの変更</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              当社は、必要に応じて、本プライバシーポリシーの内容を変更することがあります。変更後のプライバシーポリシーは、本ウェブサイトに掲載した時点で効力を生じるものとします。
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">11. お問い合わせ窓口</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              本プライバシーポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。
                            </p>
                          </div>

                          <div className="pt-4 border-t border-[#e5e7eb]">
                            <p className="text-xs text-slate-500">
                              制定日：2026年1月1日<br />
                              最終改定日：2026年1月6日
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
            {screen === "contact" && (
              <ContactScreen onClose={() => setScreen("top")} />
            )}
            {screen === "address-book" && (
              <AddressBookScreen
                onNavigateToSend={(faxNumber, companyName) => {
                  setInitialEditData({
                    fax_number: faxNumber,
                    company_name: companyName,
                  });
                  setScreen("upload");
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
