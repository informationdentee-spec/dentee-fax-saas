# API仕様書

## 認証

### POST /api/auth/login
ログイン

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**レスポンス:**
```json
{
  "user": {
    "id": 1,
    "name": "ユーザー名",
    "email": "user@example.com",
    "role": "agent"
  },
  "token": "jwt-token"
}
```

## FAX送信

### GET /api/faxes
送信履歴を取得

**クエリパラメータ:**
- `status` (optional): "success" | "failed" | "pending" | "scheduled"
- `start_date` (optional): ISO 8601形式の日付
- `end_date` (optional): ISO 8601形式の日付

**レスポンス:**
```json
[
  {
    "id": 1,
    "fax_number": "03-1234-5678",
    "sent_at": "2024-01-01T00:00:00Z",
    "status": "success",
    "company": { "name": "管理会社名" },
    "property": { "name": "物件名" },
    "user": { "name": "担当者名" }
  }
]
```

### POST /api/faxes
FAX送信データを登録

**リクエストボディ:**
```json
{
  "fax_number": "03-1234-5678",
  "company_name": "管理会社名",
  "property_name": "物件名",
  "room_number": "101",
  "user_id": 1,
  "image_url": "data:image/png;base64,...",
  "scheduled_at": "2024-01-01T12:00:00Z", // 予約送信の場合
  "retry_enabled": true,
  "retry_max": 3,
  "retry_interval": 60
}
```

