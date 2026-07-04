import nodemailer from "nodemailer";
import { db } from "@/lib/db";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // For development: use Ethereal Email (creates test account on first use)
  // For production: use configured SMTP
  if (process.env.NODE_ENV === "production") {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: console.log instead of sending real email
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }
  return transporter;
}

type EmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: EmailParams) {
  try {
    const t = getTransporter();

    const info = await t.sendMail({
      from: `"حراج" <${process.env.SMTP_FROM || "noreply@haraj.sa"}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log(`📧 Email sent to ${to}: ${subject}`);
    // In dev mode, log the email content
    if (process.env.NODE_ENV !== "production" && info.message) {
      console.log("   Preview:", info.message.toString().substring(0, 200));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ===== EMAIL TEMPLATES =====

export function newUserRegistrationEmail(adminEmail: string, user: {
  username: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  createdAt: Date;
}) {
  return {
    to: adminEmail,
    subject: `🔔 مستخدم جديد سجّل في حراج: ${user.username}`,
    html: `
      <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #16a34a; margin: 0 0 20px;">🔔 مستخدم جديد في حراج</h1>
          <p style="font-size: 16px; color: #333;">تم تسجيل مستخدم جديد في موقعك:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">الاسم:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${user.username}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">البريد:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">الجوال:</td><td style="padding: 10px; border-bottom: 1px solid #eee;" dir="ltr">${user.phone || "غير محدد"}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">المدينة:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${user.city || "غير محدد"}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">وقت التسجيل:</td><td style="padding: 10px;">${new Date(user.createdAt).toLocaleString("ar-SA")}</td></tr>
          </table>
          <p style="font-size: 14px; color: #666;">يمكنك إدارة المستخدمين من لوحة التحكم.</p>
        </div>
      </div>
    `,
  };
}

export function welcomeEmail(user: { username: string; email: string }) {
  return {
    to: user.email,
    subject: `🎉 أهلاً بك في حراج يا ${user.username}!`,
    html: `
      <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #16a34a; margin: 0 0 20px;">🎉 أهلاً بك في حراج!</h1>
          <p style="font-size: 16px; color: #333;">مرحباً ${user.username}،</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">شكراً لتسجيلك في حراج - أكبر سوق للإعلانات المبوبة في المملكة العربية السعودية.</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">يمكنك الآن:</p>
          <ul style="font-size: 16px; color: #333; line-height: 1.8;">
            <li>نشر إعلاناتك مجاناً</li>
            <li>حفظ الإعلانات في المفضلة</li>
            <li>شحن محفظتك والدفع عبر مدى أو Apple Pay</li>
            <li>متابعة إعلاناتك وإحصائياتها</li>
          </ul>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">مع تحيات،<br>فريق حراج</p>
        </div>
      </div>
    `,
  };
}

export function transactionStatusEmail(user: { username: string; email: string }, txn: {
  type: string;
  amount: number;
  status: string;
  adminNote?: string | null;
}) {
  const isApproved = txn.status === "completed";
  const isDeposit = txn.type === "deposit";
  return {
    to: user.email,
    subject: `${isApproved ? "✅" : "❌"} ${isDeposit ? "طلب الإيداع" : "طلب السحب"} - ${isApproved ? "تمت الموافقة" : "تم الرفض"}`,
    html: `
      <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: ${isApproved ? "#16a34a" : "#dc2626"}; margin: 0 0 20px;">${isApproved ? "✅" : "❌"} ${isDeposit ? "طلب الإيداع" : "طلب السحب"}</h1>
          <p style="font-size: 16px; color: #333;">مرحباً ${user.username}،</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            ${isApproved
              ? `تم ${isDeposit ? "إضافة" : "تحويل"} <strong>${txn.amount} ريال</strong> ${isDeposit ? "لرصيدك" : "إلى حسابك البنكي"} بنجاح.`
              : `نأسف لإعلامك بأن ${isDeposit ? "طلب الإيداع" : "طلب السحب"} بقيمة <strong>${txn.amount} ريال</strong> تم رفضه.`
            }
          </p>
          ${txn.adminNote ? `<p style="font-size: 14px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">ملاحظة الأدمن: ${txn.adminNote}</p>` : ""}
          <p style="font-size: 14px; color: #666; margin-top: 30px;">مع تحيات،<br>فريق حراج</p>
        </div>
      </div>
    `,
  };
}

// Get admin email from settings or env
export async function getAdminEmail(): Promise<string> {
  const settings = await db.siteSettings.findFirst();
  return settings?.adminEmail || process.env.ADMIN_EMAIL || "admin@haraj.sa";
}
