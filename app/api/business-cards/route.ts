import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 名刺一覧取得
export async function GET() {
  try {
    const businessCards = await prisma.businessCard.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json({ businessCards });
  } catch (error) {
    console.error("Failed to fetch business cards:", error);
    return NextResponse.json({ error: "Failed to fetch business cards" }, { status: 500 });
  }
}

// 名刺作成
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const businessCard = await prisma.businessCard.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        position: body.position || null,
        department: body.department || null,
        image: body.image || null,
        template_html: body.template_html || null,
        variables: body.variables ? JSON.stringify(body.variables) : null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(businessCard);
  } catch (error) {
    console.error("Failed to create business card:", error);
    return NextResponse.json({ error: "Failed to create business card" }, { status: 500 });
  }
}