**レスポンス:**
```json
{
  "id": 1,
  "status": "pending",
  "sent_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/faxes/generate-pdf
FAX用紙PDFを生成（名刺を含む）

**リクエストボディ:**
```json
{
  "company_name": "管理会社名",
  "fax_number": "03-1234-5678",
  "property_name": "物件名",
  "agent_name": "担当者名",
  "business_card_image": "data:image/png;base64,..." // オプション
}
```

**レスポンス:** PDFファイル（バイナリ）

### POST /api/faxes/scheduled
予約送信のFAXを処理（Cronジョブから呼び出し）

**レスポンス:**
```json
{
  "processed": 5,
  "results": [
    { "id": 1, "status": "success" },
    { "id": 2, "status": "failed" }
  ]
}
```

### GET /api/faxes/export
データをエクスポート

**クエリパラメータ:**
- `type`: "sent" | "received"
- `format`: "csv" | "json"
- `start_date` (optional): ISO 8601形式の日付
- `end_date` (optional): ISO 8601形式の日付

**レスポンス:** CSVまたはJSONファイル

## FAX受信

### GET /api/received-faxes
受信履歴を取得

**レスポンス:**
```json
[
  {
    "id": 1,
    "from_fax_number": "03-1234-5678",
    "from_company_name": "送信元会社名",
    "received_at": "2024-01-01T00:00:00Z",
    "is_read": false,
    "document_type": "内見申請",
    "urgency": "high"
  }
]
```

### POST /api/received-faxes
受信FAXを作成

**リクエストボディ:**
```json
{
  "from_fax_number": "03-1234-5678",
  "image_url": "data:image/png;base64,...",
  "received_at": "2024-01-01T00:00:00Z"
}
```

**レスポンス:**
```json
{
  "id": 1,
  "status": "received"
}
```

### POST /api/received-faxes/webhook
FAXプロバイダーからのWebhook受信

**リクエストヘッダー:**
- `x-fax-signature`: Webhook署名（オプション）

**リクエストボディ:**
```json
{
  "from": "03-1234-5678",
  "image_url": "https://...",
  "received_at": "2024-01-01T00:00:00Z"
}
```

**レスポンス:**
```json
{
  "success": true,
  "faxId": 1
}
```

### GET /api/received-faxes/[id]/summary
AI要約を生成

**レスポンス:**
```json
{
  "summary": "この受信FAXは..."
}
```

### GET /api/received-faxes/[id]/context
文脈推測を生成

**レスポンス:**
```json
{
  "prediction": {
    "predicted_type": "内見申請",
    "confidence": 85,
    "reason": "..."
  }
}
```

### GET /api/received-faxes/[id]/next-actions
ネクストアクションを生成

**レスポンス:**
```json
{
  "actions": [
    {
      "label": "受付確認を送る",
      "priority": "high",
      "icon": "Send",
      "description": "..."
    }
  ]
}
```

## 名刺テンプレート

### POST /api/business-card/generate
名刺テンプレートから画像を生成

**リクエストボディ:**
```json
{
  "template": "<html>...</html>",
  "variables": {
    "company_name": "株式会社サンプル",
    "agent_name": "山田 太郎",
    "agent_tel": "090-1234-5678",
    "agent_email": "yamada@example.com"
  }
}
```

**レスポンス:**
```json
{
  "image": "data:image/png;base64,...",
  "html": "<html>...</html>"
}
```

## バックアップ

### GET /api/backup
バックアップを作成

**レスポンス:**
```json
{
  "success": true,
  "backupPath": "./backups/backup-2024-01-01.db",
  "fileName": "backup-2024-01-01.db",
  "size": 1024000,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/backup
バックアップ一覧を取得

**リクエストボディ:**
```json
{
  "action": "list"
}
```

**レスポンス:**
```json
{
  "backups": [
    {
      "fileName": "backup-2024-01-01.db",
      "size": 1024000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/backup/restore
バックアップを復元

**リクエストボディ:**
```json
{
  "fileName": "backup-2024-01-01.db"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Database restored successfully",
  "restoredFrom": "backup-2024-01-01.db"
}
```

## エラーレスポンス

すべてのAPIエンドポイントは、エラー時に以下の形式でレスポンスを返します：

```json
{
  "error": "Error message"
}
```

HTTPステータスコード:
- `400`: バリデーションエラー
- `401`: 認証エラー
- `404`: リソースが見つからない
- `500`: サーバーエラー






## 認証

### POST /api/auth/login
ログイン

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**レスポンス:**
```json
{
  "user": {
    "id": 1,
    "name": "ユーザー名",
    "email": "user@example.com",
    "role": "agent"
  },
  "token": "jwt-token"
}
```

## FAX送信

### GET /api/faxes
送信履歴を取得

**クエリパラメータ:**
- `status` (optional): "success" | "failed" | "pending" | "scheduled"
- `start_date` (optional): ISO 8601形式の日付
- `end_date` (optional): ISO 8601形式の日付

**レスポンス:**
```json
[
  {
    "id": 1,
    "fax_number": "03-1234-5678",
    "sent_at": "2024-01-01T00:00:00Z",
    "status": "success",
    "company": { "name": "管理会社名" },
    "property": { "name": "物件名" },
    "user": { "name": "担当者名" }
  }
]
```

### POST /api/faxes
FAX送信データを登録

**リクエストボディ:**
```json
{
  "fax_number": "03-1234-5678",
  "company_name": "管理会社名",
  "property_name": "物件名",
  "room_number": "101",
  "user_id": 1,
  "image_url": "data:image/png;base64,...",
  "scheduled_at": "2024-01-01T12:00:00Z", // 予約送信の場合
  "retry_enabled": true,
  "retry_max": 3,
  "retry_interval": 60
}
```

**レスポンス:**
```json
{
  "id": 1,
  "status": "pending",
  "sent_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/faxes/generate-pdf
FAX用紙PDFを生成（名刺を含む）

**リクエストボディ:**
```json
{
  "company_name": "管理会社名",
  "fax_number": "03-1234-5678",
  "property_name": "物件名",
  "agent_name": "担当者名",
  "business_card_image": "data:image/png;base64,..." // オプション
}
```

**レスポンス:** PDFファイル（バイナリ）

### POST /api/faxes/scheduled
予約送信のFAXを処理（Cronジョブから呼び出し）

**レスポンス:**
```json
{
  "processed": 5,
  "results": [
    { "id": 1, "status": "success" },
    { "id": 2, "status": "failed" }
  ]
}
```

### GET /api/faxes/export
データをエクスポート

**クエリパラメータ:**
- `type`: "sent" | "received"
- `format`: "csv" | "json"
- `start_date` (optional): ISO 8601形式の日付
- `end_date` (optional): ISO 8601形式の日付

**レスポンス:** CSVまたはJSONファイル

## FAX受信

### GET /api/received-faxes
受信履歴を取得

**レスポンス:**
```json
[
  {
    "id": 1,
    "from_fax_number": "03-1234-5678",
    "from_company_name": "送信元会社名",
    "received_at": "2024-01-01T00:00:00Z",
    "is_read": false,
    "document_type": "内見申請",
    "urgency": "high"
  }
]
```

### POST /api/received-faxes
受信FAXを作成

**リクエストボディ:**
```json
{
  "from_fax_number": "03-1234-5678",
  "image_url": "data:image/png;base64,...",
  "received_at": "2024-01-01T00:00:00Z"
}
```

**レスポンス:**
```json
{
  "id": 1,
  "status": "received"
}
```

### POST /api/received-faxes/webhook
FAXプロバイダーからのWebhook受信

**リクエストヘッダー:**
- `x-fax-signature`: Webhook署名（オプション）

**リクエストボディ:**
```json
{
  "from": "03-1234-5678",
  "image_url": "https://...",
  "received_at": "2024-01-01T00:00:00Z"
}
```

**レスポンス:**
```json
{
  "success": true,
  "faxId": 1
}
```

### GET /api/received-faxes/[id]/summary
AI要約を生成

**レスポンス:**
```json
{
  "summary": "この受信FAXは..."
}
```

### GET /api/received-faxes/[id]/context
文脈推測を生成

**レスポンス:**
```json
{
  "prediction": {
    "predicted_type": "内見申請",
    "confidence": 85,
    "reason": "..."
  }
}
```

### GET /api/received-faxes/[id]/next-actions
ネクストアクションを生成

**レスポンス:**
```json
{
  "actions": [
    {
      "label": "受付確認を送る",
      "priority": "high",
      "icon": "Send",
      "description": "..."
    }
  ]
}
```

## 名刺テンプレート

### POST /api/business-card/generate
名刺テンプレートから画像を生成

**リクエストボディ:**
```json
{
  "template": "<html>...</html>",
  "variables": {
    "company_name": "株式会社サンプル",
    "agent_name": "山田 太郎",
    "agent_tel": "090-1234-5678",
    "agent_email": "yamada@example.com"
  }
}
```

**レスポンス:**
```json
{
  "image": "data:image/png;base64,...",
  "html": "<html>...</html>"
}
```

## バックアップ

### GET /api/backup
バックアップを作成

**レスポンス:**
```json
{
  "success": true,
  "backupPath": "./backups/backup-2024-01-01.db",
  "fileName": "backup-2024-01-01.db",
  "size": 1024000,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/backup
バックアップ一覧を取得

**リクエストボディ:**
```json
{
  "action": "list"
}
```

**レスポンス:**
```json
{
  "backups": [
    {
      "fileName": "backup-2024-01-01.db",
      "size": 1024000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/backup/restore
バックアップを復元

**リクエストボディ:**
```json
{
  "fileName": "backup-2024-01-01.db"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Database restored successfully",
  "restoredFrom": "backup-2024-01-01.db"
}
```

## エラーレスポンス

すべてのAPIエンドポイントは、エラー時に以下の形式でレスポンスを返します：

```json
{
  "error": "Error message"
}
```

HTTPステータスコード:
- `400`: バリデーションエラー
- `401`: 認証エラー
- `404`: リソースが見つからない
- `500`: サーバーエラー








