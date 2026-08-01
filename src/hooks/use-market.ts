import { useEffect, useState } from "react";

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
};

const BIG5: { symbol: string; name: string; base: number }[] = [
  { symbol: "AAPL", name: "Apple", base: 226.41 },
  { symbol: "NVDA", name: "Nvidia", base: 132.87 },
  { symbol: "MSFT", name: "Microsoft", base: 441.2 },
  { symbol: "AMZN", name: "Amazon", base: 189.35 },
  { symbol: "GOOGL", name: "Alphabet", base: 178.62 },
  { symbol: "META", name: "Meta", base: 512.04 },
];

const MOCK: Quote[] = BIG5.map((s, i) => ({
  symbol: s.symbol,
  name: s.name,
  price: s.base,
  changePercent: [1.24, -0.86, 0.41, 2.13, -1.05, 0.68][i],
}));

/**
 * Live Big-5 quotes from Twelve Data. Falls back to mock data when the
 * VITE_TWELVE_DATA_API_KEY env var is missing or the request fails.
 */
export function useMarketQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>(MOCK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const key = import.meta.env["VITE_TWELVE_DATA_API_KEY"];
    if (!key) return;
    let cancelled = false;

    const load = async () => {
      try {
        const symbols = BIG5.map((s) => s.symbol).join(",");
        const res = await fetch(`https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${key}`);
        if (!res.ok) throw new Error("bad response");
        const json = await res.json();
        const next = BIG5.map((s) => {
          const row = json[s.symbol] ?? json;
          const price = Number(row?.close);
          const pct = Number(row?.percent_change);
          return {
            symbol: s.symbol,
            name: s.name,
            price: Number.isFinite(price) ? price : s.base,
            changePercent: Number.isFinite(pct) ? pct : 0,
          };
        });
        if (!cancelled) {
          setQuotes(next);
          setLive(true);
        }
      } catch {
        /* keep mock data */
      }
    };

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { quotes, live };
}
