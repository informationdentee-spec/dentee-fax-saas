"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Building2,
  Settings as SettingsIcon,
  Save,
  Loader2,
  Plus,
  BarChart3,
  Mail,
  Search,
  CreditCard,
  FileText,
  Download,
  Edit,
  Trash2,
  Send,
  Inbox,
  ArrowLeft,
  X
} from "lucide-react";
import { BusinessCardTemplateEditor } from "@/components/business-card-template-editor";

interface SettingsScreenProps {
  activeTab?: "members" | "company" | "templates" | "usage" | "credit" | "business-card" | "system";
  onTabChange?: (tab: "members" | "company" | "templates" | "usage" | "credit" | "business-card" | "system") => void;
  onNavigateToSend?: () => void;
  onNavigateToReceive?: () => void;
  allowedTabs?: ("members" | "company" | "templates" | "usage" | "credit" | "business-card" | "system")[];
  showObiTab?: boolean;
}

export function SettingsScreen({ activeTab: externalActiveTab, onTabChange, onNavigateToSend, onNavigateToReceive, allowedTabs, showObiTab }: SettingsScreenProps = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [internalActiveTab, setInternalActiveTab] = useState<"members" | "company" | "templates" | "usage" | "credit" | "business-card" | "data" | "system">("members");
  
  // 外部からactiveTabが渡されている場合はそれを使用、そうでなければ内部状態を使用
  let activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;
  
  // allowedTabsが指定されている場合、アクセスできないタブにアクセスしようとした場合は最初の許可されたタブにリダイレクト
  useEffect(() => {
    if (allowedTabs && allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] as any);
    }
  }, [allowedTabs, activeTab, setActiveTab]);

  // フォーム状態
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [companyForm, setCompanyForm] = useState({ 
    name: "", 
    address: "", 
    postal_code: "",
    prefecture: "",
    city: "",
    street: "",
    building: "",
    email: "",
    phone: "", 
    license_number: "",
    fax: "",
    holiday: "",
    transaction_type: "媒介"
  });
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);
  const [usageStatements, setUsageStatements] = useState<any[]>([]);
  const [usageQuery, setUsageQuery] = useState({ start_date: "", end_date: "" });
  const [usageCounts, setUsageCounts] = useState({ sent: 0, received: 0 });
  const [obiImage, setObiImage] = useState<string | null>(null);
  const [isGeneratingObi, setIsGeneratingObi] = useState(false);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: "", category: "", content: "", is_default: false });
  const [businessCardTemplate, setBusinessCardTemplate] = useState<string>("");
  const [businessCardImage, setBusinessCardImage] = useState<string>("");
  const [availableBusinessCardTemplates, setAvailableBusinessCardTemplates] = useState<Array<{ id: string; name: string; image: string | null; template: string | null }>>([]);
  const [businessCards, setBusinessCards] = useState<any[]>([]);
  const [editingBusinessCard, setEditingBusinessCard] = useState<any | null>(null);
  const [showBusinessCardEditor, setShowBusinessCardEditor] = useState(false);
  const [businessCardForm, setBusinessCardForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
  });
  const [exportType, setExportType] = useState<string>("sent");
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [obiForm, setObiForm] = useState({
    license_number: "",
    address: "",
    company_name: "",
    phone: "",
    fax: "",
    holiday: "",
    transaction_type: "",
  });

  // データ取得
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        if (data.company) {
          setCompanyForm({
            name: data.company.name || "",
            address: data.company.address || "",
            postal_code: data.company.postal_code || "",
            prefecture: data.company.prefecture || "",
            city: data.company.city || "",
            street: data.company.street || "",
            building: data.company.building || "",
            email: data.company.email || "",
            phone: data.company.phone || "",
            license_number: data.company.license_number || "",
            fax: data.company.fax || "",
            holiday: data.company.holiday || "",
            transaction_type: data.company.transaction_type || "媒介",
          });
        }
        // 利用明細を取得
        if (data.usage_statements) {
          setUsageStatements(data.usage_statements);
        }
        if (data.settings?.obi_image) {
          setObiImage(data.settings.obi_image);
        }
        if (data.settings?.business_card_template) {
          setBusinessCardTemplate(data.settings.business_card_template);
        }
        // 名刺画像も取得（Settingsテーブルに追加する必要がある場合は後で対応）
        // クレジットカード情報を取得
        if (data.credit_cards) {
          setCreditCards(data.credit_cards);
        }
        // テンプレートを取得
        fetch("/api/templates")
          .then((res) => res.json())
          .then((templateData) => {
            if (templateData.templates) {
              setTemplates(templateData.templates);
            } else if (Array.isArray(templateData)) {
              setTemplates(templateData);
            }
          })
          .catch((err) => console.error("Failed to fetch templates:", err));
        
        // 名刺一覧を取得
        fetch("/api/business-cards")
          .then((res) => res.json())
          .then((data) => {
            if (data.businessCards) {
              setBusinessCards(data.businessCards);
            }
          })
          .catch((err) => console.error("Failed to fetch business cards:", err));
        
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  // 担当者追加
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      const addedUser = await res.json();
      setData((prev: any) => ({ ...prev, users: [...prev.users, addedUser] }));
      setNewUser({ name: "", email: "" });
      alert("担当者を追加しました");
    }
  };

  // 会社情報更新
  const handleUpdateCompany = async () => {
    // 会社IDが存在しない場合は、最初の会社を取得または作成
    let companyId = data?.company?.id;
    if (!companyId) {
      // 会社が存在しない場合は作成
      try {
        const createRes = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companyForm),
        });
        if (createRes.ok) {
          const newCompany = await createRes.json();
          companyId = newCompany.id;
          setData((prev: any) => ({ ...prev, company: newCompany }));
        } else {
          alert("会社情報の作成に失敗しました。ページを再読み込みしてください。");
          return;
        }
      } catch (error) {
        console.error("Company creation error:", error);
        alert("会社情報の作成に失敗しました。");
        return;
      }
    }
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyForm),
    });
    if (res.ok) {
        const updatedCompany = await res.json();
        setData((prev: any) => ({ ...prev, company: updatedCompany }));
        setCompanyForm({
          name: updatedCompany.name || "",
          address: updatedCompany.address || "",
          postal_code: updatedCompany.postal_code || "",
          prefecture: updatedCompany.prefecture || "",
          city: updatedCompany.city || "",
          street: updatedCompany.street || "",
          building: updatedCompany.building || "",
          email: updatedCompany.email || "",
          phone: updatedCompany.phone || "",
          license_number: updatedCompany.license_number || "",
          fax: updatedCompany.fax || "",
          holiday: updatedCompany.holiday || "",
          transaction_type: updatedCompany.transaction_type || "媒介",
        });
      alert("会社情報を保存しました");
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        console.error("Company update API error:", errorData);
        alert(`保存に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Company update error:", error);
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p>設定情報を読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* コンテンツエリア */}
      <div className="flex-1 min-w-0 overflow-auto px-8 py-6">
          {/* タブ1: チーム管理 */}
          {activeTab === "members" && (
            <div className="space-y-4">
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb]">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                <Users className="w-5 h-5 text-[#2563eb]" />
                担当者一覧
              </CardTitle>
              <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                このシステムを利用できるメンバーを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-lg border border-[#e5e7eb] overflow-hidden bg-white">
                {(data?.users || []).map((user: any, i: number) => (
                  <div
                    key={user.id}
                    className={`p-6 bg-white hover:bg-slate-50 transition-colors ${
                      i !== (data?.users || []).length - 1 ? "border-b border-[#e5e7eb]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#2563eb] font-semibold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                          <div className="text-sm font-semibold text-slate-900 leading-relaxed">{user.name}</div>
                          <div className="text-sm font-normal text-[#6b7280] leading-relaxed">{user.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 名刺画像の設定 */}
                    <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                      <Label className="text-sm font-normal text-slate-700 mb-2 block leading-relaxed">
                        名刺画像
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          {user.business_card ? (
                            <div className="w-24 h-16 border border-[#e5e7eb] rounded-md overflow-hidden bg-white">
                              <img 
                                src={user.business_card} 
                                alt={`${user.name}の名刺`} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-16 border border-dashed border-[#e5e7eb] rounded-md flex items-center justify-center bg-slate-50 text-xs text-[#6b7280]">
                              未登録
                            </div>
                          )}
                          <div className="flex-1 flex items-center gap-2 flex-wrap">
                            {/* 名刺テンプレートから選択 */}
                            {businessCards.length > 0 && (
                              <Select
                                value=""
                                onValueChange={async (cardId) => {
                                  const selectedCard = businessCards.find(c => c.id === Number(cardId));
                                  if (!selectedCard) return;
                                  
                                  let imageToUse = selectedCard.image;
                                  
                                  // HTMLテンプレートの場合は画像を生成
                                  if (selectedCard.template_html && !selectedCard.image) {
                                    try {
                                      const variables = selectedCard.variables ? JSON.parse(selectedCard.variables) : {};
                                      // 担当者情報を追加
                                      variables.agent_name = user.name;
                                      variables.agent_tel = user.agent_tel || "";
                                      variables.agent_email = user.agent_email || user.email;
                                      
                                      const generateRes = await fetch("/api/business-card/generate", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          template: selectedCard.template_html,
                                          variables: variables,
                                        }),
                                      });
                                      
                                      if (generateRes.ok) {
                                        const generateData = await generateRes.json();
                                        imageToUse = generateData.image;
                                      }
                                    } catch (error) {
                                      console.error("Failed to generate business card from template:", error);
                                      alert("テンプレートからの画像生成に失敗しました");
                                      return;
                                    }
                                  }
                                  
                                  if (imageToUse) {
                                    try {
                                      const res = await fetch(`/api/users/${user.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          name: user.name,
                                          email: user.email,
                                          business_card: imageToUse
                                        }),
                                      });
                                      
                                      if (res.ok) {
                                        const updatedUser = await res.json();
                                        setData((prev: any) => ({
                                          ...prev,
                                          users: prev.users.map((u: any) => 
                                            u.id === user.id ? updatedUser : u
                                          )
                                        }));
                                        alert("名刺を設定しました");
                                      } else {
                                        alert("名刺画像の設定に失敗しました");
                                      }
                                    } catch (error) {
                                      console.error("Business card set error:", error);
                                      alert("エラーが発生しました");
                                    }
                                  } else {
                                    alert("名刺画像がありません");
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 w-[200px] bg-white border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                                  <SelectValue placeholder="保存済み名刺から選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {businessCards.map((card) => (
                                    <SelectItem key={card.id} value={String(card.id)}>
                                      {card.name} {card.position && `(${card.position})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {/* ファイルアップロード */}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`business-card-${user.id}`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                // 画像をBase64に変換
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  const base64Image = event.target?.result as string;
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        name: user.name,
                                        email: user.email,
                                        role: user.role,
                                        business_card: base64Image
                                      }),
                                    });
                                    
                                    if (res.ok) {
                                      const updatedUser = await res.json();
                                      setData((prev: any) => ({
                                        ...prev,
                                        users: prev.users.map((u: any) => 
                                          u.id === user.id ? updatedUser : u
                                        )
                                      }));
                                      alert("名刺画像を保存しました");
                                    } else {
                                      alert("名刺画像の保存に失敗しました");
                                    }
                                  } catch (error) {
                                    console.error("Business card upload error:", error);
                                    alert("エラーが発生しました");
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            <label
                              htmlFor={`business-card-${user.id}`}
                              className="inline-block cursor-pointer"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.getElementById(`business-card-${user.id}`) as HTMLInputElement;
                                  if (input) {
                                    input.click();
                                  }
                                }}
                                className="h-9 px-4 text-sm rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-normal"
                              >
                                {user.business_card ? "変更" : "アップロード"}
                              </Button>
                            </label>
                            {user.business_card && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={async () => {
                                  if (!confirm("名刺画像を削除しますか？")) return;
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        name: user.name,
                                        email: user.email,
                                        business_card: null
                                      }),
                                    });
                                    
                                    if (res.ok) {
                                      const updatedUser = await res.json();
                                      setData((prev: any) => ({
                                        ...prev,
                                        users: prev.users.map((u: any) => 
                                          u.id === user.id ? updatedUser : u
                                        )
                                      }));
                                      alert("名刺画像を削除しました");
                                    } else {
                                      alert("名刺画像の削除に失敗しました");
                                    }
                                  } catch (error) {
                                    console.error("Business card delete error:", error);
                                    alert("エラーが発生しました");
                                  }
                                }}
                                className="h-9 px-4 text-sm rounded-md text-[#dc2626] hover:bg-red-50 font-normal"
                              >
                                削除
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50 rounded-lg border border-[#e5e7eb] mt-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2 leading-relaxed">
                  <Plus className="w-4 h-4" /> 新しいメンバーを招待
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Input
                      placeholder="氏名 (例: 佐藤 花子)"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="flex-1 bg-white border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200 h-9 text-sm"
                    />
                    <Input
                      placeholder="メールアドレス"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="flex-1 bg-white border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200 h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleAddUser}
                    className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-blue-700 text-white font-normal"
                  >
                    追加する
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* タブ2: 会社情報 */}
          {activeTab === "company" && (
            <div>
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb]">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                <Building2 className="w-5 h-5 text-[#2563eb]" />
                自社情報設定
              </CardTitle>
              <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                FAX送信時のヘッダーや帯に表示される情報です
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">会社名</Label>
                  <Input
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">代表電話番号</Label>
                  <Input
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">会社宛メールアドレス</Label>
                  <Input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: info@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">不動産免許番号</Label>
                  <Input
                    value={companyForm.license_number}
                    onChange={(e) => setCompanyForm({ ...companyForm, license_number: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 東京都知事 (1) 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">郵便番号</Label>
                  <div className="flex gap-2">
                    <Input
                      value={companyForm.postal_code}
                      onChange={(e) => setCompanyForm({ ...companyForm, postal_code: e.target.value })}
                      className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                      placeholder="例: 100-0001"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!companyForm.postal_code) {
                          alert("郵便番号を入力してください");
                          return;
                        }
                        setIsSearchingPostalCode(true);
                        try {
                          const res = await fetch(`/api/postal-code?postal_code=${companyForm.postal_code}`);
                          if (res.ok) {
                            const data = await res.json();
                            setCompanyForm({
                              ...companyForm,
                              prefecture: data.prefecture || "",
                              city: data.city || "",
                              street: data.street || "",
                            });
                          } else {
                            const errorData = await res.json().catch(() => ({}));
                            alert(`郵便番号検索に失敗しました: ${errorData.error || '不明なエラー'}`);
                          }
                        } catch (error) {
                          console.error("Postal code search error:", error);
                          alert("郵便番号検索に失敗しました");
                        } finally {
                          setIsSearchingPostalCode(false);
                        }
                      }}
                      disabled={isSearchingPostalCode}
                      className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal disabled:opacity-50"
                    >
                      {isSearchingPostalCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-1" />
                          検索
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">都道府県名</Label>
                  <Input
                    value={companyForm.prefecture}
                    onChange={(e) => setCompanyForm({ ...companyForm, prefecture: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 東京都"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">市区町村</Label>
                  <Input
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 千代田区千代田"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">番地</Label>
                  <Input
                    value={companyForm.street}
                    onChange={(e) => setCompanyForm({ ...companyForm, street: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 1-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">ビル・マンション名</Label>
                  <Input
                    value={companyForm.building}
                    onChange={(e) => setCompanyForm({ ...companyForm, building: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: サンプルビル 3F"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">住所（自動生成）</Label>
                  <Input
                    value={`${companyForm.postal_code ? `〒${companyForm.postal_code} ` : ""}${companyForm.prefecture || ""}${companyForm.city || ""}${companyForm.street || ""}${companyForm.building || ""}`}
                    readOnly
                    className="h-9 text-sm border-[#e5e7eb] bg-slate-50 text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">FAX番号</Label>
                  <Input
                    value={companyForm.fax}
                    onChange={(e) => setCompanyForm({ ...companyForm, fax: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 03-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">定休日</Label>
                  <Input
                    value={companyForm.holiday}
                    onChange={(e) => setCompanyForm({ ...companyForm, holiday: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 水曜日"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">取引様態</Label>
                  <Input
                    value={companyForm.transaction_type}
                    onChange={(e) => setCompanyForm({ ...companyForm, transaction_type: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="例: 媒介"
                  />
                </div>
              </div>
              
              
              <div className="flex justify-end pt-4 border-t border-[#e5e7eb]">
                <Button
                  onClick={handleUpdateCompany}
                  className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-blue-700 text-white font-normal gap-2 w-full md:w-auto"
                >
                  <Save className="w-4 h-4" />
                  変更を保存
                </Button>
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* タブ3: テンプレート管理 */}
          {activeTab === "templates" && (
            <div className="space-y-4">
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                    <FileText className="w-5 h-5 text-[#2563eb]" />
                    FAX送信テンプレート
                  </CardTitle>
                  <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed mt-1">
                    よく使うFAX文面をテンプレートとして保存できます
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingTemplate(null);
                        setTemplateForm({ name: "", category: "", content: "", is_default: false });
                      }}
                      className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      新規作成
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-slate-900 leading-relaxed">
                        {editingTemplate ? "テンプレートを編集" : "新しいテンプレートを作成"}
                      </DialogTitle>
                      <DialogDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                        テンプレート名、カテゴリ、本文を入力してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700 leading-relaxed">テンプレート名</Label>
                        <Input
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 内見申請"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700 leading-relaxed">カテゴリ</Label>
                        <Select
                          value={templateForm.category}
                          onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                        >
                          <SelectTrigger className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200">
                            <SelectValue placeholder="カテゴリを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="内見申請">内見申請</SelectItem>
                            <SelectItem value="申込書送付">申込書送付</SelectItem>
                            <SelectItem value="不足書類送付">不足書類送付</SelectItem>
                            <SelectItem value="案内報告">案内報告</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700 leading-relaxed">本文</Label>
                        <Textarea
                          value={templateForm.content}
                          onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                          className="min-h-[200px] text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="テンプレート本文を入力してください"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is-default"
                          checked={templateForm.is_default}
                          onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_default: checked === true })}
                        />
                        <Label htmlFor="is-default" className="text-sm font-normal text-slate-700 leading-relaxed cursor-pointer">
                          デフォルトテンプレートにする
                        </Label>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(null);
                            setTemplateForm({ name: "", category: "", content: "", is_default: false });
                          }}
                          className="h-9 px-4 text-sm rounded-md border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] font-normal"
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!templateForm.name || !templateForm.category || !templateForm.content) {
                              alert("テンプレート名、カテゴリ、本文は必須です");
                              return;
                            }
                            try {
                              const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates";
                              const method = editingTemplate ? "PUT" : "POST";
                              const res = await fetch(url, {
                                method,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(templateForm),
                              });
                              if (res.ok) {
                                const updatedTemplates = await fetch("/api/templates").then((r) => r.json());
                                setTemplates(updatedTemplates.templates || updatedTemplates || []);
                                setEditingTemplate(null);
                                setTemplateForm({ name: "", category: "", content: "", is_default: false });
                                alert(editingTemplate ? "テンプレートを更新しました" : "テンプレートを作成しました");
                                // ダイアログを閉じるために、トリガーを再クリックする必要がある
                                const trigger = document.querySelector('[data-state="open"]');
                                if (trigger) {
                                  (trigger as HTMLElement).click();
                                }
                              } else {
                                alert("保存に失敗しました");
                              }
                            } catch (error) {
                              console.error("Template save error:", error);
                              alert("エラーが発生しました");
                            }
                          }}
                          className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal"
                        >
                          {editingTemplate ? "更新" : "作成"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 bg-slate-50 rounded-lg border border-[#e5e7eb] hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-normal text-[#6b7280] bg-white px-2 py-1 rounded border border-[#e5e7eb]">
                              {template.category}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 leading-relaxed">{template.name}</span>
                            {template.is_default && (
                              <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                デフォルト
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-normal text-[#6b7280] leading-relaxed line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setTemplateForm({
                                name: template.name,
                                category: template.category,
                                content: template.content,
                                is_default: template.is_default,
                              });
                            }}
                            className="h-8 px-3 text-xs rounded-md text-[#2563eb] hover:bg-blue-50 font-normal"
                          >
                            編集
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm("このテンプレートを削除しますか？")) return;
                              try {
                                const res = await fetch(`/api/templates/${template.id}`, {
                                  method: "DELETE",
                                });
                                if (res.ok) {
                                  const updatedTemplates = await fetch("/api/templates").then((r) => r.json());
                                  setTemplates(updatedTemplates.templates || updatedTemplates || []);
                                  alert("テンプレートを削除しました");
                                } else {
                                  alert("削除に失敗しました");
                                }
                              } catch (error) {
                                console.error("Template delete error:", error);
                                alert("エラーが発生しました");
                              }
                            }}
                            className="h-8 px-3 text-xs rounded-md text-[#dc2626] hover:bg-red-50 font-normal"
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-normal text-[#6b7280] leading-relaxed text-center py-8">
                    テンプレートが登録されていません。「新規作成」ボタンからテンプレートを作成してください。
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* タブ4: 利用明細 */}
          {activeTab === "usage" && (
            <div className="space-y-4">
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb]">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                <FileText className="w-5 h-5 text-[#2563eb]" />
                利用枚数照会
              </CardTitle>
              <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                対象日付で送信枚数・受信枚数を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-normal text-slate-600 leading-relaxed">
                ※ 利用枚数は累計で表示されます。
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">開始日</Label>
                  <Input
                    type="date"
                    value={usageQuery.start_date}
                    onChange={(e) => setUsageQuery({ ...usageQuery, start_date: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">終了日</Label>
                  <Input
                    type="date"
                    value={usageQuery.end_date}
                    onChange={(e) => setUsageQuery({ ...usageQuery, end_date: e.target.value })}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!usageQuery.start_date || !usageQuery.end_date) {
                    alert("開始日と終了日を選択してください");
                    return;
                  }
                  try {
                    const res = await fetch(`/api/usage/query?start_date=${usageQuery.start_date}&end_date=${usageQuery.end_date}`);
                    if (res.ok) {
                      const data = await res.json();
                      setUsageCounts({ sent: data.sent_count || 0, received: data.received_count || 0 });
                    } else {
                      alert("利用枚数の取得に失敗しました");
                    }
                  } catch (error) {
                    console.error("Usage query error:", error);
                    alert("エラーが発生しました");
                  }
                }}
                className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal"
              >
                照会する
              </Button>
              {(usageCounts.sent > 0 || usageCounts.received > 0) && (
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#e5e7eb]">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-normal text-[#6b7280] leading-relaxed mb-1">送信枚数</p>
                    <p className="text-2xl font-semibold text-slate-900 leading-relaxed">{usageCounts.sent.toLocaleString()}枚</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-normal text-[#6b7280] leading-relaxed mb-1">受信枚数</p>
                    <p className="text-2xl font-semibold text-slate-900 leading-relaxed">{usageCounts.received.toLocaleString()}枚</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb]">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                <BarChart3 className="w-5 h-5 text-[#2563eb]" />
                利用明細
              </CardTitle>
              <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                過去の利用明細を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                      <TableHead className="text-sm font-semibold text-slate-900 leading-relaxed">利用年月</TableHead>
                      <TableHead className="text-right text-sm font-semibold text-slate-900 leading-relaxed">送信枚数</TableHead>
                      <TableHead className="text-right text-sm font-semibold text-slate-900 leading-relaxed">受信枚数</TableHead>
                      <TableHead className="text-right text-sm font-semibold text-slate-900 leading-relaxed">基本料金</TableHead>
                      <TableHead className="text-right text-sm font-semibold text-slate-900 leading-relaxed">利用料</TableHead>
                      <TableHead className="text-right text-sm font-semibold text-slate-900 leading-relaxed">税額</TableHead>
                      <TableHead className="text-right text-sm font-semibold text-slate-900 leading-relaxed">請求金額</TableHead>
                      <TableHead className="text-center text-sm font-semibold text-slate-900 leading-relaxed">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageStatements.length > 0 ? (
                      usageStatements.map((statement: any) => (
                        <TableRow key={statement.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-normal text-slate-900 leading-relaxed">{statement.usage_month}</TableCell>
                          <TableCell className="text-right text-sm font-normal text-slate-900 leading-relaxed">{statement.sent_count.toLocaleString()}枚</TableCell>
                          <TableCell className="text-right text-sm font-normal text-slate-900 leading-relaxed">{statement.received_count.toLocaleString()}枚</TableCell>
                          <TableCell className="text-right text-sm font-normal text-slate-900 leading-relaxed">¥{statement.base_fee.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm font-normal text-slate-900 leading-relaxed">¥{statement.usage_fee.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm font-normal text-slate-900 leading-relaxed">¥{statement.tax_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-slate-900 leading-relaxed">¥{statement.total_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {statement.receipt_pdf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(statement.receipt_pdf, '_blank')}
                                  className="h-8 px-3 text-xs rounded-md text-[#2563eb] hover:bg-blue-50 font-normal"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  領収書
                                </Button>
                              )}
                              {statement.payment_pdf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(statement.payment_pdf, '_blank')}
                                  className="h-8 px-3 text-xs rounded-md text-[#2563eb] hover:bg-blue-50 font-normal"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  支払明細
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="p-6 text-center text-sm font-normal text-[#6b7280] leading-relaxed">
                          利用明細がありません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* タブ5: クレジットカード（Stripe関連UIは非表示、将来のためコードは残す） */}
          {false && activeTab === "credit" && (
            <div>
          <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
            <CardHeader className="border-b border-[#e5e7eb]">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                <CreditCard className="w-5 h-5 text-[#2563eb]" />
                クレジットカード登録
              </CardTitle>
              <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                お支払いに使用するクレジットカードを登録できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-normal text-blue-800 leading-relaxed">
                  クレジットカード情報は安全に暗号化されて保存されます。
                </p>
              </div>
              {creditCards.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">登録済みカード</h4>
                  {creditCards.map((card: any) => (
                    <div key={card.id} className="p-4 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            {card.card_brand || "クレジットカード"} •••• {card.card_number_last4 || "****"}
                          </p>
                          <p className="text-xs font-normal text-[#6b7280] leading-relaxed mt-1">
                            有効期限: {card.expiry_month || "**"}/{card.expiry_year || "****"}
                          </p>
                          {card.is_default && (
                            <span className="inline-block mt-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200">
                              デフォルト
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-4 pt-4 border-t border-[#e5e7eb]">
                <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">新しいカードを登録</h4>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">カード番号</Label>
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-slate-700 leading-relaxed">有効期限（月）</Label>
                    <Input
                      type="text"
                      placeholder="MM"
                      maxLength={2}
                      className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-slate-700 leading-relaxed">有効期限（年）</Label>
                    <Input
                      type="text"
                      placeholder="YYYY"
                      maxLength={4}
                      className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">カード名義人</Label>
                  <Input
                    type="text"
                    placeholder="TARO YAMADA"
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 leading-relaxed">セキュリティコード</Label>
                  <Input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <Button
                  className="w-full h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal"
                >
                  クレジットカードを登録
                </Button>
              </div>
            </CardContent>
          </Card>
            </div>
          )}

          {/* タブ6: 名刺テンプレート */}
          {activeTab === "business-card" && (
            <div className="space-y-4">
              <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                <CardHeader className="border-b border-[#e5e7eb]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                        <FileText className="w-5 h-5 text-[#2563eb]" />
                        名刺一覧
                      </CardTitle>
                      <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed mt-1">
                        名刺を作成・管理し、担当者に割り当てることができます
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingBusinessCard(null);
                        setBusinessCardForm({
                          name: "",
                          email: "",
                          phone: "",
                          position: "",
                          department: "",
                        });
                        setShowBusinessCardEditor(true);
                      }}
                      className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      名刺を新規作成
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {businessCards.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">名刺が登録されていません</p>
                      <p className="text-xs mt-2">「名刺を新規作成」ボタンから名刺を作成してください</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {businessCards.map((card) => (
                        <Card key={card.id} className="border-[#e5e7eb] hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-900">{card.name}</h4>
                                {card.position && (
                                  <p className="text-xs text-slate-600 mt-1">{card.position}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingBusinessCard(card);
                                    setBusinessCardForm({
                                      name: card.name || "",
                                      email: card.email || "",
                                      phone: card.phone || "",
                                      position: card.position || "",
                                      department: card.department || "",
                                    });
                                    setShowBusinessCardEditor(true);
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm(`「${card.name}」の名刺を削除しますか？`)) return;
                                    try {
                                      const res = await fetch(`/api/business-cards/${card.id}`, {
                                        method: "DELETE",
                                      });
                                      if (res.ok) {
                                        setBusinessCards(businessCards.filter(c => c.id !== card.id));
                                        alert("名刺を削除しました");
                                      } else {
                                        alert("名刺の削除に失敗しました");
                                      }
                                    } catch (error) {
                                      console.error("Failed to delete business card:", error);
                                      alert("エラーが発生しました");
                                    }
                                  }}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {card.image ? (
                              <div className="w-full h-32 border border-[#e5e7eb] rounded-md overflow-hidden bg-white flex items-center justify-center">
                                <img 
                                  src={card.image} 
                                  alt={card.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-32 border border-dashed border-[#e5e7eb] rounded-md flex items-center justify-center bg-slate-50 text-xs text-[#6b7280]">
                                画像なし
                              </div>
                            )}
                            {card.phone && (
                              <p className="text-xs text-slate-600 mt-2">TEL: {card.phone}</p>
                            )}
                            {card.email && (
                              <p className="text-xs text-slate-600">Email: {card.email}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 名刺エディタ */}
              {showBusinessCardEditor && (
                <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                  <CardHeader className="border-b border-[#e5e7eb]">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        {editingBusinessCard ? "名刺を編集" : "名刺を新規作成"}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowBusinessCardEditor(false);
                          setEditingBusinessCard(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* 名刺基本情報入力フォーム */}
                    <div className="mb-6 space-y-4 border-b border-[#e5e7eb] pb-6">
                      <h4 className="text-sm font-semibold text-slate-900">基本情報</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-normal text-slate-700">
                            担当者名 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={businessCardForm.name}
                            onChange={(e) => setBusinessCardForm({ ...businessCardForm, name: e.target.value })}
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            placeholder="例: 山田 太郎"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-normal text-slate-700">役職</Label>
                          <Input
                            value={businessCardForm.position}
                            onChange={(e) => setBusinessCardForm({ ...businessCardForm, position: e.target.value })}
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            placeholder="例: 営業部長"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-normal text-slate-700">メールアドレス</Label>
                          <Input
                            type="email"
                            value={businessCardForm.email}
                            onChange={(e) => setBusinessCardForm({ ...businessCardForm, email: e.target.value })}
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            placeholder="例: yamada@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-normal text-slate-700">電話番号</Label>
                          <Input
                            value={businessCardForm.phone}
                            onChange={(e) => setBusinessCardForm({ ...businessCardForm, phone: e.target.value })}
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            placeholder="例: 03-1234-5678"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label className="text-sm font-normal text-slate-700">部署</Label>
                          <Input
                            value={businessCardForm.department}
                            onChange={(e) => setBusinessCardForm({ ...businessCardForm, department: e.target.value })}
                            className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                            placeholder="例: 営業部"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <BusinessCardTemplateEditor
                      initialTemplate={editingBusinessCard?.template_html || businessCardTemplate}
                      initialImage={editingBusinessCard?.image || businessCardImage}
                      companyData={data?.company}
                      onSave={async (template, image) => {
                        try {
                          if (!businessCardForm.name.trim()) {
                            alert("担当者名を入力してください");
                            return;
                          }
                          
                          const cardData = {
                            name: businessCardForm.name.trim(),
                            email: businessCardForm.email.trim() || null,
                            phone: businessCardForm.phone.trim() || null,
                            position: businessCardForm.position.trim() || null,
                            department: businessCardForm.department.trim() || null,
                            image: image || null,
                            template_html: template || null,
                            variables: {
                              company_name: data?.company?.name || "",
                              company_address: data?.company?.address || "",
                              company_tel: data?.company?.phone || "",
                              company_fax: data?.company?.fax || "",
                              agent_name: businessCardForm.name.trim(),
                              agent_tel: businessCardForm.phone.trim() || "",
                              agent_email: businessCardForm.email.trim() || "",
                            },
                          };

                          if (editingBusinessCard) {
                            // 更新
                            const res = await fetch(`/api/business-cards/${editingBusinessCard.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(cardData),
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              setBusinessCards(businessCards.map(c => c.id === updated.id ? updated : c));
                              alert("名刺を更新しました");
                              setShowBusinessCardEditor(false);
                              setEditingBusinessCard(null);
                              setBusinessCardForm({
                                name: "",
                                email: "",
                                phone: "",
                                position: "",
                                department: "",
                              });
                            } else {
                              const errorData = await res.json().catch(() => ({}));
                              console.error("Business card update error:", errorData);
                              throw new Error(errorData.error || "Failed to update business card");
                            }
                          } else {
                            // 新規作成
                            const res = await fetch("/api/business-cards", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(cardData),
                            });
                            if (res.ok) {
                              const created = await res.json();
                              setBusinessCards([...businessCards, created]);
                              alert("名刺を作成しました");
                              setShowBusinessCardEditor(false);
                            } else {
                              const errorData = await res.json().catch(() => ({}));
                              console.error("Business card creation error:", errorData);
                              throw new Error(errorData.error || "Failed to create business card");
                            }
                          }
                        } catch (error) {
                          console.error("Failed to save business card:", error);
                          alert("名刺の保存に失敗しました");
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}


          {/* タブ: 帯画像の生成（機能設定から） */}
          {activeTab === "system" && showObiTab && (
            <div className="space-y-4">
              <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                <CardHeader className="border-b border-[#e5e7eb]">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                    <FileText className="w-5 h-5 text-[#2563eb]" />
                    帯画像の生成
                  </CardTitle>
                  <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                    FAX送信時のヘッダーや帯に表示される情報です
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* 会社情報入力フォーム */}
                  <div className="space-y-4 border-b border-[#e5e7eb] pb-6">
                    <h3 className="text-sm font-semibold text-slate-900">会社情報</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">
                          会社名 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={obiForm.company_name}
                          onChange={(e) => setObiForm({ ...obiForm, company_name: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 株式会社サンプル不動産"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">
                          免許番号 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={obiForm.license_number}
                          onChange={(e) => setObiForm({ ...obiForm, license_number: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 東京都知事 (1) 第12345号"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-normal text-slate-700">住所</Label>
                        <Input
                          value={obiForm.address}
                          onChange={(e) => setObiForm({ ...obiForm, address: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 東京都渋谷区..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">電話番号</Label>
                        <Input
                          value={obiForm.phone}
                          onChange={(e) => setObiForm({ ...obiForm, phone: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 03-1234-5678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">FAX番号</Label>
                        <Input
                          value={obiForm.fax}
                          onChange={(e) => setObiForm({ ...obiForm, fax: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 03-1234-5679"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">定休日</Label>
                        <Input
                          value={obiForm.holiday}
                          onChange={(e) => setObiForm({ ...obiForm, holiday: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 水曜日"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-slate-700">取引様態</Label>
                        <Input
                          value={obiForm.transaction_type}
                          onChange={(e) => setObiForm({ ...obiForm, transaction_type: e.target.value })}
                          className="h-9 text-sm border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                          placeholder="例: 媒介"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 帯画像プレビューと生成 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-slate-700 leading-relaxed mb-2 block">
                      帯画像（帯替え印刷用）1,002px（横） × 140px（縦）
                    </Label>
                    <div className="flex items-start gap-4">
                      {obiImage ? (
                        <div className="w-[557px] h-[85px] border border-[#e5e7eb] rounded-md overflow-hidden bg-white flex items-center justify-center" style={{ aspectRatio: '1115/170' }}>
                          <img 
                            src={obiImage} 
                            alt="帯画像" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-[557px] h-[85px] border border-dashed border-[#e5e7eb] rounded-md flex items-center justify-center bg-slate-50 text-xs text-[#6b7280]" style={{ aspectRatio: '1115/170' }}>
                          未生成
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!obiForm.company_name || !obiForm.license_number) {
                              alert("会社名と免許番号は必須です");
                              return;
                            }
                            
                            setIsGeneratingObi(true);
                            try {
                              const res = await fetch("/api/obi/generate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  license_number: obiForm.license_number,
                                  address: obiForm.address,
                                  company_name: obiForm.company_name,
                                  phone: obiForm.phone,
                                  fax: obiForm.fax,
                                  holiday: obiForm.holiday,
                                  transaction_type: obiForm.transaction_type,
                                }),
                              });
                              
                              if (res.ok) {
                                const data = await res.json();
                                setObiImage(data.obi_image);
                                // 生成された帯画像をSettingsに保存
                                await fetch("/api/settings/obi", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ obi_image: data.obi_image }),
                                });
                                alert("帯画像を生成しました");
                              } else {
                                const errorData = await res.json().catch(() => ({}));
                                alert(`帯画像の生成に失敗しました: ${errorData.error || '不明なエラー'}`);
                              }
                            } catch (error) {
                              console.error("Obi image generation error:", error);
                              alert("帯画像の生成に失敗しました");
                            } finally {
                              setIsGeneratingObi(false);
                            }
                          }}
                          disabled={isGeneratingObi || !obiForm.company_name || !obiForm.license_number}
                          className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal disabled:opacity-50"
                        >
                          {isGeneratingObi ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                              生成中...
                            </>
                          ) : (
                            "帯画像を生成"
                          )}
                        </Button>
                        {obiImage && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/settings/obi", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ obi_image: null }),
                                });
                                
                                if (res.ok) {
                                  setObiImage(null);
                                  alert("帯画像を削除しました");
                                } else {
                                  alert("帯画像の削除に失敗しました");
                                }
                              } catch (error) {
                                console.error("Obi image delete error:", error);
                                alert("帯画像の削除に失敗しました");
                              }
                            }}
                            className="h-9 px-4 text-sm rounded-md border-[#e5e7eb] text-[#dc2626] hover:bg-red-50 font-normal"
                          >
                            帯画像を削除
                          </Button>
                        )}
                        <p className="text-xs text-[#6b7280] leading-relaxed">
                          レイアウト: 左上に免許番号、右上に住所、その下に会社名、電話番号、FAX番号、定休日、取引様態を表示します。
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* タブ: 通知メール設定 */}
          {activeTab === "system" && !showObiTab && (
            <div className="space-y-4">
              <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
                <CardHeader className="border-b border-[#e5e7eb]">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 leading-relaxed">
                    <Mail className="w-5 h-5 text-[#2563eb]" />
                    通知メール設定
                  </CardTitle>
                  <CardDescription className="text-sm font-normal text-[#6b7280] leading-relaxed">
                    FAX送受信時の通知メール設定を管理できます
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                      <div className="flex-1">
                        <Label className="text-sm font-semibold text-slate-900 leading-relaxed">送信完了通知</Label>
                        <p className="text-xs text-[#6b7280] mt-1">FAX送信が完了したときに通知メールを送信します</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="notify-sent"
                          checked={data?.system?.notify_sent !== false}
                          onChange={async (e) => {
                            try {
                              const res = await fetch("/api/settings", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  notify_sent: e.target.checked
                                }),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setData((prev: any) => ({
                                  ...prev,
                                  system: { ...prev?.system, notify_sent: updated.notify_sent }
                                }));
                              }
                            } catch (error) {
                              console.error("Failed to update notification setting:", error);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                      <div className="flex-1">
                        <Label className="text-sm font-semibold text-slate-900 leading-relaxed">受信通知</Label>
                        <p className="text-xs text-[#6b7280] mt-1">FAXを受信したときに通知メールを送信します</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="notify-received"
                          checked={data?.system?.notify_received !== false}
                          onChange={async (e) => {
                            try {
                              const res = await fetch("/api/settings", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  notify_received: e.target.checked
                                }),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setData((prev: any) => ({
                                  ...prev,
                                  system: { ...prev?.system, notify_received: updated.notify_received }
                                }));
                              }
                            } catch (error) {
                              console.error("Failed to update notification setting:", error);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-[#e5e7eb]">
                      <div className="flex-1">
                        <Label className="text-sm font-semibold text-slate-900 leading-relaxed">エラー通知</Label>
                        <p className="text-xs text-[#6b7280] mt-1">FAX送信エラーが発生したときに通知メールを送信します</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="notify-error"
                          checked={data?.system?.notify_error !== false}
                          onChange={async (e) => {
                            try {
                              const res = await fetch("/api/settings", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  notify_error: e.target.checked
                                }),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setData((prev: any) => ({
                                  ...prev,
                                  system: { ...prev?.system, notify_error: updated.notify_error }
                                }));
                              }
                            } catch (error) {
                              console.error("Failed to update notification setting:", error);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      </div>
    </div>
  );
}