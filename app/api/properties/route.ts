import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 物件一覧取得（管理会社情報も一緒に取得）
export async function GET() {
  const properties = await prisma.property.findMany({
    include: { company: true },
  });
  return NextResponse.json(properties);
}

// 物件新規登録
export async function POST(req: Request) {
  const data = await req.json();
  const property = await prisma.property.create({ data });
  return NextResponse.json(property);
}