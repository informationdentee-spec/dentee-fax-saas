import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// データベースの復元
export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    const backupDir = path.join(process.cwd(), "backups");
    const backupPath = path.join(backupDir, fileName);
    const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./prisma/dev.db";
    const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
    }

    // 現在のデータベースをバックアップ（安全のため）
    const currentBackupPath = `${absoluteDbPath}.before-restore-${Date.now()}`;
    if (fs.existsSync(absoluteDbPath)) {
      fs.copyFileSync(absoluteDbPath, currentBackupPath);
    }

    // バックアップファイルを復元
    fs.copyFileSync(backupPath, absoluteDbPath);

    return NextResponse.json({
      success: true,
      message: "Database restored successfully",
      restoredFrom: fileName,
      currentBackup: path.basename(currentBackupPath),
    });
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
