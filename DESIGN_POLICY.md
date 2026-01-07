# 不動産業界特化機能追加 - 設計方針と実装計画

## 1. 既存構造の詳細分析

### 1.1 技術スタック
- **フロントエンド**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes
- **データベース**: Prisma ORM + SQLite (本番ではPostgreSQL推奨)
- **OCR**: Tesseract.js (クライアント/サーバー両方), Google Cloud Vision API (オプション)
- **PDF生成**: Puppeteer
- **認証**: 簡易的なローカルストレージベース

### 1.2 既存機能の詳細マッピング

#### 送信側機能（既存）
| 機能 | 実装状況 | ファイル/API | 備考 |
|------|---------|------------|------|
| 新規FAX送信 | ✅ 実装済み | `app/api/faxes/route.ts`, `components/screens/new-send-screen.tsx` | 目的別（内見申請、申込書送付、不足書類、その他、名刺） |
| PDF生成 | ✅ 実装済み | `app/api/faxes/generate-pdf/route.ts`, `lib/pdf-generator.ts` | Puppeteer使用、名刺テンプレート対応 |
| OCR処理（送信前） | ⚠️ 部分的 | `lib/ocr-service.ts`, `components/screens/upload-screen.tsx` | クライアント側のみ |
| テンプレート管理 | ✅ 実装済み | `app/api/templates/route.ts`, `prisma/schema.prisma` (FaxTemplate) | 基本的なCRUD、カテゴリ別管理 |
| 予約送信 | ✅ 実装済み | `app/api/faxes/scheduled/route.ts` | `scheduled_at`フィールドで管理 |
| 送信履歴 | ✅ 実装済み | `app/api/faxes/route.ts` (GET), `components/screens/history-screen.tsx` | フィルタリング、ソート対応 |
| 管理会社・物件マスタ | ✅ 実装済み | `app/api/companies/route.ts`, `app/api/properties/route.ts` | 基本的なCRUD |
| 実際のFAX送信 | ❌ モック | `app/api/send-fax/route.ts` | TODO: 実FAXプロバイダー連携 |

#### 受信側機能（既存）
| 機能 | 実装状況 | ファイル/API | 備考 |
|------|---------|------------|------|
| Webhook受信 | ✅ 実装済み | `app/api/received-faxes/webhook/route.ts` | 受信FAXの自動登録 |
| OCR処理（受信後） | ✅ 実装済み | `app/api/received-faxes/[id]/ocr/route.ts`, `app/api/received-faxes/webhook/route.ts` | Tesseract.js使用、自動実行 |
| AI要約生成 | ⚠️ 簡易実装 | `app/api/received-faxes/[id]/summary/route.ts` | キーワードベース、TODO: AI API統合 |
| 文脈推測 | ⚠️ 簡易実装 | `app/api/received-faxes/[id]/context/route.ts` | キーワードベース、過去履歴照合 |
| ネクストアクション | ⚠️ 簡易実装 | `app/api/received-faxes/[id]/next-actions/route.ts` | ルールベース |
| 受信FAX一覧 | ✅ 実装済み | `app/api/received-faxes/route.ts`, `components/screens/received-fax-screen.tsx` | フィルタリング、ソート対応 |
| 文書分類 | ⚠️ 部分的 | `prisma/schema.prisma` (ReceivedFax.document_type) | フィールドはあるが、自動分類ロジックは簡易的 |

### 1.3 重複機能の詳細分析

#### OCR処理の重複
1. **`lib/ocr-service.ts`**: 汎用OCRサービス（Tesseract.jsラッパー）
2. **`app/api/received-faxes/[id]/ocr/route.ts`**: 受信FAX用OCR処理
3. **`app/api/received-faxes/webhook/route.ts`**: Webhook受信時のOCR処理（`processReceivedFaxOCR`関数）
4. **`components/screens/upload-screen.tsx`**: クライアント側OCR処理

