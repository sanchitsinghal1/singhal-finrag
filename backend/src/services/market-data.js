// Market data service — web-sourced market information with fault tolerance.
// Ported from src/lib/market-data.ts. Prisma -> Mongoose.
// Same 3-query fallback chain, 30-min TTL cache, stale-cache fallback,
// labelled-figure parsers with word-boundary regex + implausibility guards.
import { Company } from "../models/Company.js";
import { StockSnapshot } from "../models/StockSnapshot.js";
import { getZai } from "./zai.js";

const TTL_MS = 30 * 60 * 1000;

// Curated directory of popular tickers — auto-seeded.
export const SEED_COMPANIES = [
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

export async function seedCompanies() {
  for (const c of SEED_COMPANIES) {
    await Company.updateOne({ symbol: c.symbol }, { $setOnInsert: c }, { upsert: true });
  }
}

export async function findOrCreateCompany(symbol, name) {
  const sym = symbol.trim().toUpperCase();
  const existing = await Company.findOne({ symbol: sym });
  if (existing) return existing;
  return Company.create({ symbol: sym, name: name ?? sym, exchange: null, sector: null });
}

// ---- Targeted labelled-figure parsers (bug-driven, see docs) ----
function firstDollarAmount(s) {
  const patterns = [
    /valued at \$([\d,]+(?:\.\d+)?)/i,
    /price[:\s]+\$([\d,]+(?:\.\d+)?)/i,
    /\$([\d,]{3,}(?:\.\d+)?)/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return parseFloat(m[1].replace(/,/g, ""));
  }
  return null;
}
function parseMarketCap(s) {
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
function parsePeRatio(s) {
  const m = s.match(/p\/e\s?(?:ratio)?[^.\d]*?(\d{1,3}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}
function parseEps(s) {
  const m = s.match(/eps[^.\d$]*?\$?\s?(-?\d{1,3}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}
function parse52High(s) {
  const m = s.match(/52[\s-]?week\s?high[^.\d]*?(\d{1,4}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}
function parse52Low(s) {
  const m = s.match(/52[\s-]?week\s?low[^.\d]*?(\d{1,4}(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}
function parseDividendYield(s) {
  const m = s.match(/dividend yield[^.\d]*?(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}
function parseChangePercent(s) {
  const m =
    s.match(/\(([+-]?\d+(?:\.\d+)?)\s?%\)/i) ??
    s.match(/\bchange\b[^.\d%]*?([+-]?\d+(?:\.\d+)?)\s?%/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (Math.abs(v) > 25) return null;
  return v;
}

export async function fetchSnapshot(company) {
  const zai = await getZai();
  const symbol = company.symbol;
  const name = company.name;

  const queries = [
    `${name} (${symbol}) stock price market cap PE ratio EPS 52 week high low`,
    `${name} ${symbol} stock price today`,
    `${symbol} stock quote fundamentals`,
  ];
  let results = [];
  let lastError = null;
  for (const q of queries) {
    try {
      const r = await zai.functions.invoke("web_search", { query: q, num: 8 });
      if (Array.isArray(r) && r.length) { results = r; break; }
    } catch (err) {
      lastError = err;
    }
  }
  if (results.length === 0 && lastError) throw lastError;

  const text = (Array.isArray(results) ? results : [])
    .map((r) => `${r.name ?? ""}. ${r.snippet ?? ""}`)
    .join(" | ");

  const price = firstDollarAmount(text);
  const marketCap = parseMarketCap(text);
  const peRatio = parsePeRatio(text);
  const eps = parseEps(text);
  const week52High = parse52High(text);
  const week52Low = parse52Low(text);
  const changePercent = parseChangePercent(text);
  const dividendYield = parseDividendYield(text);

  const summary =
    Array.isArray(results) && results.length
      ? results.slice(0, 3).map((r) => r.snippet?.slice(0, 200)).filter(Boolean).join(" ")
      : "No public summary available from search results.";

  const snap = await StockSnapshot.create({
    companyId: company._id,
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
  });
  return snap;
}

export async function getSnapshot(companyId, opts = {}) {
  const company = await Company.findById(companyId);
  if (!company) throw new Error("Company not found");

  const cached = await StockSnapshot.findOne({ companyId })
    .sort({ fetchedAt: -1 })
    .populate({ path: "companyId", select: "symbol name" });

  const age = cached ? Date.now() - cached.fetchedAt.getTime() : Infinity;
  if (cached && !opts.force && age < TTL_MS) {
    return { ...cached.toObject(), stale: false, company: cached.companyId ? { symbol: cached.companyId.symbol, name: cached.companyId.name } : undefined };
  }

  try {
    const fresh = await fetchSnapshot(company);
    return { ...fresh.toObject(), company: { symbol: company.symbol, name: company.name }, stale: false };
  } catch (err) {
    console.error("[market] refresh failed:", err.message);
    if (cached) return { ...cached.toObject(), stale: true, company: cached.companyId ? { symbol: cached.companyId.symbol, name: cached.companyId.name } : undefined };
    throw err;
  }
}

// Real price history built from the append-only StockSnapshot collection.
// Every refresh appends a row, so the chart grows real data over time.
export async function getSnapshotHistory(companyId, limit = 30) {
  const rows = await StockSnapshot.find({ companyId, price: { $ne: null } })
    .sort({ fetchedAt: 1 })
    .limit(limit)
    .select("fetchedAt price");
  return rows.map((r) => ({
    date: r.fetchedAt.toISOString(),
    close: r.price,
  }));
}
