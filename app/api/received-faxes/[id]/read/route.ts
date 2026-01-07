import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const idNumber = Number(id);

    if (isNaN(idNumber)) {
      return NextResponse.json({ error: "Invalid fax ID" }, { status: 400 });
    }

    const updatedFax = await prisma.receivedFax.update({
      where: { id: idNumber },
      data: { is_read: true }
    });

    return NextResponse.json(updatedFax);
  } catch (error) {
    console.error("Failed to mark received fax as read:", error);
    return NextResponse.json({ error: "Failed to mark received fax as read" }, { status: 500 });
  }
}
