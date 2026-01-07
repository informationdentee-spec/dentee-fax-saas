import { NextResponse, NextRequest } from "next/server";
import { getAuditLogs } from "@/lib/shared/audit-logger";

/**
 * 送信ログ・証跡取得
 * GET /api/real-estate/outbound/audit-logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const faxId = searchParams.get("fax_id");
    const userId = searchParams.get("user_id");
    const action = searchParams.get("action");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = searchParams.get("limit");

    const logs = await getAuditLogs({
      faxId: faxId ? Number(faxId) : undefined,
      userId: userId ? Number(userId) : undefined,
      action: action as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}







