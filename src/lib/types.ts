// Shared client-side types for API payloads.

export interface Company {
  id: string;
  symbol: string;
  name: string;
  exchange?: string | null;
  sector?: string | null;
  industry?: string | null;
  description?: string | null;
}

export interface Snapshot {
  price?: number | null;
  changePercent?: number | null;
  currency?: string | null;
  marketCap?: number | null;
  peRatio?: number | null;
  eps?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  summary?: string | null;
  source?: string | null;
  fetchedAt?: string | null;
  stale?: boolean | null;
}

export interface CompanyListEntry extends Company {
  snapshots?: { price?: number | null; changePercent?: number | null; fetchedAt?: string }[];
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  page?: number;
  snippet: string;
  score: number;
}

export interface RagResult {
  answer: string;
  citations: Citation[];
  evidenceType: "documents" | "market_data" | "both" | "none";
  retrievedCount: number;
  topScore: number;
  conversationId?: string;
  messageId?: string;
}

export interface DocumentItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: "pending" | "processing" | "ready" | "failed";
  totalPages?: number | null;
  chunkCount: number;
  charCount: number;
  errorMessage?: string | null;
  uploadedAt: string;
  processedAt?: string | null;
  company?: { id: string; symbol: string; name: string } | null;
}

export interface ConversationItem {
  id: string;
  title: string;
  companyId?: string | null;
  company?: { id: string; symbol: string; name: string } | null;
  messageCount: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  evidenceType?: string;
  createdAt: string;
}

export interface WatchlistData {
  id: string;
  name: string;
  description?: string | null;
  items: {
    id: string;
    note?: string | null;
    targetPrice?: number | null;
    addedAt: string;
    company: { id: string; symbol: string; name: string; sector?: string | null };
    snapshot?: Snapshot | null;
  }[];
}
