import nodemailer from "nodemailer";
import { db } from "@/lib/db";

// Create reusable transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // If SMTP credentials are configured (not placeholder), use real SMTP
  if (smtpUser && smtpPass && !smtpPass.includes("YOUR_") && !smtpPass.includes("ethereal")) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // For Gmail - improve deliverability
      tls: {
        rejectUnauthorized: true,
      },
    });
    console.log("📧 Email service: Using real SMTP (" + smtpUser + ")");
  } else {
    // Development/test mode: use stream transport (logs to console)
    console.log("📧 Email service: Using test mode (logs to console)");
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
      from: `"أوبر" <${process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@uber.sa"}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log(`📧 Email sent to ${to}: ${subject}`);
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
    subject: `🔔 مستخدم جديد سجّل في أوبر: ${user.username}`,
    html: `
      <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px;">ح</h1>
            <p style="color: #16a34a; margin: 5px 0 0;">أوبر</p>
          </div>
          <h2 style="color: #16a34a; margin: 0 0 20px;">🔔 مستخدم جديد في موقعك</h2>
          <p style="font-size: 16px; color: #333;">تم تسجيل مستخدم جديد في موقع أوبر:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9f9f9; border-radius: 8px;">
            <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">الاسم:</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${user.username}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">البريد:</td><td style="padding: 12px; border-bottom: 1px solid #eee;" dir="ltr">${user.email}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">الجوال:</td><td style="padding: 12px; border-bottom: 1px solid #eee;" dir="ltr">${user.phone || "غير محدد"}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">المدينة:</td><td style="padding: 12px; border-bottom: 1px solid #eee;">${user.city || "غير محدد"}</td></tr>
            <tr><td style="padding: 12px; font-weight: bold;">وقت التسجيل:</td><td style="padding: 12px;">${new Date(user.createdAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</td></tr>
          </table>
          <p style="font-size: 14px; color: #666;">يمكنك إدارة المستخدمين من لوحة التحكم.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">هذا إيميل تلقائي من موقع أوبر - لا ترد عليه</p>
        </div>
      </div>
    `,
  };
}

export function welcomeEmail(user: { username: string; email: string }) {
  return {
    to: user.email,
    subject: `🎉 أهلاً بك في أوبر يا ${user.username}!`,
    html: `
      <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 36px;">ح</h1>
            <p style="color: #16a34a; margin: 5px 0 0; font-size: 18px;">أوبر</p>
          </div>
          <h2 style="color: #16a34a; margin: 0 0 20px;">🎉 أهلاً بك في أوبر!</h2>
          <p style="font-size: 16px; color: #333;">مرحباً ${user.username}،</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">شكراً لتسجيلك في أوبر - أكبر سوق للإعلانات المبوبة في المملكة العربية السعودية.</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">يمكنك الآن:</p>
          <ul style="font-size: 16px; color: #333; line-height: 1.8; padding-right: 20px;">
            <li>نشر إعلاناتك مجاناً</li>
            <li>حفظ الإعلانات في المفضلة</li>
            <li>شحن محفظتك والدفع عبر مدى أو Apple Pay</li>
            <li>متابعة إعلاناتك وإحصائياتها</li>
            <li>كسب العمولات عبر دعوة أصدقائك</li>
          </ul>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #16a34a;">
            <p style="margin: 0; font-size: 14px; color: #15803d;">💡 نصيحة: أضف صوراً عالية الجودة لإعلاناتك لتحصل على مشاهدات أكثر</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">مع تحيات،<br>فريق أوبر</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">هذا إيميل تلقائي من موقع أوبر - لا ترد عليه</p>
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
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 36px;">ح</h1>
            <p style="color: #16a34a; margin: 5px 0 0; font-size: 18px;">أوبر</p>
          </div>
          <h2 style="color: ${isApproved ? "#16a34a" : "#dc2626"}; margin: 0 0 20px;">${isApproved ? "✅" : "❌"} ${isDeposit ? "طلب الإيداع" : "طلب السحب"}</h2>
          <p style="font-size: 16px; color: #333;">مرحباً ${user.username}،</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            ${isApproved
              ? `تم ${isDeposit ? "إضافة" : "تحويل"} <strong style="color: #16a34a;">${txn.amount} ريال</strong> ${isDeposit ? "لرصيدك" : "إلى حسابك البنكي"} بنجاح.`
              : `نأسف لإعلامك بأن ${isDeposit ? "طلب الإيداع" : "طلب السحب"} بقيمة <strong style="color: #dc2626;">${txn.amount} ريال</strong> تم رفضه.`
            }
          </p>
          ${txn.adminNote ? `<div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin: 15px 0; border-right: 4px solid #f59e0b;"><p style="margin: 0; font-size: 14px; color: #92400e;"><strong>ملاحظة الأدمن:</strong> ${txn.adminNote}</p></div>` : ""}
          <p style="font-size: 14px; color: #666; margin-top: 30px;">مع تحيات،<br>فريق أوبر</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">هذا إيميل تلقائي من موقع أوبر - لا ترد عليه</p>
        </div>
      </div>
    `,
  };
}

// Get admin email from settings or env
export async function getAdminEmail(): Promise<string> {
  try {
    const settings = await db.siteSettings.findFirst();
    if (settings?.adminEmail) return settings.adminEmail;
  } catch {}
  return process.env.ADMIN_EMAIL || "grouthhacker@gmail.com";
}
