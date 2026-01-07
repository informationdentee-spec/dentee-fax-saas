import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * タグ追加
 * POST /api/real-estate/inbound/archive/tags
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // バリデーション
    if (!data.received_fax_id || !data.tag) {
      return NextResponse.json(
        { error: "received_fax_id and tag are required" },
        { status: 400 }
      );
    }

    // タグを追加（重複チェック付き）
    const tag = await prisma.receivedFaxTag.create({
      data: {
        received_fax_id: Number(data.received_fax_id),
        tag: data.tag,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }
    console.error("Failed to add tag:", error);
    return NextResponse.json({ error: "Failed to add tag" }, { status: 500 });
  }
}







