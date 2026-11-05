"use client";
// Singhal FinRAG — public landing page shown to unauthenticated visitors.
// Replaces the old "straight to sign-in" experience with a proper
// marketing page: hero, features, RAG pipeline explainer, and personal
// branding for Sanchit Singhal.
import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo, BrandWordmark, BrandTile } from "@/components/brand/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  TrendingUp, FileText, MessagesSquare, Sparkles, ShieldCheck, GitCompare,
  Brain, Search, Database, ArrowRight, CheckCircle2, Quote, Star, Github, Linkedin, Twitter,
} from "lucide-react";

interface Props {
  onSignIn: () => void;   // switch the root view to the auth form
  onRegister: () => void; // switch the root view to the auth form (register mode)
}

export function LandingPage({ onSignIn, onRegister }: Props) {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ====== Nav ====== */}
      <header className={`sticky top-0 z-50 transition-all ${scrolled ? "border-b bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <BrandWordmark size="md" />
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              <a href="#why" className="text-muted-foreground hover:text-foreground transition-colors">Why FinRAG</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={onSignIn} className="hidden sm:inline-flex">Sign in</Button>
              <Button size="sm" onClick={onRegister} className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white">
                Get started <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden">
        {/* gradient + grid backdrop */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-emerald-500/5 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.12),transparent_50%),radial-gradient(circle_at_75%_30%,rgba(16,185,129,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <Badge variant="secondary" className="mb-4 gap-1.5 py-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Evidence-grounded equity research
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                Ask your financial reports.<br />
                <span className="bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                  Get cited, grounded answers.
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Singhal FinRAG is a multi-user research workspace that ingests your
                PDFs &amp; reports, chunks and embeds them, and answers your questions
                <strong className="text-foreground"> only from the retrieved text</strong> — with
                clickable citations and an honest refusal when evidence is missing.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button size="lg" onClick={onRegister} className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white">
                  Start researching free <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button size="lg" variant="outline" onClick={onSignIn}>
                  Sign in
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> No fake numbers, ever</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Per-user document isolation</span>
                <span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-emerald-600" /> Runs fully offline</span>
              </div>
            </motion.div>

            {/* Right: floating logo + mock answer card */}
            <motion.div
              initial={reduce ? {} : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="relative"
            >
              {/* Floating logo */}
              <motion.div
                animate={reduce ? {} : { y: [0, -14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 right-2 z-10 hidden sm:block"
              >
                <BrandTile size="lg" />
              </motion.div>

              {/* Mock research card */}
              <Card className="shadow-2xl shadow-emerald-600/10 border-border/60 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-600 to-emerald-600 px-4 py-3 text-white">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessagesSquare className="h-4 w-4" />
                    Sanchit&apos;s Apple research
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    &ldquo;What was Apple&apos;s FY2023 net income and operating income?&rdquo;
                  </div>
                  <div className="text-sm leading-relaxed">
                    <p className="font-medium mb-1">According to the documents:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Net income was <strong className="text-foreground">97.0 billion USD</strong> <CiteTag n={1} /></li>
                      <li>• Operating income was <strong className="text-foreground">114.3 billion USD</strong> <CiteTag n={1} /></li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t">
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">from documents</Badge>
                    <div className="mt-2 rounded-md border bg-background/60 px-2 py-1.5 text-[11px] flex gap-1.5">
                      <Quote className="h-3 w-3 mt-0.5 text-emerald-600 shrink-0" />
                      <span className="text-muted-foreground">
                        apple_10k.txt · chunk #1 · &ldquo;…operating income was 114.3 billion USD and net income was 97.0 billion…&rdquo;
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating stat chips */}
              <motion.div
                animate={reduce ? {} : { y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-2 hidden sm:flex items-center gap-2 rounded-xl border bg-background/90 backdrop-blur px-3 py-2 shadow-lg"
              >
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <div className="text-xs">
                  <div className="font-semibold">AAPL</div>
                  <div className="text-muted-foreground">$343.91</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== Features ====== */}
      <section id="features" className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow="Capabilities"
            title="Everything you need to research a company"
            subtitle="From document ingestion to cited answers — a complete, working pipeline. No mockups."
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ====== How it works (RAG pipeline) ====== */}
      <section id="how" className="py-16 sm:py-20 border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow="The pipeline"
            title="How your question becomes a cited answer"
            subtitle="A real Retrieval-Augmented Generation pipeline, built from scratch — no LangChain, no vector-DB dependency."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-4 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-sky-400/40 via-emerald-400/40 to-emerald-500/40" />
            {PIPELINE.map((step, i) => (
              <motion.div
                key={step.title}
                initial={reduce ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full text-center relative">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 via-emerald-500 to-emerald-600 grid place-items-center text-white shadow-lg shadow-emerald-600/20">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Step {i + 1}</div>
                    <h3 className="font-semibold mb-1.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    <code className="mt-3 inline-block text-[10px] rounded bg-muted px-2 py-1 text-muted-foreground">{step.file}</code>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Why FinRAG (differentiation) ====== */}
      <section id="why" className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-5xl px-4">
          <SectionHeading
            eyebrow="Why it matters"
            title="Not another chatbot calling an LLM"
            subtitle="The difference between a demo and something you'd trust with a financial decision."
          />
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            <Card className="border-red-300/40">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">Generic chatbot</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-red-500">✗</span> LLM answers from training data — possibly outdated or wrong</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> No source citations — can&apos;t verify a figure</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> Hallucinates numbers when evidence is missing</li>
                  <li className="flex gap-2"><span className="text-red-500">✗</span> One global corpus — no per-user privacy</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-emerald-400/50 bg-emerald-500/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 text-emerald-700 dark:text-emerald-400">Singhal FinRAG</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Answers only from your uploaded documents</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Every claim cites the exact chunk it came from</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Says &ldquo;I don&apos;t have enough information&rdquo; when evidence is missing</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Per-user ownership enforced at the database query layer</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 sm:py-20 border-t">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-emerald-600 to-emerald-700 p-8 sm:p-12 text-center text-white shadow-2xl shadow-emerald-600/30"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="relative">
              <BrandLogo size="lg" className="mx-auto mb-4 drop-shadow-lg" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start researching with evidence</h2>
              <p className="mt-3 text-white/80 max-w-xl mx-auto">
                Upload a report, ask a question, and watch the assistant cite its sources. Free, runs locally, no API keys required.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button size="lg" variant="secondary" onClick={onRegister} className="bg-white text-emerald-700 hover:bg-white/90">
                  Create your account <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button size="lg" variant="outline" onClick={onSignIn} className="border-white/40 text-white hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Footer with personal branding ====== */}
      <footer className="mt-auto border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <BrandWordmark size="md" />
              <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
                A multi-user, evidence-grounded equity research workspace with a from-scratch RAG pipeline.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#why" className="hover:text-foreground transition-colors">Why FinRAG</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Crafted by</h4>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-sky-500 to-emerald-600 grid place-items-center text-white font-bold text-sm shadow-md">
                  SS
                </div>
                <div>
                  <div className="font-semibold text-sm">Sanchit Singhal</div>
                  <div className="text-xs text-muted-foreground">Full-stack engineer</div>
                  <div className="flex gap-3 mt-1.5">
                    <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground"><Github className="h-3.5 w-3.5" /></a>
                    <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground"><Linkedin className="h-3.5 w-3.5" /></a>
                    <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground"><Twitter className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Singhal FinRAG. Built by Sanchit Singhal.</p>
            <p className="flex items-center gap-1.5">
              Market data is web-sourced &amp; may be delayed. Not investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ----- small helpers -----

function CiteTag({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1 py-0.5 font-medium">
      [Doc {n}]
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-2">{eyebrow}</div>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[number]; index: number }) {
  const reduce = useReducedMotion();
  const Icon = feature.icon;
  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
    >
      <Card className="h-full hover:shadow-lg hover:border-emerald-500/40 transition-all group">
        <CardContent className="pt-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-500/10 to-emerald-500/10 grid place-items-center mb-3 group-hover:from-sky-500/20 group-hover:to-emerald-500/20 transition-colors">
            <Icon className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold mb-1.5">{feature.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const FEATURES = [
  { icon: FileText, title: "Document ingestion", desc: "Upload PDF/TXT/MD reports. We extract, sentence-chunk with overlap, embed, and index — with sha256 duplicate detection." },
  { icon: MessagesSquare, title: "Cited RAG answers", desc: "Ask a question, get an answer grounded only in retrieved chunks, with clickable [Doc n] citations and source snippets." },
  { icon: TrendingUp, title: "Company intelligence", desc: "Browse 20+ tickers, view real web-sourced snapshots (price, P/E, EPS, 52w range) with refresh and stale-cache fallback." },
  { icon: Sparkles, title: "AI research briefs", desc: "Generate Bull/Bear, SWOT and equity summaries grounded in the latest market snapshot, with evidence-type tags." },
  { icon: GitCompare, title: "Side-by-side compare", desc: "Compare up to 5 companies on fundamentals in one table — fetched fresh per comparison." },
  { icon: ShieldCheck, title: "Multi-user & private", desc: "Per-user ownership enforced at the database query layer. Your documents are never in another user's retrieval." },
];

const PIPELINE = [
  { icon: FileText, title: "Ingest & chunk", desc: "Extract text, split on sentence boundaries into ~1200-char chunks with 200-char overlap for context continuity.", file: "src/lib/ingest.ts" },
  { icon: Brain, title: "Embed", desc: "Each chunk becomes a TF-IDF sparse vector — a real numeric embedding, stored as JSON, zero external dependencies.", file: "src/lib/embedding.ts" },
  { icon: Search, title: "Retrieve & answer", desc: "Cosine-similarity rank over the ownership-scoped chunks, then a grounded LLM prompt with strict citation rules.", file: "src/lib/rag.ts" },
];
