import { NextResponse } from 'next/server';

/**
 * Google Cloud Vision APIを使用したOCR処理
 * 環境変数 GOOGLE_CLOUD_VISION_API_KEY が必要です
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: '画像ファイルが提供されていません' }, { status: 400 });
    }

    // APIキーの確認
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google Cloud Vision APIキーが設定されていません。環境変数 GOOGLE_CLOUD_VISION_API_KEY を設定してください。',
        fallback: true 
      }, { status: 500 });
    }

    // 画像をBase64に変換
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // Google Cloud Vision APIを呼び出し
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ['ja', 'en'], // 日本語と英語を優先
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Vision API Error:', errorData);
      
      // APIキーエラーの場合
      if (response.status === 400 || response.status === 403) {
        return NextResponse.json({ 
          error: 'Google Cloud Vision APIの認証に失敗しました。APIキーを確認してください。',
          fallback: true 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: `Google Vision APIエラー: ${errorData.error?.message || '不明なエラー'}`,
        fallback: true 
      }, { status: 500 });
    }

    const data = await response.json();
    
    // テキストを抽出
    const annotations = data.responses?.[0]?.textAnnotations;
    if (!annotations || annotations.length === 0) {
      return NextResponse.json({ 
        text: '',
        error: 'テキストが検出されませんでした',
        fallback: true 
      });
    }

    // 最初のアノテーションが全文、残りが個別の単語
    const fullText = annotations[0].description || '';
    
    return NextResponse.json({ 
      text: fullText,
      annotations: annotations.slice(1), // 個別の単語情報も返す（位置情報など）
    });

  } catch (error) {
    console.error('OCR Vision API Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'OCR処理中にエラーが発生しました',
      fallback: true 
    }, { status: 500 });
  }
}