**問題点:**
- OCR処理ロジックが3箇所に分散
- `extractInfoFromOCR`関数が重複（`webhook/route.ts`と`[id]/ocr/route.ts`）
- 不動産特化の抽出ロジックが未実装

#### 情報抽出ロジックの重複
- `extractInfoFromOCR`関数が複数箇所に存在
- 抽出項目: `companyName`, `propertyName`, `roomNumber`, `faxNumber`
- 不動産特化の項目（契約日、賃料、修繕内容など）は未実装

#### ログ管理の現状
- `lib/logger.ts`: ファイルベースのログ（エラー、警告、情報）
- FAX送受信の証跡管理は未実装
- 監査ログ機能は未実装

#### 印刷処理の現状
- 帯替え印刷機能: `app/api/obi/generate/route.ts`（画像生成のみ）
- 自動印刷機能は未実装
- 印刷サービス統合は未実装

### 1.4 データフロー分析

#### 送信フロー（既存）
```
新規送信画面 → ファイルアップロード → OCR処理（オプション） → 
フォーム入力 → PDF生成 → 送信API → DB保存 → 送信履歴表示
```

#### 受信フロー（既存）
```
Webhook受信 → DB保存 → OCR処理（非同期） → 情報抽出 → 
AI要約生成（非同期） → 文脈推測（非同期） → ネクストアクション生成（非同期） → 
受信FAX一覧表示
```

## 2. 追加機能の設計方針

### 2.1 設計原則

1. **非破壊的拡張**: 既存API、UI、DBスキーマを破壊しない
2. **モジュール化**: 新機能は独立したモジュールとして実装
3. **疎結合**: 既存コードとの依存関係を最小化
4. **段階的実装**: 一度に全てを実装せず、段階的に追加
5. **統合優先**: 重複機能は統合してから新機能を追加

### 2.2 ディレクトリ構造（追加後）

```
real-estate-fax-mvp/
├── app/
│   ├── api/
│   │   ├── faxes/                    # 既存（維持）
│   │   ├── received-faxes/           # 既存（維持）
│   │   ├── templates/                # 既存（維持）
│   │   ├── companies/                # 既存（維持）
│   │   ├── properties/               # 既存（維持）
│   │   ├── ocr/                      # 既存（維持）
│   │   ├── settings/                 # 既存（維持）
│   │   ├── real-estate/              # 🆕 不動産業界特化API
│   │   │   ├── outbound/             # 送信側特化機能
│   │   │   │   ├── document-templates/    # 書類テンプレート管理
│   │   │   │   │   └── route.ts
│   │   │   │   ├── auto-fill/             # 自動差し込み
│   │   │   │   │   └── route.ts
│   │   │   │   ├── master-companies/      # 管理会社マスタ
│   │   │   │   │   └── route.ts
│   │   │   │   ├── audit-logs/            # 送信ログ・証跡
│   │   │   │   │   └── route.ts
│   │   │   │   ├── preview/               # 送信前プレビュー
│   │   │   │   │   └── route.ts
│   │   │   │   └── integrations/          # 基幹システム連携
│   │   │   │       └── [system]/route.ts
│   │   │   └── inbound/              # 受信側特化機能
│   │   │       ├── document-classification/  # 文書分類
│   │   │       │   └── route.ts
│   │   │       ├── field-extraction/         # 項目抽出
│   │   │       │   └── route.ts
│   │   │       ├── auto-routing/             # 自動振り分け
│   │   │       │   └── route.ts
│   │   │       ├── property-matching/        # 物件紐づけ
│   │   │       │   └── route.ts
│   │   │       ├── auto-reply/               # 自動返信
│   │   │       │   └── route.ts
│   │   │       ├── auto-print/               # 自動印刷
│   │   │       │   └── route.ts
│   │   │       └── archive/                  # アーカイブ・検索
│   │   │           └── route.ts
│   │   └── shared/                    # 🆕 共通機能
│   │       ├── ocr/                   # OCR統合サービス
│   │       │   └── route.ts
│   │       ├── logging/               # ログ管理統合
│   │       │   └── route.ts
│   │       └── printing/              # 印刷処理統合
│   │           └── route.ts
│   └── page.tsx                       # 既存（維持）
├── components/
│   ├── screens/                       # 既存（維持）
│   ├── real-estate/                   # 🆕 不動産業界特化コンポーネント
│   │   ├── outbound/
│   │   │   ├── DocumentTemplateManager.tsx
│   │   │   ├── AutoFillForm.tsx
│   │   │   ├── MasterCompanySelector.tsx
│   │   │   └── SendPreview.tsx
│   │   └── inbound/
│   │       ├── DocumentClassifier.tsx
│   │       ├── FieldExtractor.tsx
│   │       ├── AutoRouter.tsx
│   │       └── ArchiveSearch.tsx
│   └── ui/                            # 既存（維持）
├── lib/
│   ├── real-estate/                   # 🆕 不動産業界特化ライブラリ
│   │   ├── ocr/
│   │   │   ├── real-estate-parser.ts      # 不動産特化OCRパーサー
│   │   │   └── field-extractor.ts         # 項目抽出エンジン
│   │   ├── classification/
│   │   │   └── document-classifier.ts     # 文書分類エンジン
│   │   ├── routing/
│   │   │   └── auto-router.ts             # 自動振り分けエンジン
│   │   ├── matching/
│   │   │   └── property-matcher.ts        # 物件マッチングエンジン
│   │   └── templates/
│   │       └── document-template-engine.ts # 書類テンプレートエンジン
│   └── shared/                        # 🆕 共通ライブラリ
│       ├── ocr-unified.ts             # OCR統合サービス
│       ├── audit-logger.ts             # 監査ログ統合
│       └── print-service.ts           # 印刷サービス統合
└── prisma/
    └── schema.prisma                   # 拡張（非破壊的）
```

