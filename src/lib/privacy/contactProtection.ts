/**
 * Utilities for detecting and masking private contact information.
 * Protects candidate email, phone numbers, WhatsApp, Telegram, external URLs, and payment handles.
 */

// Regex patterns for sensitive contact details
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SOCIAL_HANDLE_REGEX = /(wa\.me|t\.me|telegram\.me|whatsapp|linkedin\.com\/in)\/[a-zA-Z0-9._-]+/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

/**
 * Checks if a string contains direct contact details (phone, email, social messaging link).
 */
export function containsDirectContactInfo(text: string): boolean {
  if (!text) return false;
  return EMAIL_REGEX.test(text) || SOCIAL_HANDLE_REGEX.test(text);
}

/**
 * Masks an email address: e.g. "john.doe@gmail.com" -> "j***e@g***l.com"
 */
export function maskEmail(email?: string | null): string {
  if (!email) return "Protected (Hidden)";
  const parts = email.split("@");
  if (parts.length !== 2) return "Protected (Hidden)";
  const [local, domain] = parts;
  const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0].length <= 2 ? `${domainParts[0][0]}***` : `${domainParts[0][0]}***${domainParts[0][domainParts[0].length - 1]}`;
  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join(".")}`;
}

/**
 * Masks a phone number: e.g. "+44 7911 123456" -> "+44 •••• ••3456"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "Protected (Hidden)";
  const cleaned = phone.trim();
  if (cleaned.length < 4) return "••••••••";
  return `•••• ••${cleaned.slice(-4)}`;
}

/**
 * Redacts direct contact info in message content for restricted tiers.
 */
export function sanitizeMessageContent(content: string): { sanitized: string; redacted: boolean } {
  let redacted = false;
  let result = content;

  if (EMAIL_REGEX.test(result)) {
    result = result.replace(EMAIL_REGEX, "[Protected Email - Use Contact Request]");
    redacted = true;
  }

  if (SOCIAL_HANDLE_REGEX.test(result)) {
    result = result.replace(SOCIAL_HANDLE_REGEX, "[Protected Handle - Use Contact Request]");
    redacted = true;
  }

  return { sanitized: result, redacted };
}
