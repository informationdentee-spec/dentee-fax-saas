# 既存構造の分析と追加機能の設計方針

## 1. 既存構造の分析

### 1.1 アーキテクチャ概要

**技術スタック:**
- **フロントエンド**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes
- **データベース**: Prisma ORM + SQLite (本番ではPostgreSQL推奨)
- **OCR**: Tesseract.js (クライアント/サーバー両方), Google Cloud Vision API (オプション)
- **PDF生成**: Puppeteer
- **認証**: 簡易的なローカルストレージベース

### 1.2 ディレクトリ構造

```
real-estate-fax-mvp/
├── app/
│   ├── api/                    # API Routes
│   │   ├── faxes/              # 送信関連API
│   │   ├── received-faxes/     # 受信関連API
│   │   ├── templates/          # テンプレート管理API
│   │   ├── companies/          # 管理会社API
│   │   ├── properties/        # 物件API
│   │   ├── ocr/                # OCR処理API
│   │   └── settings/          # 設定API
│   └── page.tsx                # メインページ
├── components/
│   ├── screens/                # 画面コンポーネント
│   │   ├── new-send-screen.tsx      # 新規送信画面
│   │   ├── history-screen.tsx        # 送信履歴画面
│   │   ├── received-fax-screen.tsx   # 受信FAX画面
│   │   └── settings-screen.tsx       # 設定画面
│   └── ui/                     # UIコンポーネント (shadcn/ui)
├── lib/
│   ├── prisma.ts               # Prismaクライアント
│   ├── ocr-service.ts          # OCR処理サービス
│   ├── pdf-generator.ts        # PDF生成サービス
│   ├── email-service.ts        # メール送信サービス
│   └── types.ts                # 型定義
└── prisma/
    └── schema.prisma           # データベーススキーマ
```

### 1.3 既存データモデル

**主要テーブル:**
- `User`: 担当者情報
- `Company`: 管理会社情報
- `Property`: 物件情報
- `Fax`: 送信履歴
- `ReceivedFax`: 受信FAX
- `FaxTemplate`: FAX送信テンプレート
- `Settings`: システム設定
- `UsageStatement`: 利用明細
- `CreditCard`: クレジットカード情報

### 1.4 既存機能の整理

#### 送信側機能（既存）
- ✅ 新規FAX送信（目的別: 内見申請、申込書送付、不足書類、その他、名刺）
- ✅ PDF生成（名刺テンプレート対応）
- ✅ OCR処理（送信前の画像解析）
- ✅ テンプレート管理
- ✅ 予約送信
- ✅ 送信履歴表示
- ✅ 管理会社・物件マスタ管理
- ⚠️ 実際のFAX送信はモック実装（`app/api/send-fax/route.ts`）

#### 受信側機能（既存）
- ✅ Webhook受信
- ✅ OCR処理（Tesseract.js）
- ✅ AI要約生成（`/api/received-faxes/[id]/summary`）
- ✅ 文脈推測（`/api/received-faxes/[id]/context`）
- ✅ ネクストアクション提案（`/api/received-faxes/[id]/next-actions`）
- ✅ 受信FAX一覧表示
- ⚠️ 文書分類は部分的（`document_type`フィールドはあるが、自動分類ロジックは簡易的）

### 1.5 重複機能の特定

**重複している機能:**
1. **OCR処理**: 
   - `lib/ocr-service.ts` (汎用)
   - `app/api/received-faxes/[id]/ocr/route.ts` (受信用)
   - `components/screens/upload-screen.tsx` (送信用、クライアント側)
   - → **統合が必要**

2. **情報抽出ロジック**:
   - `extractInfoFromOCR()` が複数箇所に存在
   - → **統合が必要**

3. **ログ管理**:
   - `lib/logger.ts` は存在するが、FAX送受信の証跡管理は未実装
   - → **拡張が必要**

4. **印刷処理**:
   - 帯替え印刷機能はあるが、自動印刷機能は未実装
   - → **拡張が必要**

## 2. 追加機能の設計方針

### 2.1 設計原則

1. **非破壊的拡張**: 既存API、UI、DBスキーマを破壊しない
2. **モジュール化**: 新機能は独立したモジュールとして実装
3. **疎結合**: 既存コードとの依存関係を最小化
4. **段階的実装**: 一度に全てを実装せず、段階的に追加

