import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 会社一覧取得
export async function GET() {
  const companies = await prisma.company.findMany();
  return NextResponse.json(companies);
}

// 会社新規登録
export async function POST(req: Request) {
  const data = await req.json();
  const company = await prisma.company.create({ data });
  return NextResponse.json(company);
}