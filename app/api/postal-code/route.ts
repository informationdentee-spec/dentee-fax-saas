import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postalCode = searchParams.get('postal_code');

    if (!postalCode) {
      return NextResponse.json({ error: '郵便番号が指定されていません' }, { status: 400 });
    }

    // 郵便番号をハイフンなしの7桁に統一
    const normalizedPostalCode = postalCode.replace(/[-\s]/g, '');

    if (normalizedPostalCode.length !== 7) {
      return NextResponse.json({ error: '郵便番号は7桁で入力してください' }, { status: 400 });
    }

    // 郵便番号API（郵便番号検索API）を使用
    // 例: https://zipcloud.ibsnet.co.jp/api/search
    const apiUrl = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizedPostalCode}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== 200 || !data.results || data.results.length === 0) {
        return NextResponse.json({ 
          error: '郵便番号が見つかりませんでした' 
        }, { status: 404 });
      }

      const result = data.results[0];
      return NextResponse.json({
        prefecture: result.address1, // 都道府県名
        city: result.address2, // 市区町村名
        street: result.address3 || '', // 町域名（番地を含む場合あり）
      });
    } catch (apiError) {
      console.error("Postal code API error:", apiError);
      return NextResponse.json({ 
        error: '郵便番号検索APIへの接続に失敗しました' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Postal code route error:", error);
    return NextResponse.json({ 
      error: '郵便番号検索に失敗しました' 
    }, { status: 500 });
  }
}

