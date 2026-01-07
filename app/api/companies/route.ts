import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

// 会社一覧取得
export async function GET(request: NextRequest) {
  const companies = await prisma.company.findMany();
  return NextResponse.json(companies);
}

// 会社新規登録
export async function POST(request: NextRequest) {
  const data = await request.json();
  const company = await prisma.company.create({ data });
  return NextResponse.json(company);
}