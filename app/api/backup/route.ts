import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// データベースのバックアップ
export async function GET(req: Request) {
  try {
    // SQLiteデータベースファイルのパスを取得
    const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
    let dbPath = dbUrl.replace("file:", "");
    
    // 相対パスの場合は絶対パスに変換
    if (!path.isAbsolute(dbPath)) {
      dbPath = path.join(process.cwd(), dbPath);
    }

    // パスの正規化（Windowsのパス区切り文字を統一）
    const normalizedDbPath = path.normalize(dbPath);

    if (!fs.existsSync(normalizedDbPath)) {
      console.error(`Database file not found at: ${normalizedDbPath}`);
      return NextResponse.json({ error: `Database file not found at: ${normalizedDbPath}` }, { status: 404 });
    }

    // バックアップファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${timestamp}.db`;
    const backupPath = path.join(process.cwd(), "backups", backupFileName);

    // バックアップディレクトリを作成
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // データベースファイルをコピー
    fs.copyFileSync(normalizedDbPath, backupPath);

    // バックアップ情報を返す
    const stats = fs.statSync(backupPath);
    return NextResponse.json({
      success: true,
      backupPath: backupPath,
      fileName: backupFileName,
      size: stats.size,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create backup:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

// バックアップ一覧を取得
export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === "list") {
      const backupDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupDir)) {
        return NextResponse.json({ backups: [] });
      }

      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith(".db"))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({ backups: files });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to list backups:", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}
