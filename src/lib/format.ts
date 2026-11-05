// Client-side formatting helpers used across views.

// Format a possibly-large number into a compact human string.
// 1.2e9 -> "$1.2B"; null/undefined -> "—"
export function fmtCompact(n: number | null | undefined, currency = "USD"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const sym = currency === "INR" ? "₹" : "$";
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${sym}${abs.toFixed(2)}`;
}

// Format a price with the right currency symbol.
export function fmtPrice(n: number | null | undefined, currency = "USD"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format a percentage with sign and color class.
export function fmtPct(n: number | null | undefined): { text: string; className: string } {
  if (n === null || n === undefined || Number.isNaN(n)) return { text: "—", className: "text-muted-foreground" };
  const sign = n > 0 ? "+" : "";
  const text = `${sign}${Number(n).toFixed(2)}%`;
  const className = n > 0 ? "text-emerald-600 dark:text-emerald-400" : n < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
  return { text, className };
}

// Relative-time string ("3m ago", "2h ago", "5d ago").
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${Math.max(0, sec)}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

// Human-readable file size.
export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
