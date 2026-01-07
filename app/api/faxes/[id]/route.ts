import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { sendFaxNotification } from "@/utils/notifications";

// GET: 特定のFAXレコードを取得
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  
  try {
    const fax = await prisma.fax.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
        company: true
      }
    });

    if (!fax) {
      return NextResponse.json({ error: "Fax not found" }, { status: 404 });
    }

    return NextResponse.json(fax);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch fax" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  const data = await request.json();

  try {
    // 更新データの構築
    const updateData: any = {
      status: data.status,
      notes: data.notes,
      unlock_method: data.unlock_method,
    };

    // 担当者変更があれば更新
    if (data.user_id) {
      updateData.user_id = Number(data.user_id);
    }

    // 送信日時（予約日時）の変更があれば更新
    // ※「今すぐ送信(success)」の時は現在時刻、それ以外は指定された日時を使用
    if (data.status === 'success') {
      updateData.sent_at = new Date();
    } else if (data.sent_at) {
      updateData.sent_at = new Date(data.sent_at);
    }

    const updatedFax = await prisma.fax.update({
      where: { id },
      data: updateData,
      include: { user: true, property: true, company: true }
    });

    // 送信成功ステータスに変わった場合のみ通知
    if (data.status === 'success') {
      await sendFaxNotification(updatedFax.id);
    }

    return NextResponse.json(updatedFax);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETEは変更なし
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  try {
    await prisma.fax.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
