// =====================================================================
// Market data service — real, web-sourced market information.
// ---------------------------------------------------------------------
// IMPORTANT / honest disclosure:
//   This sandbox does not ship a paid market-data API key, so we source
//   market information through the `web_search` skill (real web results)
//   and cache parsed figures in StockSnapshot with a TTL. This is NOT
//   real-time tick data; treat it as "latest publicly available summary".
//   Every snapshot stores its `source` and `fetchedAt` so the UI can show
//   provenance and staleness transparently.
//
//   To upgrade to a real provider (Alpha Vantage, Finnhub, Yahoo Finance,
//   Tiingo, NSE/BSE): replace `fetchSnapshot` to call that provider and
//   populate the same StockSnapshot fields. The rest of the app stays the
//   same.
// =====================================================================

import { db } from "@/lib/db";
import { getZai } from "@/lib/zai";
import type { Company, StockSnapshot } from "@prisma/client";

// Cache TTL — 30 minutes. Stale snapshots are still shown (with a badge)
// but re-fetched on explicit refresh or after expiry.
const TTL_MS = 30 * 60 * 1000;

// A curated directory of popular tickers so the browse/search experience
// works even before any market fetch. Users can still search for any
// symbol and we'll create the Company row lazily.
export const SEED_COMPANIES: { symbol: string; name: string; exchange: string; sector: string; industry?: string }[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", industry: "Consumer Electronics" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Software" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Internet Retail" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors" },
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", exchange: "NYSE", sector: "Financial Services", industry: "Insurance" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", sector: "Financial Services", industry: "Banks" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE", sector: "Financial Services", industry: "Credit Services" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", sector: "Healthcare", industry: "Drug Manufacturers" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", sector: "Consumer Defensive", industry: "Discount Stores" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", exchange: "NSE", sector: "Energy", industry: "Oil & Gas Integrated" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd", exchange: "NSE", sector: "Technology", industry: "IT Services" },
  { symbol: "INFY.NS", name: "Infosys Ltd", exchange: "NSE", sector: "Technology", industry: "IT Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE", sector: "Financial Services", industry: "Banks" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
];

// Seed the directory once (idempotent).
export async function seedCompanies() {
  for (const c of SEED_COMPANIES) {
    await db.company.upsert({
      where: { symbol: c.symbol },
      update: {},
      create: c,
    });
  }
}

// Find a company by symbol, creating it lazily if needed.
export async function findOrCreateCompany(symbol: string, name?: string) {
  const sym = symbol.trim().toUpperCase();
  const existing = await db.company.findUnique({ where: { symbol: sym } });
  if (existing) return existing;
  return db.company.create({
    data: { symbol: sym, name: name ?? sym, exchange: null, sector: null },
  });
}

// ---------------------------------------------------------------------
// Targeted field parsers. We look for labelled figures ("P/E ratio",
// "Market Cap", "valued at $X") rather than grabbing the first number,
// so we don't confuse a date ("18 hours ago") with a price. Missing
// fields stay null — we never invent figures.
// ---------------------------------------------------------------------
function firstDollarAmount(s: string): number | null {
  // Prefer "valued at $X" / "price $X"; fall back to first $ amount.
  const patterns = [
    /valued at \$([\d,]+(?:\.\d+)?)/i,
    /price[:\s]+\$([\d,]+(?:\.\d+)?)/i,
    /\$([\d,]{3,}(?:\.\d+)?)/, // $ + at least 3 digits to avoid "$1"
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return parseFloat(m[1].replace(/,/g, ""));
  }
  return null;
}

