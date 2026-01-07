import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = Number(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }
    
    const body = await req.json();
    
    // 会社が存在するか確認
    const existingCompany = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    const company = await prisma.company.update({
      where: { id },
      data: {
        name: body.name || existingCompany.name,
        address: body.address !== undefined ? body.address : existingCompany.address,
        postal_code: body.postal_code !== undefined ? body.postal_code : existingCompany.postal_code,
        prefecture: body.prefecture !== undefined ? body.prefecture : existingCompany.prefecture,
        city: body.city !== undefined ? body.city : existingCompany.city,
        street: body.street !== undefined ? body.street : existingCompany.street,
        building: body.building !== undefined ? body.building : existingCompany.building,
        email: body.email !== undefined ? body.email : existingCompany.email,
        phone: body.phone !== undefined ? body.phone : existingCompany.phone,
        license_number: body.license_number !== undefined ? body.license_number : existingCompany.license_number,
        fax: body.fax !== undefined ? body.fax : existingCompany.fax,
        holiday: body.holiday !== undefined ? body.holiday : existingCompany.holiday,
        transaction_type: body.transaction_type !== undefined ? body.transaction_type : existingCompany.transaction_type
      }
    });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Company update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update company";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
