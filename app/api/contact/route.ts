import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { company_name, contact_name, email, message } = await req.json();

    // バリデーション
    if (!company_name || !contact_name || !email || !message) {
      return NextResponse.json({ 
        error: 'すべての項目を入力してください' 
      }, { status: 400 });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: '有効なメールアドレスを入力してください' 
      }, { status: 400 });
    }

    // 環境変数の取得
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFrom = process.env.SENDGRID_FROM || 'info@dentee-tech.com';
    const sendGridTo = process.env.SENDGRID_TO || 'info@dentee-tech.com';

    if (!sendGridApiKey) {
      console.error('SENDGRID_API_KEY is not set');
      return NextResponse.json({ 
        error: 'メール送信の設定が正しくありません' 
      }, { status: 500 });
    }

    // メール本文の作成
    const emailBody = `会社名: ${company_name}
お名前: ${contact_name}
メール: ${email}
内容:
${message}`;

    // SendGrid API へのリクエスト
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: sendGridTo }],
          },
        ],
        from: { email: sendGridFrom },
        subject: '【Dentee】お問い合わせが届きました',
        content: [
          {
            type: 'text/plain',
            value: emailBody,
          },
        ],
      }),
    });

    // SendGrid API のレスポンスチェック
    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('SendGrid API error:', {
        status: sendGridResponse.status,
        statusText: sendGridResponse.statusText,
        error: errorText,
      });
      return NextResponse.json({ 
        error: 'メールの送信に失敗しました' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'お問い合わせを受け付けました' 
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ 
      error: 'お問い合わせの送信に失敗しました' 
    }, { status: 500 });
  }
}