### 2.2 ディレクトリ構造（追加後）

```
real-estate-fax-mvp/
├── app/
│   ├── api/
│   │   ├── faxes/                    # 既存（維持）
│   │   ├── received-faxes/           # 既存（維持）
│   │   ├── real-estate/              # 🆕 不動産業界特化API
│   │   │   ├── outbound/             # 送信側特化機能
│   │   │   │   ├── document-templates/    # 書類テンプレート管理
│   │   │   │   ├── auto-fill/             # 自動差し込み
│   │   │   │   ├── master-companies/      # 管理会社マスタ
│   │   │   │   ├── audit-logs/            # 送信ログ・証跡
│   │   │   │   ├── preview/               # 送信前プレビュー
│   │   │   │   └── integrations/          # 基幹システム連携
│   │   │   └── inbound/              # 受信側特化機能
│   │   │       ├── document-classification/  # 文書分類
│   │   │       ├── field-extraction/         # 項目抽出
│   │   │       ├── auto-routing/             # 自動振り分け
│   │   │       ├── property-matching/        # 物件紐づけ
│   │   │       ├── auto-reply/               # 自動返信
│   │   │       ├── auto-print/               # 自動印刷
│   │   │       └── archive/                  # アーカイブ・検索
│   │   └── shared/                    # 🆕 共通機能
│   │       ├── ocr/                   # OCR統合サービス
│   │       ├── logging/               # ログ管理統合
│   │       └── printing/              # 印刷処理統合
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

// 🆕 不動産書類テンプレート
model RealEstateDocumentTemplate {
  id              Int      @id @default(autoincrement())
  name            String
  category        String   // "申込書", "契約書", "内見申請", "修繕依頼"など
  template_type   String   // "form", "letter", "report"
  content         String   // HTML/JSON形式のテンプレート
  variables       String?  // JSON形式の変数定義
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

// 🆕 管理会社マスタ（既存Companyテーブルを拡張する代わりに、特化情報を別テーブルで管理）
model MasterCompany {
  id              Int      @id @default(autoincrement())
  company_id      Int      @unique  // Companyテーブルへの参照
  company         Company  @relation(fields: [company_id], references: [id])
  preferred_fax_number String?  // 優先FAX番号
  business_hours  String?      // 営業時間
  contact_person  String?       // 担当者名
  notes           String?        // 備考
  tags            String?        // JSON形式のタグ
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

// 🆕 送信ログ・証跡（既存Faxテーブルを拡張）
model FaxAuditLog {
  id              Int      @id @default(autoincrement())
  fax_id          Int
  fax             Fax      @relation(fields: [fax_id], references: [id])
  action          String   // "sent", "failed", "retried", "cancelled"
  status          String   // "success", "failed", "pending"
  error_message   String?
  metadata        String?  // JSON形式のメタデータ
  created_at      DateTime @default(now())
}

// 🆕 受信FAX分類結果（既存ReceivedFaxテーブルを拡張）
model ReceivedFaxClassification {
  id              Int      @id @default(autoincrement())
  received_fax_id Int      @unique
  received_fax    ReceivedFax @relation(fields: [received_fax_id], references: [id])
  document_type   String   // "申込書", "物件確認", "修繕依頼", "審査結果"など
  confidence      Float    // 分類の信頼度 (0-1)
  extracted_fields String? // JSON形式の抽出項目
  property_match_id Int?   // 紐づけられた物件ID
  assigned_user_id Int?    // 振り分けられた担当者ID
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

// 🆕 受信FAXタグ
model ReceivedFaxTag {
  id              Int      @id @default(autoincrement())
  received_fax_id Int
  received_fax    ReceivedFax @relation(fields: [received_fax_id], references: [id])
  tag             String
  created_at      DateTime @default(now())
  
  @@unique([received_fax_id, tag])
}

// 🆕 自動返信テンプレート
model AutoReplyTemplate {
  id              Int      @id @default(autoincrement())
  trigger_type    String   // "物件確認", "修繕依頼"など
  template_content String
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

// 🆕 基幹システム連携設定
model SystemIntegration {
  id              Int      @id @default(autoincrement())
  system_name     String   // "物件管理システム", "顧客管理システム"など
  api_endpoint    String
  api_key         String?  // 暗号化して保存
  config          String?  // JSON形式の設定
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
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
DELETE /api/real-estate/outbound/document-templates/:id      # 書類テンプレート削除

POST   /api/real-estate/outbound/auto-fill                   # 自動差し込み実行
GET    /api/real-estate/outbound/master-companies            # 管理会社マスタ一覧
POST   /api/real-estate/outbound/master-companies           # 管理会社マスタ作成
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
```

