import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FAX繝・・繧ｿ縺ｮ繧ｨ繧ｯ繧ｹ繝昴・繝茨ｼ・SV蠖｢蠑擾ｼ・
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sent"; // "sent" or "received"
    const format = searchParams.get("format") || "csv"; // "csv" or "json"
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let data: any[] = [];

    if (type === "sent") {
      const where: any = {};
      if (startDate) {
        where.sent_at = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.sent_at = { ...where.sent_at, lte: new Date(endDate) };
      }

      const faxes = await prisma.fax.findMany({
        where,
        include: {
          user: true,
          company: true,
          property: true,
        },
        orderBy: { sent_at: 'desc' }
      });

      data = faxes.map(fax => ({
        騾∽ｿ｡譌･譎・ new Date(fax.sent_at).toLocaleString("ja-JP"),
        邂｡逅・ｼ夂､ｾ: fax.company?.name || "",
        迚ｩ莉ｶ蜷・ fax.property?.name || "",
        蜿ｷ螳､: fax.property?.room_number || "",
        FAX逡ｪ蜿ｷ: fax.fax_number,
        繧ｹ繝・・繧ｿ繧ｹ: fax.status,
        諡・ｽ楢・ fax.user?.name || "",
        蜀・ｦ句ｸ梧悍譌･: fax.visit_date || "",
        蜀・ｦ句ｸ梧悍譎る俣: fax.visit_time || "",
        髮ｻ隧ｱ逡ｪ蜿ｷ: fax.company_phone || "",
        蛯呵・ fax.notes || "",
      }));
    } else {
      const where: any = {};
      if (startDate) {
        where.received_at = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.received_at = { ...where.received_at, lte: new Date(endDate) };
      }

      const receivedFaxes = await prisma.receivedFax.findMany({
        where,
        orderBy: { received_at: 'desc' }
      });

      data = receivedFaxes.map(fax => ({
        蜿嶺ｿ｡譌･譎・ new Date(fax.received_at).toLocaleString("ja-JP"),
        騾∽ｿ｡蜈・ｼ夂､ｾ蜷・ fax.from_company_name || "",
        騾∽ｿ｡蜈ェAX逡ｪ蜿ｷ: fax.from_fax_number,
        迚ｩ莉ｶ蜷・ fax.property_name || "",
        蜿ｷ螳､: fax.room_number || "",
        譖ｸ鬘樒ｨｮ蛻･: fax.document_type || "",
        邱頑･蠎ｦ: fax.urgency || "",
        譌｢隱ｭ: fax.is_read ? "譌｢隱ｭ" : "譛ｪ隱ｭ",
        蛯呵・ fax.notes || "",
      }));
    }

    if (format === "json") {
      return NextResponse.json(data, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="fax-export-${type}-${Date.now()}.json"`,
        },
      });
    }

    // CSV蠖｢蠑上〒霑斐☆
    if (data.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // CSV繧ｨ繧ｹ繧ｱ繝ｼ繝怜・逅・
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(",")
      )
    ];

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fax-export-${type}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export fax data:", error);
    return NextResponse.json({ error: "Failed to export fax data" }, { status: 500 });
  }
}
