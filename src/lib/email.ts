import { renderBrandedEmail, EmailTemplateParams } from "./email/templateEngine";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export type EmailDispatchResult = {
  success: boolean;
  status: number;
  id?: string;
  error?: string;
};

/**
 * Sends transactional email via Resend API or returns clearly typed unconfigured status.
 * Never throws an unhandled exception to ensure business transactions remain safe.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailDispatchResult> {
  const { to, subject, html, from = process.env.FROM_EMAIL || "notifications@nexthire.cloud" } = payload;
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey && !apiKey.startsWith("re_placeholder") && apiKey.trim() !== "") {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
        const data = await response.json().catch(() => ({}));
        return { success: true, status: 200, id: data?.id };
      } else {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          status: response.status,
          error: errData?.message || "Email provider rejected message",
        };
      }
    } catch (err: any) {
      console.warn("Resend API dispatch failed:", err?.message || err);
      return {
        success: false,
        status: 502,
        error: err?.message || "Email provider connection failed",
      };
    }
  }

  // Safe fallback logging when Resend email provider key is in test/dev mode
  console.log(`[NextHire Email Service] Resend dispatch in dev/fallback mode:`);
  console.log(`  To      : ${to}`);
  console.log(`  Subject : ${subject}`);
  console.log(`  From    : ${from}`);

  return {
    success: false,
    status: 503,
    error: "EMAIL_PROVIDER_NOT_CONFIGURED",
  };
}

/**
 * Generates branded NextHire HTML email template using the modular template engine.
 */
export function generateEmailTemplate(
  title: string,
  message: string,
  ctaText?: string,
  ctaUrl?: string,
  extraParams?: Partial<EmailTemplateParams>
): string {
  return renderBrandedEmail({
    title,
    message,
    ctaText,
    ctaUrl,
    ...extraParams,
  });
}
