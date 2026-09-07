/** Public base URL for building shareable links (no trailing slash). */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function clientFeedbackUrl(slug: string): string {
  return `${siteUrl()}/f/${slug}`;
}
