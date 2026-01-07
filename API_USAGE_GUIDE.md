# 不動産業界特化API 使用ガイド

## 概要

このドキュメントでは、Phase 1〜3で実装した不動産業界特化APIの使用方法を説明します。

## 送信側特化API

### 1. 書類テンプレート管理

#### テンプレート一覧取得
```bash
GET /api/real-estate/outbound/document-templates?category=内見申請&is_active=true
```

#### テンプレート作成
```bash
POST /api/real-estate/outbound/document-templates
Content-Type: application/json

{
  "name": "内見申請書テンプレート",
  "category": "内見申請",
  "template_type": "form",
  "content": "<html>...</html>",
  "variables": {
    "property_name": "物件名",
    "room_number": "号室"
  },
  "is_active": true
}
```

#### テンプレート更新
```bash
PUT /api/real-estate/outbound/document-templates/:id
Content-Type: application/json

{
  "name": "更新されたテンプレート名",
  "is_active": false
}
```

### 2. 自動差し込み

#### 自動差し込み実行
```bash
POST /api/real-estate/outbound/auto-fill
Content-Type: application/json

{
  "template_id": 1,
  "property_id": 1,
  "company_id": 1,
  "user_id": 1,
  "variables": {
    "custom_field": "カスタム値"
  }
}
```

**レスポンス例:**
```json
{
  "filled_content": "物件名: サンプルマンション\n号室: 101\n...",
  "variables": {
    "property_name": "サンプルマンション",
    "room_number": "101",
    "company_name": "株式会社サンプル不動産"
  }
}
```

### 3. 管理会社マスタ

#### マスタ一覧取得
```bash
GET /api/real-estate/outbound/master-companies?search=サンプル&tags=重要,自動返信対応
```

#### マスタ作成
```bash
POST /api/real-estate/outbound/master-companies
Content-Type: application/json

{
  "company_id": 1,
  "preferred_fax_number": "03-1234-5678",
  "business_hours": {
    "weekdays": "9:00-18:00",
    "weekends": "10:00-17:00"
  },
  "contact_person": "山田太郎",
  "department": "管理部",
  "tags": ["重要", "自動返信対応"],
  "auto_reply_enabled": true
}
```

### 4. 送信ログ・証跡管理

#### 監査ログ取得
```bash
GET /api/real-estate/outbound/audit-logs?fax_id=1&user_id=1&action=sent&start_date=2024-01-01&limit=50
```

### 5. 送信前プレビュー

#### プレビュー生成
```bash
POST /api/real-estate/outbound/preview
Content-Type: application/json

{
  "template_id": 1,
  "property_id": 1,
  "company_id": 1,
  "user_id": 1,
  "format": "pdf",
  "image_url": "https://example.com/image.jpg"
}
```

## 受信側特化API

### 1. 文書分類

#### 文書分類実行
```bash
POST /api/real-estate/inbound/classify
Content-Type: application/json

{
  "received_fax_id": 1
}
```

**レスポンス例:**
```json
{
  "classification": {
    "document_type": "申込書",
    "confidence": 0.9,
    "explanation": "申込, 申請が検出されました"
  }
}
```

### 2. 項目抽出

#### 項目抽出実行
```bash
POST /api/real-estate/inbound/extract-fields
Content-Type: application/json

{
  "received_fax_id": 1,
  "document_type": "申込書"
}
```

**レスポンス例:**
```json
{
  "extracted_fields": {
    "contractDate": "2024-12-25",
    "rent": "80000",
    "deposit": "160000",
    "keyMoney": "80000",
    "managementFee": "5000"
  },
  "ocr_text": "契約日: 2024年12月25日\n賃料: 80,000円\n..."
}
```

### 3. 自動振り分け

#### 振り分けルール作成
```bash
POST /api/real-estate/inbound/routing-rules
Content-Type: application/json

{
  "name": "申込書は営業部へ",
  "priority": 10,
  "conditions": {
    "document_type": "申込書"
  },
  "target_department": "営業部",
  "is_active": true
}
```

#### 自動振り分け実行
```bash
POST /api/real-estate/inbound/route
Content-Type: application/json

{
  "received_fax_id": 1,
  "urgency": "high"
}
```

### 4. 物件紐づけ

#### 物件紐づけ実行
```bash
POST /api/real-estate/inbound/match-property
Content-Type: application/json

{
  "received_fax_id": 1
}
```

**レスポンス例:**
```json
{
  "match": {
    "property_id": 1,
    "confidence": 0.95,
    "match_reason": "物件名・号室・管理会社名が一致しました"
  }
}
```

### 5. 自動返信

#### 自動返信実行
```bash
POST /api/real-estate/inbound/auto-reply
Content-Type: application/json

{
  "received_fax_id": 1
}
```

**レスポンス例:**
```json
{
  "auto_reply": true,
  "reply_content": "お申し込みありがとうございます。\n...",
  "template_id": 1
}
```

### 6. 自動印刷

#### 自動印刷実行
```bash
POST /api/real-estate/inbound/auto-print
Content-Type: application/json

{
  "received_fax_id": 1,
  "printer": "プリンター名",
  "force_print": false
}
```

### 7. アーカイブ・検索

#### アーカイブ検索
```bash
GET /api/real-estate/inbound/archive?search=サンプル&document_type=申込書&tags=重要&start_date=2024-01-01&limit=50
```

#### タグ追加
```bash
POST /api/real-estate/inbound/archive/tags
Content-Type: application/json

{
  "received_fax_id": 1,
  "tag": "重要"
}
```

## 統合フロー例

### 受信FAXの自動処理フロー

1. **受信FAX作成**（既存API）
   ```bash
   POST /api/received-faxes
   ```

2. **文書分類**
   ```bash
   POST /api/real-estate/inbound/classify
   ```

3. **項目抽出**
   ```bash
   POST /api/real-estate/inbound/extract-fields
   ```

4. **自動振り分け**
   ```bash
   POST /api/real-estate/inbound/route
   ```

5. **物件紐づけ**
   ```bash
   POST /api/real-estate/inbound/match-property
   ```

6. **自動返信**（条件に応じて）
   ```bash
   POST /api/real-estate/inbound/auto-reply
   ```

7. **自動印刷**（条件に応じて）
   ```bash
   POST /api/real-estate/inbound/auto-print
   ```

## エラーハンドリング

すべてのAPIは以下の形式でエラーを返します：

```json
{
  "error": "エラーメッセージ"
}
```

HTTPステータスコード:
- `200`: 成功
- `400`: バリデーションエラー
- `404`: リソースが見つからない
- `409`: 競合（既に存在するなど）
- `500`: サーバーエラー

## 注意事項

1. **認証**: 現在の実装では認証は含まれていません。本番環境では適切な認証を追加してください。

2. **OCR処理**: OCR処理は時間がかかる場合があります。非同期処理を検討してください。

3. **印刷処理**: 印刷処理はOSの印刷コマンドを使用します。環境に応じて設定が必要です。

4. **データベース**: すべてのAPIはPrismaを使用してデータベースにアクセスします。マイグレーションを実行してください。

## 次のステップ

1. **フロントエンド実装**: 各APIに対応するUIコンポーネントを実装
2. **認証追加**: 適切な認証・認可を実装
3. **エラーハンドリング強化**: より詳細なエラーメッセージとログ
4. **パフォーマンス最適化**: キャッシュ、非同期処理の最適化
5. **テスト**: ユニットテスト、統合テストの追加







