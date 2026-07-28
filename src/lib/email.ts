// src/lib/email.ts

/**
 * Dummy email sender used during development.
 * In production this will be replaced with a Firebase‑based implementation.
 *
 * All calls simply log the email payload to the console and resolve a
 * Promise<number> mimicking a successful send (status code 202).
 */
export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<number> {
  const { to, subject, html } = payload;
  console.log('[Dummy Email] Sending email');
  console.log('  To      :', to);
  console.log('  Subject :', subject);
  console.log('  HTML    :', html);
  // Simulate async latency
  await new Promise((r) => setTimeout(r, 100));
  // Return 202 (Accepted) as success code
  return 202;
}
