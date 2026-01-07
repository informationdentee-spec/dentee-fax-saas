import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// 物件一覧取得（管理会社情報も一緒に取得）
export async function GET(request: NextRequest) {
  const properties = await prisma.property.findMany({
    include: { company: true },
  });
  return NextResponse.json(properties);
}

// 物件新規登録
export async function POST(request: NextRequest) {
  const data = await request.json();
  const property = await prisma.property.create({ data });
  return NextResponse.json(property);
}