"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, Code, Loader2, Upload, Image as ImageIcon, Palette, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BusinessCardTemplateEditorProps {
  initialTemplate?: string;
  initialImage?: string; // Base64画像データ
  companyData?: {
    name?: string;
    address?: string;
    phone?: string;
    fax?: string;
    logo_url?: string;
  };
  onSave?: (template: string, image?: string) => void;
}

// 洗練された名刺テンプレート集
const TEMPLATES = {
  modern: {
    name: "モダン",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 600px; height: 350px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
      color: #1a1a1a;
      padding: 25px;
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #2563eb;
    }
    .company-info {
      flex: 1;
    }
    .company-logo {
      max-width: 180px;
      max-height: 70px;
      margin-bottom: 8px;
      object-fit: contain;
    }
    .company-name {
      font-size: 22px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }
    .agent-info {
      flex: 1;
      text-align: right;
    }
    .agent-name {
      font-size: 26px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .agent-details {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.8;
    }
    .footer {
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      {{#if company_logo_url}}
      <img src="{{company_logo_url}}" alt="{{company_name}}" class="company-logo" />
      {{else}}
      <div class="company-name">{{company_name}}</div>
      {{/if}}
    </div>
    <div class="agent-info">
      <div class="agent-name">{{agent_name}}</div>
      <div class="agent-details">
        <div>TEL: {{agent_tel}}</div>
        <div>Email: {{agent_email}}</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div>住所: {{company_address}}</div>
    <div>TEL: {{company_tel}} | FAX: {{company_fax}}</div>
  </div>
</body>
</html>`
  },
  classic: {
    name: "クラシック",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 600px; height: 350px;
      background: #ffffff;
      font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif;
      color: #1a1a1a;
      padding: 30px;
      display: flex;
      flex-direction: column;
      border: 2px solid #1a1a1a;
    }
    .container {
      display: flex;
      flex: 1;
      gap: 40px;
      align-items: center;
    }
    .company-section {
      flex: 1;
      border-right: 1px solid #d1d5db;
      padding-right: 30px;
    }
    .company-logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 15px;
      object-fit: contain;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .agent-section {
      flex: 1;
    }
    .agent-name {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 15px;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 8px;
    }
    .agent-info {
      font-size: 14px;
      color: #4b5563;
      line-height: 2;
    }
    .footer {
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid #d1d5db;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="company-section">
      {{#if company_logo_url}}
      <img src="{{company_logo_url}}" alt="{{company_name}}" class="company-logo" />
      {{else}}
      <div class="company-name">{{company_name}}</div>
      {{/if}}
    </div>
    <div class="agent-section">
      <div class="agent-name">{{agent_name}}</div>
      <div class="agent-info">
        <div>TEL: {{agent_tel}}</div>
        <div>Email: {{agent_email}}</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div>住所: {{company_address}}</div>
    <div>TEL: {{company_tel}} | FAX: {{company_fax}}</div>
  </div>
</body>
</html>`
  },
  elegant: {
    name: "エレガント",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 600px; height: 350px;
      background: #ffffff;
      font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
      color: #1a1a1a;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
    }
    .content {
      display: flex;
      flex: 1;
      gap: 30px;
      margin-left: 15px;
    }
    .company-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .company-logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 15px;
      object-fit: contain;
    }
    .company-name {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .agent-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .agent-name {
      font-size: 30px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 18px;
      letter-spacing: 0.5px;
    }
    .agent-info {
      font-size: 13px;
      color: #4b5563;
      line-height: 2;
    }
    .footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
      margin-left: 15px;
    }
  </style>
</head>
<body>
  <div class="content">
    <div class="company-section">
      {{#if company_logo_url}}
      <img src="{{company_logo_url}}" alt="{{company_name}}" class="company-logo" />
      {{else}}
      <div class="company-name">{{company_name}}</div>
      {{/if}}
    </div>
    <div class="agent-section">
      <div class="agent-name">{{agent_name}}</div>
      <div class="agent-info">
        <div>TEL: {{agent_tel}}</div>
        <div>Email: {{agent_email}}</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div>住所: {{company_address}}</div>
    <div>TEL: {{company_tel}} | FAX: {{company_fax}}</div>
  </div>
</body>
</html>`
  }
};

export function BusinessCardTemplateEditor({ initialTemplate, initialImage, companyData, onSave }: BusinessCardTemplateEditorProps) {
  const [mode, setMode] = useState<"image" | "template" | "custom">(initialImage ? "image" : "template");
  const [template, setTemplate] = useState(initialTemplate || TEMPLATES.modern.html);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>("modern");
  const [uploadedImage, setUploadedImage] = useState<string>(initialImage || "");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"setup" | "preview">("setup");

  // プレビュー用の変数値
  const [previewVars, setPreviewVars] = useState({
    company_name: companyData?.name || "株式会社サンプル不動産",
    company_address: companyData?.address || "東京都渋谷区サンプル1-2-3",
    company_tel: companyData?.phone || "03-1234-5678",
    company_fax: companyData?.fax || "03-1234-5679",
    company_logo_url: companyData?.logo_url || "",
    agent_name: "山田 太郎",
    agent_tel: "090-1234-5678",
    agent_email: "yamada@example.com"
  });

  // テンプレートを変数で置換
  const replaceVariables = (html: string, vars: typeof previewVars) => {
    let result = html;
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value || "");
    });
    // Handlebars風の条件分岐を処理（簡易版）
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      return vars[varName as keyof typeof vars] ? content : "";
    });
    return result;
  };

  // プレビューを更新
  useEffect(() => {
    if (mode === "image" && uploadedImage) {
      // 画像モードの場合、画像を直接表示
      setPreviewHtml(`<img src="${uploadedImage}" style="width: 600px; height: 350px; object-fit: contain;" />`);
    } else {
      // テンプレートモードの場合、変数を置換
      const replaced = replaceVariables(template, previewVars);
      setPreviewHtml(replaced);
    }
  }, [template, previewVars, mode, uploadedImage]);

  // テンプレート選択時にテンプレートを更新
  useEffect(() => {
    if (mode === "template") {
      setTemplate(TEMPLATES[selectedTemplate].html);
    }
  }, [selectedTemplate, mode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      setUploadedImage(base64Image);
      setMode("image");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        if (mode === "image") {
          await onSave("", uploadedImage);
        } else {
          await onSave(template);
        }
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("テンプレートの保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white border-[#e5e7eb] shadow-sm rounded-lg">
        <CardHeader className="border-b border-[#e5e7eb] pb-4">
          <CardTitle className="text-[18px] font-semibold text-slate-900 leading-[1.5]">
            名刺設定
          </CardTitle>
          <p className="text-sm font-normal text-[#6b7280] mt-2 leading-[1.5]">
            既存の名刺デザインがある場合は画像をアップロード、ない場合はテンプレートから選択してください
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "setup" | "preview")}>
            <TabsList className="mb-4">
              <TabsTrigger value="setup">設定</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              {/* モード選択 */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-slate-900">名刺の設定方法</Label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("image")}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                      mode === "image"
                        ? "border-[#2563eb] bg-blue-50"
                        : "border-[#e5e7eb] hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mode === "image" ? "border-[#2563eb]" : "border-[#6b7280]"
                    }`}>
                      {mode === "image" && <div className="w-3 h-3 rounded-full bg-[#2563eb]" />}
                    </div>
                    <Upload className={`w-5 h-5 ${mode === "image" ? "text-[#2563eb]" : "text-[#6b7280]"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">既存の名刺画像をアップロード</p>
                      <p className="text-xs text-[#6b7280]">デザインデータをお持ちの場合</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("template")}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                      mode === "template"
                        ? "border-[#2563eb] bg-blue-50"
                        : "border-[#e5e7eb] hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mode === "template" ? "border-[#2563eb]" : "border-[#6b7280]"
                    }`}>
                      {mode === "template" && <div className="w-3 h-3 rounded-full bg-[#2563eb]" />}
                    </div>
                    <Palette className={`w-5 h-5 ${mode === "template" ? "text-[#2563eb]" : "text-[#6b7280]"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">テンプレートから選択</p>
                      <p className="text-xs text-[#6b7280]">デザインがない場合（推奨）</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("custom")}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                      mode === "custom"
                        ? "border-[#2563eb] bg-blue-50"
                        : "border-[#e5e7eb] hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mode === "custom" ? "border-[#2563eb]" : "border-[#6b7280]"
                    }`}>
                      {mode === "custom" && <div className="w-3 h-3 rounded-full bg-[#2563eb]" />}
                    </div>
                    <Code className={`w-5 h-5 ${mode === "custom" ? "text-[#2563eb]" : "text-[#6b7280]"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">HTML/CSSでカスタマイズ</p>
                      <p className="text-xs text-[#6b7280]">上級者向け</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 画像アップロード */}
              {mode === "image" && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-900">名刺画像をアップロード</Label>
                  <div className="border-2 border-dashed border-[#e5e7eb] rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="business-card-image"
                    />
                    <label
                      htmlFor="business-card-image"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <ImageIcon className="w-12 h-12 text-[#6b7280]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">画像を選択</p>
                        <p className="text-xs text-[#6b7280]">PNG、JPG形式（推奨サイズ: 600px × 350px）</p>
                      </div>
                      <Button type="button" variant="outline" className="h-9 px-4 text-sm">
                        <Upload className="w-4 h-4 mr-2" />
                        ファイルを選択
                      </Button>
                    </label>
                  </div>
                  {uploadedImage && (
                    <div className="border border-[#e5e7eb] rounded-lg p-4 bg-slate-50">
                      <img src={uploadedImage} alt="アップロードされた名刺" className="max-w-full h-auto rounded" />
                    </div>
                  )}
                </div>
              )}

              {/* テンプレート選択 */}
              {mode === "template" && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-900">テンプレートを選択</Label>
                  <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as keyof typeof TEMPLATES)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATES).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {Object.entries(TEMPLATES).map(([key, template]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedTemplate(key as keyof typeof TEMPLATES)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedTemplate === key
                            ? "border-[#2563eb] bg-blue-50"
                            : "border-[#e5e7eb] hover:border-blue-200"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-900 mb-2">{template.name}</div>
                        <div className="border border-[#e5e7eb] bg-white rounded" style={{ width: '100%', height: '120px', overflow: 'hidden' }}>
                          <iframe
                            srcDoc={replaceVariables(template.html, previewVars)}
                            className="w-full h-full border-0 transform scale-50 origin-top-left"
                            style={{ width: '200%', height: '200%' }}
                            title={`${template.name}プレビュー`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HTML/CSS編集 */}
              {mode === "custom" && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-900">HTMLテンプレート</Label>
                  <Textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="font-mono text-xs h-96 border-[#e5e7eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-200"
                    placeholder="HTMLテンプレートを入力..."
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">利用可能な変数:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><code className="bg-white px-1 rounded">{`{{company_name}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{company_address}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{company_tel}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{company_fax}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{company_logo_url}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{agent_name}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{agent_tel}}`}</code></div>
                      <div><code className="bg-white px-1 rounded">{`{{agent_email}}`}</code></div>
                    </div>
                  </div>
                </div>
              )}

              {/* プレビュー変数設定 */}
              {(mode === "template" || mode === "custom") && (
                <div className="space-y-4 pt-4 border-t border-[#e5e7eb]">
                  <Label className="text-sm font-semibold text-slate-900">プレビュー用の情報</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">会社名</Label>
                      <Input
                        value={previewVars.company_name}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, company_name: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">担当者名</Label>
                      <Input
                        value={previewVars.agent_name}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, agent_name: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">会社住所</Label>
                      <Input
                        value={previewVars.company_address}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, company_address: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">担当者TEL</Label>
                      <Input
                        value={previewVars.agent_tel}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, agent_tel: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">会社TEL</Label>
                      <Input
                        value={previewVars.company_tel}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, company_tel: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">担当者Email</Label>
                      <Input
                        value={previewVars.agent_email}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, agent_email: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">会社FAX</Label>
                      <Input
                        value={previewVars.company_fax}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, company_fax: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-normal text-slate-700">ロゴURL（任意）</Label>
                      <Input
                        value={previewVars.company_logo_url}
                        onChange={(e) => setPreviewVars(prev => ({ ...prev, company_logo_url: e.target.value }))}
                        className="h-9 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-white">
                <div className="p-4 bg-slate-50 border-b border-[#e5e7eb]">
                  <p className="text-sm font-semibold text-slate-900">プレビュー（600px × 350px）</p>
                </div>
                <div className="p-4 bg-slate-100 flex justify-center">
                  <div className="border border-[#e5e7eb] bg-white shadow-lg" style={{ width: '600px', height: '350px' }}>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                      title="名刺プレビュー"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 text-sm rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-normal gap-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  名刺設定を保存
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
