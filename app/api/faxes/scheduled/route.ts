import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 予約送信のFAXを取得して送信処理を実行（cronジョブから呼び出される想定）
export async function POST(req: Request) {
  try {
    const now = new Date();
    // 送信予定時刻が現在時刻より前の予約送信を取得
    const scheduledFaxes = await prisma.fax.findMany({
      where: {
        status: "scheduled",
        scheduled_at: {
          lte: now
        }
      },
      include: {
        user: true,
        property: true,
        company: true
      }
    });

    const results = [];
    for (const fax of scheduledFaxes) {
      try {
        // 実際のFAX送信処理を実行
        // PDFを生成してFAXプロバイダーに送信
        let sendSuccess = false;
        try {
          // PDFを生成
          const pdfRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/faxes/generate-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fax_number: fax.fax_number,
              company_name: fax.company?.name || "",
              property_name: fax.property?.name || "",
              agent_name: fax.user?.name || "",
              image_url: fax.image_url,
            }),
          });

          if (pdfRes.ok) {
            const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
            
            // FAXプロバイダーに送信（構造は実装済み、実際のAPI呼び出しはTODO）
            // const { createFaxProvider } = await import("@/lib/fax-provider");
            // const provider = createFaxProvider();
            // const result = await provider.sendFax({
            //   to: fax.fax_number,
            //   pdfBuffer: pdfBuffer,
            // });
            // sendSuccess = result.success;

            // モック実装
            sendSuccess = true;
          }
        } catch (error) {
          console.error(`Failed to send fax ${fax.id}:`, error);
          sendSuccess = false;
        }
        
        if (sendSuccess) {
          await prisma.fax.update({
            where: { id: fax.id },
            data: {
              status: "success",
              sent_at: now
            }
          });
          results.push({ id: fax.id, status: "success" });
        } else {
          // リトライが有効な場合はリトライ回数を更新
          if (fax.retry_enabled && fax.retry_count < fax.retry_max) {
            await prisma.fax.update({
              where: { id: fax.id },
              data: {
                retry_count: fax.retry_count + 1,
                scheduled_at: new Date(now.getTime() + fax.retry_interval * 1000) // リトライ間隔後に再送信
              }
            });
            results.push({ id: fax.id, status: "retry_scheduled" });
          } else {
            await prisma.fax.update({
              where: { id: fax.id },
              data: {
                status: "failed"
              }
            });
            results.push({ id: fax.id, status: "failed" });
          }
        }
      } catch (error) {
        console.error(`Failed to send scheduled fax ${fax.id}:`, error);
        results.push({ id: fax.id, status: "error", error: String(error) });
      }
    }

    return NextResponse.json({ 
      processed: scheduledFaxes.length,
      results 
    });
  } catch (error) {
    console.error("Scheduled fax processing error:", error);
    return NextResponse.json({ error: "Failed to process scheduled faxes" }, { status: 500 });
  }
}




// 予約送信のFAXを取得して送信処理を実行（cronジョブから呼び出される想定）
export async function POST(req: Request) {
  try {
    const now = new Date();
    // 送信予定時刻が現在時刻より前の予約送信を取得
    const scheduledFaxes = await prisma.fax.findMany({
      where: {
        status: "scheduled",
        scheduled_at: {
          lte: now
        }
      },
      include: {
        user: true,
        property: true,
        company: true
      }
    });

    const results = [];
    for (const fax of scheduledFaxes) {
      try {
        // 実際のFAX送信処理を実行
        // PDFを生成してFAXプロバイダーに送信
        let sendSuccess = false;
        try {
          // PDFを生成
          const pdfRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/faxes/generate-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fax_number: fax.fax_number,
              company_name: fax.company?.name || "",
              property_name: fax.property?.name || "",
              agent_name: fax.user?.name || "",
              image_url: fax.image_url,
            }),
          });

          if (pdfRes.ok) {
            const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
            
            // FAXプロバイダーに送信（構造は実装済み、実際のAPI呼び出しはTODO）
            // const { createFaxProvider } = await import("@/lib/fax-provider");
            // const provider = createFaxProvider();
            // const result = await provider.sendFax({
            //   to: fax.fax_number,
            //   pdfBuffer: pdfBuffer,
            // });
            // sendSuccess = result.success;

            // モック実装
            sendSuccess = true;
          }
        } catch (error) {
          console.error(`Failed to send fax ${fax.id}:`, error);
          sendSuccess = false;
        }
        
        if (sendSuccess) {
          await prisma.fax.update({
            where: { id: fax.id },
            data: {
              status: "success",
              sent_at: now
            }
          });
          results.push({ id: fax.id, status: "success" });
        } else {
          // リトライが有効な場合はリトライ回数を更新
          if (fax.retry_enabled && fax.retry_count < fax.retry_max) {
            await prisma.fax.update({
              where: { id: fax.id },
              data: {
                retry_count: fax.retry_count + 1,
                scheduled_at: new Date(now.getTime() + fax.retry_interval * 1000) // リトライ間隔後に再送信
              }
            });
            results.push({ id: fax.id, status: "retry_scheduled" });
          } else {
            await prisma.fax.update({
              where: { id: fax.id },
              data: {
                status: "failed"
              }
            });
            results.push({ id: fax.id, status: "failed" });
          }
        }
      } catch (error) {
        console.error(`Failed to send scheduled fax ${fax.id}:`, error);
        results.push({ id: fax.id, status: "error", error: String(error) });
      }
    }

    return NextResponse.json({ 
      processed: scheduledFaxes.length,
      results 
    });
  } catch (error) {
    console.error("Scheduled fax processing error:", error);
    return NextResponse.json({ error: "Failed to process scheduled faxes" }, { status: 500 });
  }
}


