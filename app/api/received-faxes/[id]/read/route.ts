import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid fax ID" }, { status: 400 });
    }

    const updatedFax = await prisma.receivedFax.update({
      where: { id },
      data: { is_read: true }
    });

    return NextResponse.json(updatedFax);
  } catch (error) {
    console.error("Failed to mark received fax as read:", error);
    return NextResponse.json({ error: "Failed to mark received fax as read" }, { status: 500 });
  }
}
