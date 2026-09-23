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