### 2.3 データベーススキーマ拡張（非破壊的）

```prisma
// 既存テーブルは維持し、新規テーブルのみ追加

// 🆕 不動産書類テンプレート（既存FaxTemplateを拡張する代わりに、特化テンプレートを別管理）
model RealEstateDocumentTemplate {
  id              Int      @id @default(autoincrement())
  name            String
  category        String   // "申込書", "契約書", "内見申請", "修繕依頼", "物件確認", "審査結果"など
  template_type   String   // "form", "letter", "report", "contract"
  content         String   // HTML/JSON形式のテンプレート
  variables       String?  // JSON形式の変数定義（例: {"property_name": "物件名", "room_number": "号室"}）
  preview_image   String?  // プレビュー画像（Base64）
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // 既存FaxTemplateとの関連（オプション）
  base_template_id Int?
  base_template    FaxTemplate? @relation(fields: [base_template_id], references: [id])
}

// 🆕 管理会社マスタ（既存Companyテーブルを拡張する代わりに、特化情報を別テーブルで管理）
model MasterCompany {
  id              Int      @id @default(autoincrement())
  company_id      Int      @unique  // Companyテーブルへの参照
  company         Company  @relation(fields: [company_id], references: [id])
  preferred_fax_number String?  // 優先FAX番号
  business_hours  String?      // 営業時間（JSON形式: {"weekdays": "9:00-18:00", "weekends": "10:00-17:00"}）
  contact_person  String?       // 担当者名
  department      String?       // 部署名
  notes           String?        // 備考
  tags            String?        // JSON形式のタグ（例: ["重要", "自動返信対応"]）
  auto_reply_enabled Boolean @default(false) // 自動返信有効化
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

// 🆕 送信ログ・証跡（既存Faxテーブルを拡張）
model FaxAuditLog {
  id              Int      @id @default(autoincrement())
  fax_id          Int
  fax             Fax      @relation(fields: [fax_id], references: [id])
  action          String   // "sent", "failed", "retried", "cancelled", "scheduled", "rescheduled"
  status          String   // "success", "failed", "pending", "cancelled"
  error_message   String?
  metadata        String?  // JSON形式のメタデータ（送信先、送信時刻、再送回数など）
  ip_address      String?  // 送信元IPアドレス（監査用）
  user_id         Int?     // 送信ユーザーID
  user            User?    @relation(fields: [user_id], references: [id])
  created_at      DateTime @default(now())
  
  @@index([fax_id])
  @@index([created_at])
  @@index([action])
}

// 🆕 受信FAX分類結果（既存ReceivedFaxテーブルを拡張）
model ReceivedFaxClassification {
  id              Int      @id @default(autoincrement())
  received_fax_id Int      @unique
  received_fax    ReceivedFax @relation(fields: [received_fax_id], references: [id])
  document_type   String   // "申込書", "物件確認", "修繕依頼", "審査結果", "契約書", "その他"など
  confidence      Float    // 分類の信頼度 (0-1)
  extracted_fields String? // JSON形式の抽出項目（例: {"contract_date": "2024-01-15", "rent": "80000"}）
  property_match_id Int?   // 紐づけられた物件ID
  property        Property? @relation(fields: [property_match_id], references: [id])
  assigned_user_id Int?    // 振り分けられた担当者ID
  assigned_user   User?    @relation(fields: [assigned_user_id], references: [id])
  routing_rule_id Int?     // 使用した振り分けルールID
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@index([document_type])
  @@index([property_match_id])
  @@index([assigned_user_id])
}

// 🆕 受信FAXタグ
model ReceivedFaxTag {
  id              Int      @id @default(autoincrement())
  received_fax_id Int
  received_fax    ReceivedFax @relation(fields: [received_fax_id], references: [id])
  tag             String
  created_at      DateTime @default(now())
  
  @@unique([received_fax_id, tag])
  @@index([tag])
}

// 🆕 自動返信テンプレート
model AutoReplyTemplate {
  id              Int      @id @default(autoincrement())
  trigger_type    String   // "物件確認", "修繕依頼", "申込書受領"など
  trigger_keywords String? // JSON形式のトリガーキーワード（例: ["物件確認", "物件について"]）
  template_content String
  template_variables String? // JSON形式の変数定義
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

// 🆕 自動振り分けルール
model AutoRoutingRule {
  id              Int      @id @default(autoincrement())
  name            String
  priority        Int      @default(0) // 優先度（高いほど優先）
  conditions      String   // JSON形式の条件（例: {"document_type": "申込書", "urgency": "high"}）
  target_user_id  Int?     // 振り分け先ユーザーID
  target_user     User?    @relation(fields: [target_user_id], references: [id])
  target_department String? // 振り分け先部署名
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@index([priority])
}

// 🆕 基幹システム連携設定
model SystemIntegration {
  id              Int      @id @default(autoincrement())
  system_name     String   // "物件管理システム", "顧客管理システム", "会計システム"など
  system_type     String   // "property_management", "crm", "accounting", "custom"
  api_endpoint    String
  api_key         String?  // 暗号化して保存（環境変数または暗号化ライブラリ使用）
  api_secret      String?  // 暗号化して保存
  config          String?  // JSON形式の設定（認証方式、同期間隔など）
  is_active       Boolean  @default(true)
  last_sync_at    DateTime? // 最終同期時刻
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@unique([system_name])
}

// 🆕 印刷ジョブ
model PrintJob {
  id              Int      @id @default(autoincrement())
  received_fax_id Int?
  received_fax    ReceivedFax? @relation(fields: [received_fax_id], references: [id])
  document_type   String   // "図面", "資料", "契約書"など
  printer_name    String?  // プリンター名
  status          String   @default("pending") // "pending", "printing", "completed", "failed"
  error_message   String?
  created_at      DateTime @default(now())
  completed_at    DateTime?
  
  @@index([status])
  @@index([received_fax_id])
}
```

