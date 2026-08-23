import { NotificationCategory, NotificationPriority } from "../events/types";

export interface EmailTemplateParams {
  title: string;
  message: string;
  recipientName?: string;
  ctaText?: string;
  ctaUrl?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  footerNote?: string;
}

export function renderBrandedEmail(params: EmailTemplateParams): string {
  const {
    title,
    message,
    recipientName = "NextHire User",
    ctaText,
    ctaUrl,
    category = "SYSTEM",
    priority = "NORMAL",
    metadata = {},
    footerNote,
  } = params;

  // Format priority colors
  let priorityColor = "#6366F1"; // indigo
  let priorityBadge = "NOTIFICATION";
  if (priority === "CRITICAL") {
    priorityColor = "#EF4444"; // red
    priorityBadge = "CRITICAL ALERT";
  } else if (priority === "IMPORTANT") {
    priorityColor = "#F59E0B"; // amber
    priorityBadge = "IMPORTANT";
  } else if (priority === "INFORMATIONAL") {
    priorityColor = "#10B981"; // emerald
    priorityBadge = "UPDATE";
  }

  // Metadata cards
  const metadataEntries = Object.entries(metadata).filter(
    ([k, v]) => v !== undefined && v !== null && typeof v !== "object"
  );

  let metadataHtml = "";
  if (metadataEntries.length > 0) {
    metadataHtml = `
      <table style="width: 100%; margin-top: 20px; border-collapse: collapse; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b; overflow: hidden;">
        <tbody>
          ${metadataEntries
            .map(
              ([key, value]) => `
            <tr>
              <td style="padding: 10px 16px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b; text-transform: capitalize; font-weight: 500;">
                ${key.replace(/([A-Z])/g, " $1")}
              </td>
              <td style="padding: 10px 16px; font-size: 13px; color: #f8fafc; border-bottom: 1px solid #1e293b; text-align: right; font-weight: 600;">
                ${String(value)}
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  // Action Button
  let ctaHtml = "";
  if (ctaText && ctaUrl) {
    const fullUrl = ctaUrl.startsWith("http")
      ? ctaUrl
      : `https://nexthire.cloud${ctaUrl.startsWith("/") ? "" : "/"}${ctaUrl}`;

    ctaHtml = `
      <div style="margin-top: 32px; text-align: center;">
        <a href="${fullUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); letter-spacing: 0.3px;">
          ${ctaText} &rarr;
        </a>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 32px 16px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="max-width: 580px; margin: 0 auto; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(11, 15, 25, 0.8) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Next<span style="color: #6366f1;">Hire</span>
              </span>
            </td>
            <td align="right">
              <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: ${priorityColor}; border-radius: 9999px; letter-spacing: 0.5px;">
                ${priorityBadge}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
          ${title}
        </h2>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-top: 0; margin-bottom: 16px;">
          Hello ${recipientName},
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0; margin-top: 0; margin-bottom: 20px;">
          ${message}
        </p>

        ${metadataHtml}

        ${ctaHtml}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #030712; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
        <p style="margin: 0 0 8px 0;">
          ${footerNote || "This is a secure transactional message from the NextHire Event & Intelligence Platform."}
        </p>
        <p style="margin: 0;">
          NextHire Inc. &bull; <a href="https://nexthire.cloud/settings" style="color: #6366f1; text-decoration: none;">Notification Preferences</a> &bull; <a href="https://nexthire.cloud/privacy" style="color: #6366f1; text-decoration: none;">Privacy Policy</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
