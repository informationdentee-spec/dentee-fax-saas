import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * 管理会社マスタ更新
 * PUT /api/real-estate/outbound/master-companies/:id
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const masterCompanyId = Number(id);
    const data = await request.json();

    const updateData: any = {};
    if (data.preferred_fax_number !== undefined)
      updateData.preferred_fax_number = data.preferred_fax_number;
    if (data.business_hours !== undefined)
      updateData.business_hours = JSON.stringify(data.business_hours);
    if (data.contact_person !== undefined)
      updateData.contact_person = data.contact_person;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.auto_reply_enabled !== undefined)
      updateData.auto_reply_enabled = data.auto_reply_enabled;

    const masterCompany = await prisma.masterCompany.update({
      where: { id: masterCompanyId },
      data: updateData,
      include: {
        company: true,
      },
    });

    return NextResponse.json({ master_company: masterCompany });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Master company not found" },
        { status: 404 }
      );
    }
    console.error("Failed to update master company:", error);
    return NextResponse.json(
      { error: "Failed to update master company" },
      { status: 500 }
    );
  }
}