### 2.4 API設計方針

#### 2.4.1 命名規則
- 既存API: `/api/faxes/*`, `/api/received-faxes/*` → **維持**
- 新規API: `/api/real-estate/outbound/*`, `/api/real-estate/inbound/*`
- 共通API: `/api/shared/*`

#### 2.4.2 エンドポイント設計

**送信側特化API (`/api/real-estate/outbound/`):**
```
POST   /api/real-estate/outbound/document-templates        # 書類テンプレート作成
GET    /api/real-estate/outbound/document-templates          # 書類テンプレート一覧
GET    /api/real-estate/outbound/document-templates/:id      # 書類テンプレート取得
PUT    /api/real-estate/outbound/document-templates/:id      # 書類テンプレート更新
DELETE /api/real-estate/outbound/document-templates/:id     # 書類テンプレート削除

POST   /api/real-estate/outbound/auto-fill                   # 自動差し込み実行
GET    /api/real-estate/outbound/master-companies            # 管理会社マスタ一覧
POST   /api/real-estate/outbound/master-companies           # 管理会社マスタ作成
PUT    /api/real-estate/outbound/master-companies/:id       # 管理会社マスタ更新
GET    /api/real-estate/outbound/audit-logs                 # 送信ログ取得
POST   /api/real-estate/outbound/preview                    # 送信前プレビュー生成
POST   /api/real-estate/outbound/integrations/:system/sync   # 基幹システム同期
```

