import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.faxTemplate.findMany({
      orderBy: [
        { is_default: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    // テーブルが存在しない場合は空配列を返す
    return NextResponse.json({ templates: [] });
  }
}

// テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const template = await prisma.faxTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        content: data.content,
        is_default: data.is_default || false,
      }
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
