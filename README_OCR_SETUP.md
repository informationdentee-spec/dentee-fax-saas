# AI-OCR（Google Cloud Vision API）セットアップガイド

## 概要

このアプリケーションは、高精度なOCR処理のためにGoogle Cloud Vision APIを使用しています。
APIキーが設定されていない場合、自動的にTesseract.jsにフォールバックします。

## セットアップ手順

### 1. Google Cloud Platform（GCP）プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクト名を記録しておく

### 2. Vision APIの有効化

1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」に移動
2. 「Cloud Vision API」を検索
3. 「有効にする」をクリック

### 3. APIキーの作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「APIキー」を選択
3. 作成されたAPIキーをコピー
4. （推奨）APIキーの制限を設定：
   - 「APIキーを制限」をクリック
   - 「アプリケーションの制限」で「HTTPリファラー（ウェブサイト）」を選択
   - 「APIの制限」で「Cloud Vision API」のみを許可

### 4. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成（または既存のファイルを編集）し、以下を追加：

```env
GOOGLE_CLOUD_VISION_API_KEY=あなたのAPIキーをここに貼り付け
```

### 5. アプリケーションの再起動

環境変数を変更した場合は、開発サーバーを再起動してください：

```bash
npm run dev
```

## 料金について

Google Cloud Vision APIは、月間1,000リクエストまで無料です。
それ以降は、1,000リクエストあたり$1.50の料金がかかります。

詳細: https://cloud.google.com/vision/pricing

## トラブルシューティング

### APIキーが設定されていない場合

- エラーメッセージが表示されますが、自動的にTesseract.jsにフォールバックします
- 機能は正常に動作しますが、精度はAI-OCRの方が高いです

### APIキーエラーが発生する場合

1. APIキーが正しく設定されているか確認
2. Vision APIが有効になっているか確認
3. APIキーの制限設定を確認（IPアドレスやリファラーの制限がある場合）

### フォールバックが動作しない場合

- ブラウザのコンソールでエラーメッセージを確認
- ネットワーク接続を確認
- Tesseract.jsのロードに時間がかかる場合があります

## パフォーマンス

- **AI-OCR（Google Vision API）**: 通常1-3秒、高精度
- **Tesseract.js（フォールバック）**: 通常3-10秒、中程度の精度

AI-OCRは特に日本語の認識精度が高く、不動産文書の処理に適しています。







## 概要

このアプリケーションは、高精度なOCR処理のためにGoogle Cloud Vision APIを使用しています。
APIキーが設定されていない場合、自動的にTesseract.jsにフォールバックします。

## セットアップ手順

### 1. Google Cloud Platform（GCP）プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクト名を記録しておく

### 2. Vision APIの有効化

1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」に移動
2. 「Cloud Vision API」を検索
3. 「有効にする」をクリック

### 3. APIキーの作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「APIキー」を選択
3. 作成されたAPIキーをコピー
4. （推奨）APIキーの制限を設定：
   - 「APIキーを制限」をクリック
   - 「アプリケーションの制限」で「HTTPリファラー（ウェブサイト）」を選択
   - 「APIの制限」で「Cloud Vision API」のみを許可

### 4. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成（または既存のファイルを編集）し、以下を追加：

```env
GOOGLE_CLOUD_VISION_API_KEY=あなたのAPIキーをここに貼り付け
```

### 5. アプリケーションの再起動

環境変数を変更した場合は、開発サーバーを再起動してください：

```bash
npm run dev
```

## 料金について

Google Cloud Vision APIは、月間1,000リクエストまで無料です。
それ以降は、1,000リクエストあたり$1.50の料金がかかります。

詳細: https://cloud.google.com/vision/pricing

## トラブルシューティング

### APIキーが設定されていない場合

- エラーメッセージが表示されますが、自動的にTesseract.jsにフォールバックします
- 機能は正常に動作しますが、精度はAI-OCRの方が高いです

### APIキーエラーが発生する場合

1. APIキーが正しく設定されているか確認
2. Vision APIが有効になっているか確認
3. APIキーの制限設定を確認（IPアドレスやリファラーの制限がある場合）

### フォールバックが動作しない場合

- ブラウザのコンソールでエラーメッセージを確認
- ネットワーク接続を確認
- Tesseract.jsのロードに時間がかかる場合があります

## パフォーマンス

- **AI-OCR（Google Vision API）**: 通常1-3秒、高精度
- **Tesseract.js（フォールバック）**: 通常3-10秒、中程度の精度

AI-OCRは特に日本語の認識精度が高く、不動産文書の処理に適しています。