**受信側特化API (`/api/real-estate/inbound/`):**
```
POST   /api/real-estate/inbound/classify                    # 文書分類実行
POST   /api/real-estate/inbound/extract-fields              # 項目抽出実行
POST   /api/real-estate/inbound/route                      # 自動振り分け実行
POST   /api/real-estate/inbound/match-property              # 物件紐づけ実行
POST   /api/real-estate/inbound/auto-reply                  # 自動返信実行
POST   /api/real-estate/inbound/auto-print                  # 自動印刷実行
GET    /api/real-estate/inbound/archive                    # アーカイブ検索
POST   /api/real-estate/inbound/archive/tags               # タグ追加
DELETE /api/real-estate/inbound/archive/tags/:id           # タグ削除
GET    /api/real-estate/inbound/routing-rules              # 振り分けルール一覧
POST   /api/real-estate/inbound/routing-rules               # 振り分けルール作成
PUT    /api/real-estate/inbound/routing-rules/:id          # 振り分けルール更新
```

**共通API (`/api/shared/`):**
```
POST   /api/shared/ocr/process                              # OCR処理統合エンドポイント
GET    /api/shared/logging/audit-logs                       # 監査ログ取得
POST   /api/shared/printing/print                           # 印刷実行
GET    /api/shared/printing/jobs                            # 印刷ジョブ一覧
```

### 2.5 統合方針

#### 2.5.1 OCR処理の統合

**現状の問題:**
- OCR処理が複数箇所に分散
- 抽出ロジックが重複
- 不動産特化の抽出ロジックが未実装

**統合案:**
1. `lib/shared/ocr-unified.ts` を作成（統合OCRサービス）
2. 既存の `lib/ocr-service.ts` をラップ
3. 不動産特化パーサー (`lib/real-estate/ocr/real-estate-parser.ts`) を追加
4. 既存APIは内部で統合サービスを呼び出すように変更（非破壊的）

**実装例:**
```typescript
// lib/shared/ocr-unified.ts (新規)
export interface UnifiedOCRRequest {
  imageUrl: string;
  options?: {
    mode?: 'general' | 'real-estate';
    extractFields?: string[];
    documentType?: string;
  };
}

export interface UnifiedOCRResult {
  text: string;
  extractedFields: Record<string, any>;
  confidence: number;
  metadata?: Record<string, any>;
}

export async function processOCR(request: UnifiedOCRRequest): Promise<UnifiedOCRResult> {
  // 1. 既存のOCR処理を呼び出し
  const baseResult = await processBaseOCR(request.imageUrl);
  
  // 2. 不動産特化モードの場合は追加パーサーを適用
  if (request.options?.mode === 'real-estate') {
    const realEstateFields = await extractRealEstateFields(baseResult.text, request.options.documentType);
    return {
      ...baseResult,
      extractedFields: { ...baseResult.extractedFields, ...realEstateFields }
    };
  }
  
  return baseResult;
}
```

