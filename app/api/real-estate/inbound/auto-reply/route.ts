import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * 自動返信実行
 * POST /api/real-estate/inbound/auto-reply
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // バリデーション
    if (!data.received_fax_id) {
      return NextResponse.json(
        { error: "received_fax_id is required" },
        { status: 400 }
      );
    }

    // 受信FAX情報を取得
    const receivedFax = await prisma.receivedFax.findUnique({
      where: { id: Number(data.received_fax_id) },
      include: {
        classification: true,
      },
    });

    if (!receivedFax) {
      return NextResponse.json(
        { error: "Received fax not found" },
        { status: 404 }
      );
    }

    // 管理会社マスタを取得（自動返信が有効かチェック）
    let masterCompany = null;
    if (receivedFax.from_company_name) {
      const company = await prisma.company.findFirst({
        where: {
          name: { contains: receivedFax.from_company_name },
        },
      });

      if (company) {
        masterCompany = await prisma.masterCompany.findUnique({
          where: { company_id: company.id },
        });
      }
    }

    // 自動返信が無効の場合はスキップ
    if (!masterCompany || !masterCompany.auto_reply_enabled) {
      return NextResponse.json({
        auto_reply: false,
        reason: "自動返信が無効です",
      });
    }

    // 分類情報から自動返信テンプレートを検索
    const documentType =
      receivedFax.classification?.document_type ||
      receivedFax.document_type ||
      "その他";

    const autoReplyTemplate = await prisma.autoReplyTemplate.findFirst({
      where: {
        trigger_type: documentType,
        is_active: true,
      },
    });

    if (!autoReplyTemplate) {
      return NextResponse.json({
        auto_reply: false,
        reason: "該当する自動返信テンプレートが見つかりませんでした",
      });
    }

    // テンプレートに変数を差し込む
    let replyContent = autoReplyTemplate.template_content;

    // 変数を取得
    let variables: Record<string, any> = {};
    if (autoReplyTemplate.template_variables) {
      try {
        variables = JSON.parse(autoReplyTemplate.template_variables);
      } catch (e) {
        console.error("Failed to parse template variables:", e);
      }
    }

    // 受信FAX情報を変数に追加
    variables = {
      ...variables,
      from_company_name: receivedFax.from_company_name || "",
      property_name: receivedFax.property_name || "",
      room_number: receivedFax.room_number || "",
      received_at: receivedFax.received_at.toLocaleString("ja-JP"),
    };

    // 変数を差し込む
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      replyContent = replyContent.replace(regex, String(value || ""));
    }

    // 自動返信FAXを作成（実際の送信は別途実装が必要）
    // TODO: 実際のFAX送信処理を実装

    return NextResponse.json({
      auto_reply: true,
      reply_content: replyContent,
      template_id: autoReplyTemplate.id,
    });
  } catch (error) {
    console.error("Failed to auto-reply:", error);
    return NextResponse.json(
      { error: "Failed to auto-reply" },
      { status: 500 }
    );
  }
}







