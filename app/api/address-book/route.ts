import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// アドレス帳一覧取得
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const favorite = searchParams.get("favorite");

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { fax_number: { contains: search } },
        { phone: { contains: search } },
        { contact_person: { contains: search } },
      ];
    }
    
    if (tag) {
      where.tags = { contains: tag };
    }
    
    if (favorite === "true") {
      where.is_favorite = true;
    }

    const addresses = await prisma.addressBook.findMany({
      where,
      orderBy: [
        { is_favorite: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Failed to fetch address book:", error);
    return NextResponse.json({ error: "Failed to fetch address book" }, { status: 500 });
  }
}

// アドレス帳追加
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Prisma Clientのデバッグ情報
    console.log("Prisma Client keys:", Object.keys(prisma));
    console.log("addressBook exists:", 'addressBook' in prisma);
    console.log("prisma.addressBook:", prisma.addressBook);
    
    if (!prisma.addressBook) {
      console.error("Prisma Client does not have addressBook model");
      return NextResponse.json({ 
        error: "Prisma Client not updated. Please restart the dev server after running 'npx prisma generate'",
        debug: {
          prismaKeys: Object.keys(prisma),
          hasAddressBook: 'addressBook' in prisma
        }
      }, { status: 500 });
    }
    
    const address = await prisma.addressBook.create({
      data: {
        name: data.name,
        fax_number: data.fax_number,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        contact_person: data.contact_person || null,
        notes: data.notes || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        is_favorite: data.is_favorite || false,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("Failed to create address:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

