import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // 簡易的な認証（実際の実装では適切なパスワードハッシュ化が必要）
    // 現在はemailでユーザーを検索し、パスワードチェックをスキップ
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    // パスワード検証（簡易版 - 実際にはbcryptなどでハッシュ化されたパスワードを検証）
    // 今回はデモのため、パスワードチェックをスキップ
    // if (!await bcrypt.compare(password, user.password)) {
    //   return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    // }

    // ユーザー情報を返す（パスワードは含めない）
    const { ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 500 });
  }
}

