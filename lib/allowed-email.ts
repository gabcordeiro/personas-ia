/**
 * App instance for a single owner — any other Google/email account that
 * authenticates successfully with Supabase gets signed back out immediately.
 */
export const ALLOWED_EMAIL = (
  process.env.ALLOWED_EMAIL || "gcordeirocarvalho97@gmail.com"
).toLowerCase();

export function isAllowedEmail(email: string | null | undefined) {
  return !!email && email.toLowerCase() === ALLOWED_EMAIL;
}
