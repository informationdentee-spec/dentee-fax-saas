import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// アドレス帳更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const addressId = Number(id);
    const data = await request.json();

    const address = await prisma.addressBook.update({
      where: { id: addressId },
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
    console.error("Failed to update address:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

// アドレス帳削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const addressId = Number(id);

    await prisma.addressBook.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}






