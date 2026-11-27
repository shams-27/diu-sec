export const HONEYPOT_FIELD = "website";

export function isBot(formData: FormData): boolean {
  return Boolean(String(formData.get(HONEYPOT_FIELD) ?? "").trim());
}
