import { NextResponse } from "next/server";

// 莠育ｴ・∽ｿ｡縺ｮFAX繧貞・逅・☆繧議ron繧ｸ繝ｧ繝・
// 縺薙・繧ｨ繝ｳ繝峨・繧､繝ｳ繝医・螟夜Κ縺ｮcron繧ｵ繝ｼ繝薙せ・・ercel Cron縲；itHub Actions遲会ｼ峨°繧牙ｮ壽悄逧・↓蜻ｼ縺ｳ蜃ｺ縺輔ｌ繧区Φ螳・
export async function GET(req: Request) {
  // 隱崎ｨｼ繝√ぉ繝・け・・ron繧ｸ繝ｧ繝悶°繧峨・蜻ｼ縺ｳ蜃ｺ縺励ｒ讀懆ｨｼ・・
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 莠育ｴ・∽ｿ｡縺ｮFAX繧貞・逅・
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/faxes/scheduled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to process scheduled faxes");
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true,
      processed: data.processed,
      results: data.results 
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
