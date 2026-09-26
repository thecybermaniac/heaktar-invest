// Search engines and link-preview crawlers (Facebook, Twitter/X, WhatsApp, Telegram,
// Slack, Discord, iMessage, LinkedIn) need to fetch pages to read their <head> tags —
// og:title/description/image — for search results and share-link cards. Most of these
// bots' User-Agents don't look anything like a phone (some do, e.g. Googlebot's mobile
// crawler, which already passes isPhoneUserAgent below), so without this allowlist the
// device gate in start.ts would 403 them and every shared link would show the generic
// "use your phone" page instead of the real banner/description.
const CRAWLER_UA_PATTERN =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|applebot|facebookexternalhit|facebookcatalog|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|pinterest|redditbot|skypeuripreview|vkshare|w3c_validator/i;

export function isCrawlerUserAgent(userAgent: string): boolean {
  return !!userAgent && CRAWLER_UA_PATTERN.test(userAgent);
}

// Best-effort phone detection from a User-Agent string. There is no fully reliable way
// to tell "phone" apart from "tablet" or "desktop" server-side — a spoofed header always
// gets through, and modern iPadOS Safari requests a desktop UA indistinguishable from a
// Mac by default — but this covers the vast majority of real phone browsers while
// excluding tablets, which is the distinction that matters here:
//   - iPhone / iPod / Windows Phone tokens are always a phone.
//   - Android carries "Mobile" in the UA on phones but not on tablets, so require both.
export function isPhoneUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  if (/iPhone|iPod|Windows Phone/i.test(userAgent)) return true;
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return false;
  return /Android/i.test(userAgent) && /Mobile/i.test(userAgent);
}
