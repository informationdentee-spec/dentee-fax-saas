import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ユーザーの権限を取得
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = Number(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ロールに基づく権限を返す
    const permissions = getPermissionsByRole(user.role);

    return NextResponse.json({
      user,
      permissions,
    });
  } catch (error) {
    console.error("Failed to get user permissions:", error);
    return NextResponse.json({ error: "Failed to get user permissions" }, { status: 500 });
  }
}

// ユーザーの権限を更新
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { role } = await req.json();

    if (!["agent", "admin", "manager"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to update user permissions:", error);
    return NextResponse.json({ error: "Failed to update user permissions" }, { status: 500 });
  }
}

// ロールに基づく権限を取得
function getPermissionsByRole(role: string) {
  const basePermissions = {
    view_sent_faxes: true,
    view_received_faxes: true,
    send_fax: true,
  };

  switch (role) {
    case "admin":
      return {
        ...basePermissions,
        manage_users: true,
        manage_settings: true,
        manage_templates: true,
        export_data: true,
        backup_restore: true,
        view_all_faxes: true,
      };
    case "manager":
      return {
        ...basePermissions,
        manage_users: false,
        manage_settings: false,
        manage_templates: true,
        export_data: true,
        backup_restore: false,
        view_all_faxes: true,
      };
    case "agent":
    default:
      return {
        ...basePermissions,
        manage_users: false,
        manage_settings: false,
        manage_templates: false,
        export_data: false,
        backup_restore: false,
        view_all_faxes: false,
      };
  }
}
