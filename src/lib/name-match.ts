// Checks whether a bank account name plausibly belongs to the same person as a profile
// name — not an exact match. The account name may include a middle name the profile
// doesn't have (or vice versa), and the name order may differ (banks sometimes return
// "LASTNAME FIRSTNAME"). We require every meaningful profile name token to show up
// somewhere in the account name, allowing minor spelling differences.

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  // drop single-letter tokens (initials) — they're too weak to require a match on
  // and too weak to usefully match against, in either direction
  return normalize(value)
    .split(" ")
    .filter((t) => t.length >= 2);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr: number[] = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const left = curr[j - 1] ?? Infinity;
      const up = prev[j] ?? Infinity;
      const diag = prev[j - 1] ?? Infinity;
      curr[j] = Math.min(left + 1, up + 1, diag + cost);
    }
    prev = curr;
  }
  return prev[n] ?? Math.max(m, n);
}

function tokensMatch(a: string, b: string) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return levenshtein(a, b) <= 1;
}

export function namesLikelyMatch(profileName: string, accountName: string): boolean {
  const profileTokens = tokenize(profileName);
  const accountTokens = tokenize(accountName);
  if (profileTokens.length === 0 || accountTokens.length === 0) return false;

  return profileTokens.every((pt) => accountTokens.some((at) => tokensMatch(pt, at)));
}
