import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * 自動差し込み実行
 * POST /api/real-estate/outbound/auto-fill
 * 
 * 物件情報・顧客情報を自動的に差し込む
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // バリデーション
    if (!data.template_id && !data.template_content) {
      return NextResponse.json(
        { error: "template_id or template_content is required" },
        { status: 400 }
      );
    }

    let templateContent = data.template_content;
    let variables: Record<string, any> = {};

    // テンプレートIDが指定されている場合はテンプレートを取得
    if (data.template_id) {
      const template = await prisma.realEstateDocumentTemplate.findUnique({
        where: { id: Number(data.template_id) },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      templateContent = template.content;
      if (template.variables) {
        try {
          variables = JSON.parse(template.variables);
        } catch (e) {
          console.error("Failed to parse template variables:", e);
        }
      }
    }

    // 物件情報を取得
    let propertyData: any = {};
    if (data.property_id) {
      const property = await prisma.property.findUnique({
        where: { id: Number(data.property_id) },
        include: {
          company: true,
        },
      });

      if (property) {
        propertyData = {
          property_name: property.name,
          property_address: property.address,
          room_number: property.room_number,
          company_name: property.company.name,
          company_phone: property.company.phone,
          company_fax: property.company.fax,
          company_address: property.company.address,
        };
      }
    }

    // 管理会社情報を取得
    let companyData: any = {};
    if (data.company_id) {
      const company = await prisma.company.findUnique({
        where: { id: Number(data.company_id) },
      });

      if (company) {
        companyData = {
          company_name: company.name,
          company_phone: company.phone,
          company_fax: company.fax,
          company_address: company.address,
        };
      }
    }

    // ユーザー情報を取得
    let userData: any = {};
    if (data.user_id) {
      const user = await prisma.user.findUnique({
        where: { id: Number(data.user_id) },
      });

      if (user) {
        userData = {
          user_name: user.name,
          user_email: user.email,
          agent_tel: user.agent_tel,
          agent_email: user.agent_email,
        };
      }
    }

    // 変数をマージ（優先順位: リクエストデータ > 物件データ > 会社データ > ユーザーデータ）
    const mergedVariables = {
      ...userData,
      ...companyData,
      ...propertyData,
      ...data.variables, // リクエストで指定された変数が最優先
    };

    // テンプレートに変数を差し込む
    let filledContent = templateContent || "";
    
    // Handlebars風の変数置換: {{変数名}}
    for (const [key, value] of Object.entries(mergedVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      filledContent = filledContent.replace(regex, String(value || ""));
    }

    // 日付・時刻の自動挿入
    const now = new Date();
    filledContent = filledContent.replace(
      /\{\{current_date\}\}/g,
      now.toLocaleDateString("ja-JP")
    );
    filledContent = filledContent.replace(
      /\{\{current_time\}\}/g,
      now.toLocaleTimeString("ja-JP")
    );
    filledContent = filledContent.replace(
      /\{\{current_datetime\}\}/g,
      now.toLocaleString("ja-JP")
    );

    return NextResponse.json({
      filled_content: filledContent,
      variables: mergedVariables,
    });
  } catch (error) {
    console.error("Failed to auto-fill template:", error);
    return NextResponse.json(
      { error: "Failed to auto-fill template" },
      { status: 500 }
    );
  }
}







