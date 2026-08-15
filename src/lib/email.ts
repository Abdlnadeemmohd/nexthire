export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

/**
 * Sends transactional email via Resend API or logs gracefully in development/fallback mode.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; status: number; id?: string }> {
  const { to, subject, html, from = process.env.FROM_EMAIL || "notifications@nexthire.cloud" } = payload;
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey && !apiKey.startsWith("re_placeholder")) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `NextHire <${from}>`,
          to: [to],
          subject,
          html,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, status: 200, id: data?.id };
      }
    } catch (err) {
      console.warn("Resend API dispatch failed, logging fallback:", err);
    }
  }

  // Development / sandbox fallback
  console.log("[NextHire Email Service] Simulated Transactional Email:");
  console.log("  To      :", to);
  console.log("  Subject :", subject);
  console.log("  From    :", from);

  return { success: true, status: 202, id: `mock-${Date.now()}` };
}

/**
 * Generates branded NextHire HTML email template
 */
export function generateEmailTemplate(title: string, message: string, ctaText?: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1f293d; border-radius: 16px; padding: 32px; }
    .header { font-size: 24px; font-weight: 800; color: #3b82f6; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px; }
    .btn { display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 13px; }
    .footer { font-size: 11px; color: #6b7280; margin-top: 32px; border-top: 1px solid #1f293d; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">NextHire</div>
    <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">${title}</h2>
    <div class="content">${message}</div>
    ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText}</a>` : ""}
    <div class="footer">
      &copy; 2026 NextHire Platform. All rights reserved.<br>
      Automated message from <a href="https://www.nexthire.cloud" style="color: #60a5fa;">https://www.nexthire.cloud</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}
