import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

// 担当者情報の更新（名刺画像の登録など）
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idString } = await context.params;
  const id = Number(idString);

  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await request.json();

    // 更新処理
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role, // 権限
        business_card: body.business_card, // Base64画像データ
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}