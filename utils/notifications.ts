import { prisma } from "@/lib/prisma";

// ダミーのメール送信関数（実際はSendGridなどを使う場所）
async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  console.log("📨 --- メール送信シミュレーション ---");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  console.log("-----------------------------------");
}

export async function sendFaxNotification(faxId: number) {
  // 送信されたFAX情報と、現在の設定を取得
  const fax = await prisma.fax.findUnique({
    where: { id: faxId },
    include: { user: true, company: true, property: true },
  });

  const settings = await prisma.settings.findFirst();

  if (!fax || !settings) return;

  // 成功通知（設定がONの場合のみ）
  if (fax.status === "success" && settings.fax_success) {
    await sendEmail({
      to: fax.user.email,
      subject: "【送信完了】内見依頼書のFAX送信が完了しました",
      body: `${fax.property.name} (${fax.company.name}) へのFAX送信が成功しました。\n\n管理会社へ電話連絡をお願いします。\n電話番号: ${fax.company.phone || "不明"}`,
    });
  }

  // 失敗通知（設定がONの場合のみ）
  if (fax.status === "failed" && settings.fax_failure) {
    await sendEmail({
      to: fax.user.email,
      subject: "【送信失敗】FAX送信に失敗しました",
      body: `${fax.property.name} (${fax.company.name}) へのFAX送信が失敗しました。\n設定や番号を確認して再送してください。`,
    });
  }
}