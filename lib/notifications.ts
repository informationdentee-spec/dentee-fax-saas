import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-service";

export async function sendFaxNotification(faxId: number) {
  // FAX履歴と、関連するユーザー・管理会社・物件情報を取得
  const fax = await prisma.fax.findUnique({
    where: { id: faxId },
    include: { user: true, company: true, property: true },
  });

  // 設定情報の取得（最初の1レコードを使用）
  const settings = await prisma.settings.findFirst();

  if (!fax || !settings || !fax.user?.email) return;

  // 1. 送信成功時の通知
  if (fax.status === "success" && settings.fax_success_notify) {
    await sendEmail({
      to: fax.user.email,
      subject: "【送信完了】FAX送信のお知らせ",
      body: `${fax.property?.name || '物件'} (${fax.company?.name || '管理会社'}) へのFAX送信が成功しました。\n送信日時: ${fax.sent_at.toLocaleString()}`,
    });
  }

  // 2. 送信失敗時の通知
  if (fax.status === "failed" && settings.fax_failure_notify) {
    await sendEmail({
      to: fax.user.email,
      subject: "【送信失敗】FAX送信エラー",
      body: `${fax.property?.name || '物件'} へのFAX送信に失敗しました。マイソクを確認して再送してください。`,
    });
  }
}
