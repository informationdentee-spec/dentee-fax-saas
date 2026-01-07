# Supabase設定ガイド

## 必要なパッケージのインストール

```bash
npm install @supabase/supabase-js
```

## 環境変数の設定

`.env.local`に以下を追加してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## データベーススキーマ（Supabase SQL）

SupabaseのSQL Editorで以下を実行してください：

```sql
-- usersテーブルにカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_method text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS person_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;

-- usage_recordsテーブルを作成
CREATE TABLE IF NOT EXISTS usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  year_month text NOT NULL,
  send_count int DEFAULT 0,
  receive_count int DEFAULT 0,
  total_pages int DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- invoicesテーブルを作成
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  year_month text NOT NULL,
  amount int DEFAULT 0,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_usage_records_user_year_month ON usage_records(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_invoices_user_year_month ON invoices(user_id, year_month);
```

## 実装内容

### 1. Supabaseクライアント設定
- `lib/supabase/client.ts` - クライアント側用
- `lib/supabase/server.ts` - サーバー側用（Service Role Key使用）
- `lib/supabase/getUserId.ts` - リクエストからuser_idを取得

### 2. usage_records保存ロジック
- `lib/usage/saveUsage.ts` - 送信・受信時の利用記録を保存

### 3. FAX送受信処理への統合
- `app/api/faxes/route.ts` - 送信成功時にusage_recordsに保存
- `app/api/received-faxes/route.ts` - 受信時にusage_recordsに保存
- `app/api/received-faxes/webhook/route.ts` - Webhook受信時にusage_recordsに保存

### 4. invoices生成API
- `app/api/billing/generate-invoices/route.ts` - usage_recordsを集計してinvoicesに保存

### 5. UIコンポーネント
- `components/usage/UsageSummary.tsx` - 利用状況を表示
- `app/page.tsx` - トップ画面にUsageSummaryを追加

### 6. Stripe関連UIの非表示
- `app/page.tsx` - サイドバーの「お支払い情報」ボタンを非表示
- `components/screens/settings-screen.tsx` - クレジットカードタブを非表示

## 使用方法

### usage_recordsの保存
FAX送信・受信時に自動的に保存されます。手動で保存する場合は：

```typescript
import { saveSendUsage, saveReceiveUsage } from '@/lib/usage/saveUsage';

// 送信時
await saveSendUsage(userId, new Date(), pageCount);

// 受信時
await saveReceiveUsage(userId, new Date(), pageCount);
```

### invoicesの生成
特定の年月の請求書を生成する場合：

```bash
curl -X POST http://localhost:3000/api/billing/generate-invoices \
  -H "Content-Type: application/json" \
  -d '{"year_month": "2026-01"}'
```

## 注意事項

- Supabaseのuser_idは、リクエストヘッダーの`Authorization: Bearer <token>`から取得されます
- 認証トークンが含まれていない場合、usage_recordsへの保存はスキップされます（既存処理は継続）
- 既存のPrismaベースの処理はそのまま動作します