**既存APIへの統合:**
- `app/api/received-faxes/[id]/ocr/route.ts`: 統合サービスを呼び出すように変更
- `app/api/received-faxes/webhook/route.ts`: 統合サービスを呼び出すように変更
- レスポンス形式は維持（後方互換性）

#### 2.5.2 ログ管理の統合

**現状の問題:**
- `lib/logger.ts` は存在するが、FAX送受信の証跡管理は未実装

**統合案:**
1. `lib/shared/audit-logger.ts` を作成
2. 既存の `lib/logger.ts` を拡張
3. 送受信イベントを自動記録するミドルウェアを作成

**実装例:**
```typescript
// lib/shared/audit-logger.ts (新規)
export interface FaxAuditEvent {
  type: 'sent' | 'received' | 'failed' | 'retried' | 'cancelled';
  faxId?: number;
  receivedFaxId?: number;
  userId?: number;
  metadata?: Record<string, any>;
}

export async function logFaxEvent(event: FaxAuditEvent) {
  // 1. ファイルログに記録（既存logger使用）
  logger.info(`FAX ${event.type}`, { ...event });
  
  // 2. データベースに記録（FaxAuditLogテーブル）
  if (event.faxId) {
    await prisma.faxAuditLog.create({
      data: {
        fax_id: event.faxId,
        action: event.type,
        status: event.type === 'sent' ? 'success' : 'failed',
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        user_id: event.userId,
      }
    });
  }
}
```

**既存APIへの統合:**
- `app/api/faxes/route.ts` (POST): 送信成功時にログ記録
- `app/api/received-faxes/webhook/route.ts`: 受信時にログ記録
- 既存動作に影響なし（追加のみ）

#### 2.5.3 印刷処理の統合

**現状の問題:**
- 帯替え印刷機能はあるが、自動印刷機能は未実装

**統合案:**
1. `lib/shared/print-service.ts` を作成
2. 既存の印刷機能を統合
3. 自動印刷ルールを設定可能にする

**実装例:**
```typescript
// lib/shared/print-service.ts (新規)
export interface PrintRequest {
  documentType: string;
  content: string | Buffer;
  printer?: string;
  metadata?: Record<string, any>;
}

export async function printDocument(request: PrintRequest): Promise<{ jobId: number }> {
  // 1. 印刷ジョブを作成
  const job = await prisma.printJob.create({
    data: {
      document_type: request.documentType,
      printer_name: request.printer,
      status: 'pending',
    }
  });
  
  // 2. 実際の印刷処理（OSの印刷コマンドまたは印刷API）
  // TODO: 実装
  
  return { jobId: job.id };
}
```

## 3. 実装計画（段階的）

### Phase 1: 基盤整備（1-2週間）
**目標**: 重複機能を統合し、新機能の基盤を整備

1. ✅ データベーススキーマ拡張（非破壊的）
   - 新規テーブルの追加
   - マイグレーション実行
2. ✅ OCR統合サービスの実装
   - `lib/shared/ocr-unified.ts` 作成
   - 不動産特化パーサー (`lib/real-estate/ocr/real-estate-parser.ts`) 作成
   - 既存APIへの統合（非破壊的）
3. ✅ ログ管理統合サービスの実装
   - `lib/shared/audit-logger.ts` 作成
   - 既存APIへの統合（非破壊的）
4. ✅ 印刷サービス統合の実装
   - `lib/shared/print-service.ts` 作成
   - 基本的な印刷機能の実装

### Phase 2: 送信側特化機能（2-3週間）
**目標**: 不動産業界特化の送信機能を実装

1. ✅ 書類テンプレート管理機能
   - API実装 (`/api/real-estate/outbound/document-templates`)
   - UI実装 (`components/real-estate/outbound/DocumentTemplateManager.tsx`)