function parseMarketCap(s: string): number | null {
  const m = s.match(/market\s?cap[^.\d]*?([\d.]+)\s?(T|Trillion|B|Bn|Billion|M|Mn|Million|K|Cr|Lakh)/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  if (u.startsWith("t")) n *= 1e12;
  else if (u.startsWith("b")) n *= 1e9;
  else if (u.startsWith("m")) n *= 1e6;
  else if (u.startsWith("k")) n *= 1e3;
  else if (u === "cr") n *= 1e7;
  else if (u === "lakh") n *= 1e5;
  return n;
}

function parsePeRatio(s: string): number | null {
  const m = s.match(/p\/e\s?(?:ratio)?[^.\d]*?(\d{1,3}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

function parseEps(s: string): number | null {
  const m = s.match(/eps[^.\d$]*?\$?\s?(-?\d{1,3}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

function parse52High(s: string): number | null {
  // "52 Week High351.73" or "52-Week High 351.73"
  const m = s.match(/52[\s-]?week\s?high[^.\d]*?(\d{1,4}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}
function parse52Low(s: string): number | null {
  const m = s.match(/52[\s-]?week\s?low[^.\d]*?(\d{1,4}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

function parseDividendYield(s: string): number | null {
  const m = s.match(/dividend yield[^.\d]*?(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

// Change percent: prefer "(+1.23%)" or "Change 1.23%" over a bare %. We use
// a word boundary (\b) so "change" inside "exchange" can't trigger a match.
// We also reject implausible magnitudes (>25%) since daily moves are rarely
// that large — better to show null than a misleading figure.
function parseChangePercent(s: string): number | null {
  const m =
    s.match(/\(([+-]?\d+(?:\.\d+)?)\s?%\)/i) ??
    s.match(/\bchange\b[^.\d%]*?([+-]?\d+(?:\.\d+)?)\s?%/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (Math.abs(v) > 25) return null;
  return v;
}

// ---------------------------------------------------------------------
// Fetch a fresh snapshot via web_search. We do 1 search with a focused
// query and parse the aggregated snippets. Each figure is best-effort;
// missing fields stay null rather than being invented.
// ---------------------------------------------------------------------
export async function fetchSnapshot(company: Company): Promise<StockSnapshot> {
  const zai = await getZai();
  const symbol = company.symbol;
  const name = company.name;

  // The web-search backend occasionally returns "no results" for very long
  // queries. We try a detailed query first; on failure we fall back to a
  // shorter, higher-signal query so a single provider hiccup doesn't blank
  // the whole snapshot.
  const queries = [
    `${name} (${symbol}) stock price market cap PE ratio EPS 52 week high low`,
    `${name} ${symbol} stock price today`,
    `${symbol} stock quote fundamentals`,
  ];
  let results: unknown[] = [];
  let lastError: Error | null = null;
  for (const q of queries) {
    try {
      const r = await zai.functions.invoke("web_search", { query: q, num: 8 });
      if (Array.isArray(r) && r.length) { results = r; break; }
    } catch (err) {
      lastError = err as Error;
      // try next query
    }
  }
  // If every query returned nothing, surface the error so the caller can
  // fall back to a stale cached snapshot.
  if (results.length === 0 && lastError) throw lastError;

  const text = (Array.isArray(results) ? results : [])
    .map((r: { name?: string; snippet?: string }) => `${r.name ?? ""}. ${r.snippet ?? ""}`)
    .join(" | ");

  const price = firstDollarAmount(text);
  const marketCap = parseMarketCap(text);
  const peRatio = parsePeRatio(text);
  const eps = parseEps(text);
  const week52High = parse52High(text);
  const week52Low = parse52Low(text);
  const changePercent = parseChangePercent(text);
  const dividendYield = parseDividendYield(text);

  // Short human-readable summary built only from search snippets.
  const summary =
    (Array.isArray(results) && results.length
      ? results.slice(0, 3).map((r: { name?: string; snippet?: string }) => r.snippet?.slice(0, 200)).filter(Boolean).join(" ")
      : "No public summary available from search results.");

  const snap = await db.stockSnapshot.create({
    data: {
      companyId: company.id,
      source: "web_search",
      price: price ?? null,
      change: null,
      changePercent: changePercent ?? null,
      currency: symbol.endsWith(".NS") ? "INR" : "USD",
      marketCap: marketCap ?? null,
      peRatio: peRatio ?? null,
      eps: eps ?? null,
      revenue: null,
      profitMargin: null,
      week52High: week52High ?? null,
      week52Low: week52Low ?? null,
      volume: null,
      dividendYield: dividendYield ?? null,
      summary,
      rawJson: JSON.stringify({ query: `${name} ${symbol}`, results }),
    },
  });
  return snap;
}

// Public API: get a snapshot, reusing cache when fresh, refreshing when stale.
export async function getSnapshot(
  companyId: string,
  opts: { force?: boolean } = {}
): Promise<StockSnapshot & { company?: { symbol: string; name: string } | null; stale?: boolean }> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true, symbol: true, name: true },
  });
  if (!company) throw new Error("Company not found");

  const cached = await db.stockSnapshot.findFirst({
    where: { companyId },
    orderBy: { fetchedAt: "desc" },
    include: { company: { select: { symbol: true, name: true } } },
  });

  const age = cached ? Date.now() - cached.fetchedAt.getTime() : Infinity;
  if (cached && !opts.force && age < TTL_MS) {
    return { ...cached, stale: false };
  }

  // Refresh. If the refresh fails, fall back to the stale cache (if any)
  // so the UI still shows something useful with a "stale" badge.
  try {
    const fresh = await fetchSnapshot(company);
    return { ...fresh, company: { symbol: company.symbol, name: company.name }, stale: false };
  } catch (err) {
    console.error("[market] refresh failed:", (err as Error).message);
    if (cached) return { ...cached, stale: true };
    throw err;
  }
}

// Simple synthetic 90-day price series derived from the snapshot price,
// used ONLY to render an illustrative chart when no real historical OHLC
// feed is available. Clearly labelled as "illustrative" in the UI.
export function illustrativeSeries(price: number | null | undefined, days = 90) {
  if (!price || price <= 0) return [];
  const out: { date: string; close: number; synthetic: true }[] = [];
  const today = new Date();
  let p = price * 0.9; // start ~10% below current
  for (let i = days; i >= 0; i--) {
    // tiny deterministic random-walk so the chart looks plausible
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const r = (seed - Math.floor(seed) - 0.5) * 0.03;
    p = Math.max(0.01, p * (1 + r));
    if (i === 0) p = price;
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), close: +p.toFixed(2), synthetic: true });
  }
  return out;
}
