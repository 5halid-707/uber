import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// POST /api/email/notify
// Body: { to, subject, message }
// - Uses Resend if RESEND_API_KEY is available, otherwise logs to console
// - Falls back to existing nodemailer-based sendEmail helper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "to, subject, message مطلوبة" },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "noreply@uber.sa";

    // If Resend key is configured, attempt to use it
    if (resendKey && !resendKey.includes("placeholder")) {
      try {
        const html = `
          <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
            <div style="background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color:#16a34a;margin:0 0 20px;">${subject}</h2>
              <p style="font-size:16px;color:#333;line-height:1.6;white-space:pre-wrap;">${message}</p>
              <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
              <p style="font-size:12px;color:#999;text-align:center;">هذا إيميل تلقائي - لا ترد عليه</p>
            </div>
          </div>
        `;
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to,
            subject,
            html,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Resend API error:", errText);
          // Fall back to nodemailer
          const fallback = await sendEmail({ to, subject, html });
          return NextResponse.json({
            success: fallback.success,
            provider: "nodemailer_fallback",
            messageId: fallback.messageId,
          });
        }

        const data = await res.json();
        return NextResponse.json({
          success: true,
          provider: "resend",
          messageId: data.id,
        });
      } catch (err) {
        console.error("Resend request failed:", err);
        // Fall back below
      }
    }

    // Default: use existing nodemailer-based sendEmail
    const html = `
      <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
        <div style="background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color:#16a34a;margin:0 0 20px;">${subject}</h2>
          <p style="font-size:16px;color:#333;line-height:1.6;white-space:pre-wrap;">${message}</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#999;text-align:center;">هذا إيميل تلقائي - لا ترد عليه</p>
        </div>
      </div>
    `;
    const result = await sendEmail({ to, subject, html });
    return NextResponse.json({
      success: result.success,
      provider: "nodemailer",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("POST /api/email/notify error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال الإيميل" }, { status: 500 });
  }
}
