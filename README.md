# 不動産FAXクラウド

不動産会社向けのFAX管理ツール。FAX送受信の自動化、OCR処理、AI要約機能を提供します。

## 機能

- 📤 **FAX送信**: PDFからFAX送信、予約送信、自動リトライ
- 📥 **FAX受信**: Webhook受信、自動OCR処理、AI要約
- 🤖 **AI機能**: OCR、文脈推測、ネクストアクション提示
- 📋 **テンプレート管理**: FAX送信テンプレート、名刺テンプレート
- 📊 **履歴管理**: 送信履歴、受信履歴の検索・フィルタリング
- 💾 **データ管理**: エクスポート、バックアップ・復元

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite (Prisma ORM)
- **OCR**: Tesseract.js, Google Cloud Vision API
- **PDF生成**: Puppeteer
- **メール送信**: Nodemailer (SendGrid対応)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env
```

### 3. データベースのセットアップ

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## デプロイ

### Vercelへのデプロイ

1. Vercelアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定（`.env.example`を参照）
4. デプロイ

### 環境変数の設定

Vercelのダッシュボードで以下の環境変数を設定してください：

- `DATABASE_URL`: SQLiteファイルのパス（本番環境ではPostgreSQL推奨）
- `NEXT_PUBLIC_BASE_URL`: デプロイ先のURL
- `FAX_WEBHOOK_SECRET`: Webhook署名検証用のシークレット
- `GOOGLE_CLOUD_VISION_API_KEY`: Google Cloud Vision APIキー（オプション）
- `SMTP_*` または `SENDGRID_API_KEY`: メール送信設定（オプション）

### Cronジョブ

`vercel.json`で設定済みのCronジョブ：
- `/api/cron/scheduled-faxes`: 5分ごとに予約送信を処理

## APIエンドポイント

主要なAPIエンドポイント：

### 認証
- `POST /api/auth/login` - ログイン

### FAX送信
- `GET /api/faxes` - 送信履歴取得
- `POST /api/faxes` - FAX送信（データ登録）
- `POST /api/faxes/generate-pdf` - FAX用紙PDF生成
- `POST /api/faxes/scheduled` - 予約送信処理
- `GET /api/faxes/export` - データエクスポート

### FAX受信
- `GET /api/received-faxes` - 受信履歴取得
- `POST /api/received-faxes` - 受信FAX作成
- `POST /api/received-faxes/webhook` - Webhook受信
- `GET /api/received-faxes/[id]/summary` - AI要約生成
- `GET /api/received-faxes/[id]/context` - 文脈推測
- `GET /api/received-faxes/[id]/next-actions` - ネクストアクション

### その他
- `GET /api/backup` - バックアップ作成
- `POST /api/backup/restore` - バックアップ復元

詳細なAPI仕様は各エンドポイントのソースコードを参照してください。

## 開発

### プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── screens/          # 画面コンポーネント
│   └── ui/               # UIコンポーネント（shadcn/ui）
├── lib/                   # ユーティリティ
│   ├── prisma.ts         # Prismaクライアント
│   ├── email-service.ts  # メール送信
│   └── logger.ts         # ログ記録
└── prisma/               # Prisma設定
    └── schema.prisma     # データベーススキーマ
```

### データベースマイグレーション

```bash
# マイグレーション作成
npx prisma migrate dev --name migration_name

# Prismaクライアント生成
npx prisma generate
```

## ライセンス

MIT






不動産会社向けのFAX管理ツール。FAX送受信の自動化、OCR処理、AI要約機能を提供します。

## 機能

- 📤 **FAX送信**: PDFからFAX送信、予約送信、自動リトライ
- 📥 **FAX受信**: Webhook受信、自動OCR処理、AI要約
- 🤖 **AI機能**: OCR、文脈推測、ネクストアクション提示
- 📋 **テンプレート管理**: FAX送信テンプレート、名刺テンプレート
- 📊 **履歴管理**: 送信履歴、受信履歴の検索・フィルタリング
- 💾 **データ管理**: エクスポート、バックアップ・復元

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite (Prisma ORM)
- **OCR**: Tesseract.js, Google Cloud Vision API
- **PDF生成**: Puppeteer
- **メール送信**: Nodemailer (SendGrid対応)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env
```

### 3. データベースのセットアップ

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## デプロイ

### Vercelへのデプロイ

1. Vercelアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定（`.env.example`を参照）
4. デプロイ

### 環境変数の設定

Vercelのダッシュボードで以下の環境変数を設定してください：

- `DATABASE_URL`: SQLiteファイルのパス（本番環境ではPostgreSQL推奨）
- `NEXT_PUBLIC_BASE_URL`: デプロイ先のURL
- `FAX_WEBHOOK_SECRET`: Webhook署名検証用のシークレット
- `GOOGLE_CLOUD_VISION_API_KEY`: Google Cloud Vision APIキー（オプション）
- `SMTP_*` または `SENDGRID_API_KEY`: メール送信設定（オプション）

### Cronジョブ

`vercel.json`で設定済みのCronジョブ：
- `/api/cron/scheduled-faxes`: 5分ごとに予約送信を処理

## APIエンドポイント

主要なAPIエンドポイント：

### 認証
- `POST /api/auth/login` - ログイン

### FAX送信
- `GET /api/faxes` - 送信履歴取得
- `POST /api/faxes` - FAX送信（データ登録）
- `POST /api/faxes/generate-pdf` - FAX用紙PDF生成
- `POST /api/faxes/scheduled` - 予約送信処理
- `GET /api/faxes/export` - データエクスポート

### FAX受信
- `GET /api/received-faxes` - 受信履歴取得
- `POST /api/received-faxes` - 受信FAX作成
- `POST /api/received-faxes/webhook` - Webhook受信
- `GET /api/received-faxes/[id]/summary` - AI要約生成
- `GET /api/received-faxes/[id]/context` - 文脈推測
- `GET /api/received-faxes/[id]/next-actions` - ネクストアクション

### その他
- `GET /api/backup` - バックアップ作成
- `POST /api/backup/restore` - バックアップ復元

詳細なAPI仕様は各エンドポイントのソースコードを参照してください。

## 開発

### プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── screens/          # 画面コンポーネント
│   └── ui/               # UIコンポーネント（shadcn/ui）
├── lib/                   # ユーティリティ
│   ├── prisma.ts         # Prismaクライアント
│   ├── email-service.ts  # メール送信
│   └── logger.ts         # ログ記録
└── prisma/               # Prisma設定
    └── schema.prisma     # データベーススキーマ
```

### データベースマイグレーション

```bash
# マイグレーション作成
npx prisma migrate dev --name migration_name

# Prismaクライアント生成
npx prisma generate
```

## ライセンス

MIT