2. ✅ 自動差し込み機能
   - API実装 (`/api/real-estate/outbound/auto-fill`)
   - UI実装 (`components/real-estate/outbound/AutoFillForm.tsx`)
3. ✅ 管理会社マスタ機能
   - API実装 (`/api/real-estate/outbound/master-companies`)
   - UI実装 (`components/real-estate/outbound/MasterCompanySelector.tsx`)
4. ✅ 送信ログ・証跡管理機能
   - API実装 (`/api/real-estate/outbound/audit-logs`)
   - UI実装（送信履歴画面に統合）
5. ✅ 送信前プレビュー機能
   - API実装 (`/api/real-estate/outbound/preview`)
   - UI実装 (`components/real-estate/outbound/SendPreview.tsx`)

### Phase 3: 受信側特化機能（2-3週間）
**目標**: 不動産業界特化の受信機能を実装

1. ✅ 文書分類機能（AI強化）
   - API実装 (`/api/real-estate/inbound/classify`)
   - AI API統合（OpenAI/Claude）
   - UI実装 (`components/real-estate/inbound/DocumentClassifier.tsx`)
2. ✅ 項目抽出機能（不動産特化）
   - API実装 (`/api/real-estate/inbound/extract-fields`)
   - 不動産特化抽出ロジック実装
   - UI実装 (`components/real-estate/inbound/FieldExtractor.tsx`)
3. ✅ 自動振り分け機能
   - API実装 (`/api/real-estate/inbound/route`)
   - ルールエンジン実装 (`lib/real-estate/routing/auto-router.ts`)
   - UI実装 (`components/real-estate/inbound/AutoRouter.tsx`)
4. ✅ 物件紐づけ機能
   - API実装 (`/api/real-estate/inbound/match-property`)
   - マッチングエンジン実装 (`lib/real-estate/matching/property-matcher.ts`)
   - UI実装（受信FAX画面に統合）
5. ✅ 自動返信機能
   - API実装 (`/api/real-estate/inbound/auto-reply`)
   - テンプレート管理機能
   - UI実装（受信FAX画面に統合）
6. ✅ 自動印刷機能
   - API実装 (`/api/real-estate/inbound/auto-print`)
   - 印刷ルール管理機能
   - UI実装（受信FAX画面に統合）
7. ✅ アーカイブ・検索機能
   - API実装 (`/api/real-estate/inbound/archive`)
   - タグ管理機能
   - UI実装 (`components/real-estate/inbound/ArchiveSearch.tsx`)

### Phase 4: 統合・最適化（1週間）
**目標**: 既存機能との統合と最適化

1. ✅ 既存機能との統合テスト
   - 送信フローとの統合
   - 受信フローとの統合
2. ✅ パフォーマンス最適化
   - OCR処理の最適化
   - データベースクエリの最適化
3. ✅ ドキュメント整備
   - API仕様書
   - ユーザーガイド

## 4. 既存コードへの影響

### 4.1 破壊的変更なし
- 既存APIエンドポイントは全て維持
- 既存UIコンポーネントは全て維持
- 既存データベーステーブルは全て維持

### 4.2 拡張のみ
- 新規テーブルの追加
- 新規APIエンドポイントの追加
- 新規UIコンポーネントの追加
- 既存機能の内部実装を改善（外部インターフェースは維持）

### 4.3 統合ポイント
- OCR処理: 既存APIは内部で統合サービスを呼び出すように変更（レスポンス形式は維持）
- ログ管理: 既存の送受信処理にログ記録を追加（既存動作に影響なし）
- 印刷処理: 既存の印刷機能を統合サービス経由に変更（既存動作に影響なし）

## 5. 次のステップ

1. **承認**: この設計方針の承認
2. **Phase 1開始**: 基盤整備から実装開始
3. **段階的実装**: Phase 1 → Phase 2 → Phase 3 → Phase 4 の順で実装

承認いただければ、Phase 1の実装に進みます。修正や追加の要件があればお知らせください。