**共通API (`/api/shared/`):**
```
POST   /api/shared/ocr/process                              # OCR処理統合エンドポイント
GET    /api/shared/logging/audit-logs                       # 監査ログ取得
POST   /api/shared/printing/print                           # 印刷実行
```

### 2.5 統合方針

#### 2.5.1 OCR処理の統合

**現状の問題:**
- OCR処理が複数箇所に分散
- 抽出ロジックが重複

**統合案:**
1. `lib/shared/ocr-unified.ts` を作成
2. 既存の `lib/ocr-service.ts` をラップ
3. 不動産特化パーサー (`lib/real-estate/ocr/real-estate-parser.ts`) を追加
4. 既存APIは内部で統合サービスを呼び出すように変更（非破壊的）

```typescript
// lib/shared/ocr-unified.ts (新規)
export interface UnifiedOCRRequest {
  imageUrl: string;
  options?: {
    mode?: 'general' | 'real-estate';
    extractFields?: string[];
  };
}

export interface UnifiedOCRResult {
  text: string;
  extractedFields: Record<string, any>;
  confidence: number;
}

export async function processOCR(request: UnifiedOCRRequest): Promise<UnifiedOCRResult> {
  // 既存のOCR処理を呼び出し
  // 不動産特化モードの場合は追加パーサーを適用
}
```

#### 2.5.2 ログ管理の統合

**現状の問題:**
- `lib/logger.ts` は存在するが、FAX送受信の証跡管理は未実装

**統合案:**
1. `lib/shared/audit-logger.ts` を作成
2. 既存の `lib/logger.ts` を拡張
3. 送受信イベントを自動記録するミドルウェアを作成

```typescript
// lib/shared/audit-logger.ts (新規)
export async function logFaxEvent(event: {
  type: 'sent' | 'received' | 'failed' | 'retried';
  faxId?: number;
  receivedFaxId?: number;
  metadata?: Record<string, any>;
}) {
  // FaxAuditLogテーブルに記録
}
```

#### 2.5.3 印刷処理の統合

**現状の問題:**
- 帯替え印刷機能はあるが、自動印刷機能は未実装

**統合案:**
1. `lib/shared/print-service.ts` を作成
2. 既存の印刷機能を統合
3. 自動印刷ルールを設定可能にする

```typescript
// lib/shared/print-service.ts (新規)
export interface PrintRequest {
  documentType: string;
  content: string | Buffer;
  printer?: string;
}

export async function printDocument(request: PrintRequest): Promise<void> {
  // 印刷処理
}
```

## 3. 実装計画（段階的）

### Phase 1: 基盤整備（1-2週間）
1. ✅ データベーススキーマ拡張（非破壊的）
2. ✅ OCR統合サービスの実装
3. ✅ ログ管理統合サービスの実装
4. ✅ 印刷サービス統合の実装

### Phase 2: 送信側特化機能（2-3週間）
1. ✅ 書類テンプレート管理機能
2. ✅ 自動差し込み機能
3. ✅ 管理会社マスタ機能
4. ✅ 送信ログ・証跡管理機能
5. ✅ 送信前プレビュー機能

### Phase 3: 受信側特化機能（2-3週間）
1. ✅ 文書分類機能（AI強化）
2. ✅ 項目抽出機能（不動産特化）
3. ✅ 自動振り分け機能
4. ✅ 物件紐づけ機能
5. ✅ 自動返信機能
6. ✅ 自動印刷機能
7. ✅ アーカイブ・検索機能

### Phase 4: 統合・最適化（1週間）
1. ✅ 既存機能との統合テスト
2. ✅ パフォーマンス最適化
3. ✅ ドキュメント整備

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







