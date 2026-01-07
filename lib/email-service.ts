import nodemailer from "nodemailer";

// メール送信サービス（Nodemailer使用）
// 環境変数でSMTP設定を変更可能
const createTransporter = () => {
  // 環境変数からSMTP設定を取得（デフォルトはGmail）
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";
  const smtpSecure = process.env.SMTP_SECURE === "true";

  // SendGridを使用する場合
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // 通常のSMTP設定
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body?: string;
  html?: string;
}) {
  try {
    // 環境変数が設定されていない場合はログのみ
    if (!process.env.SMTP_USER && !process.env.SENDGRID_API_KEY) {
      console.log("📨 --- メール送信シミュレーション（SMTP設定なし）---");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body || html || ""}`);
      console.log("-------------------------------------");
      return { success: true, message: "Email simulated (no SMTP config)" };
    }

    const transporter = createTransporter();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";

    const mailOptions = {
      from: `"不動産FAXクラウド" <${fromEmail}>`,
      to,
      subject,
      text: body,
      html: html || body?.replace(/\n/g, "<br>"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    // エラー時もログを出力
    console.log("📨 --- メール送信エラー（フォールバック）---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body || html || ""}`);
    console.log("-------------------------------------");
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}






// メール送信サービス（Nodemailer使用）
// 環境変数でSMTP設定を変更可能
const createTransporter = () => {
  // 環境変数からSMTP設定を取得（デフォルトはGmail）
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";
  const smtpSecure = process.env.SMTP_SECURE === "true";

  // SendGridを使用する場合
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // 通常のSMTP設定
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body?: string;
  html?: string;
}) {
  try {
    // 環境変数が設定されていない場合はログのみ
    if (!process.env.SMTP_USER && !process.env.SENDGRID_API_KEY) {
      console.log("📨 --- メール送信シミュレーション（SMTP設定なし）---");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body || html || ""}`);
      console.log("-------------------------------------");
      return { success: true, message: "Email simulated (no SMTP config)" };
    }

    const transporter = createTransporter();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";

    const mailOptions = {
      from: `"不動産FAXクラウド" <${fromEmail}>`,
      to,
      subject,
      text: body,
      html: html || body?.replace(/\n/g, "<br>"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    // エラー時もログを出力
    console.log("📨 --- メール送信エラー（フォールバック）---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body || html || ""}`);
    console.log("-------------------------------------");
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}








