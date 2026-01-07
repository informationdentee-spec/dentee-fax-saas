import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// アドレス帳の連絡先に関連するやり取り履歴を取得
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addressId = Number(id);

    // アドレス情報を取得
    const address = await prisma.addressBook.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // 送信履歴を取得（FAX番号で検索）
    const sentFaxes = await prisma.fax.findMany({
      where: {
        fax_number: address.fax_number,
      },
      include: {
        user: true,
        company: true,
        property: true,
      },
      orderBy: { sent_at: 'desc' },
      take: 50,
    });

    // 受信履歴を取得（FAX番号または会社名で検索）
    const receivedFaxes = await prisma.receivedFax.findMany({
      where: {
        OR: [
          { from_fax_number: address.fax_number },
          { from_company_name: { contains: address.name } },
        ],
      },
      orderBy: { received_at: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      address,
      sentFaxes,
      receivedFaxes,
    });
  } catch (error) {
    console.error("Failed to fetch address history:", error);
    return NextResponse.json({ error: "Failed to fetch address history" }, { status: 500 });
  }
}






