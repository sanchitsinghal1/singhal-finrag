"use client";
// Auth view — login / register card for Singhal FinRAG.
// Shown when an unauthenticated visitor clicks "Sign in" / "Get started"
// from the landing page. A "back to home" link returns to the landing view.
import React, { useState } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, ShieldCheck, Quote, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo, BrandWordmark } from "@/components/brand/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface Props {
  initialMode?: "login" | "register";
  onBackHome: () => void;
}

export function AuthView({ initialMode = "login", onBackHome }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back to Singhal FinRAG");
      } else {
        await register(email, password, name || undefined);
        toast.success("Account created — welcome to Singhal FinRAG!");
      }
    } catch (err) {
      toast.error((err as Error).message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-500/5 via-background to-emerald-500/5">
      {/* top bar */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 flex h-14 items-center justify-between">
          <button onClick={onBackHome} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          <BrandWordmark size="sm" />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left: form */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login"
                  ? "Sign in to your Singhal FinRAG workspace."
                  : "Start uploading reports and asking evidence-grounded questions."}
              </p>
            </div>

            <Card className="shadow-xl border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BrandLogo size="sm" /> {mode === "login" ? "Sign in" : "Register"}
                </CardTitle>
                <CardDescription>
                  {mode === "login" ? "Access your research workspace." : "It takes less than a minute."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-3">
                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name (optional)</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sanchit Singhal" autoComplete="name" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white">
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {mode === "login" ? "Sign in" : "Create account"}
                  </Button>
                  <div className="text-center text-sm pt-1">
                    <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-emerald-700 hover:underline dark:text-emerald-400">
                      {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
              By continuing you agree that market data is web-sourced &amp; may be delayed, and that this is not investment advice.
            </p>
          </div>
        </div>

        {/* Right: value panel (hidden on small screens) */}
        <div className="hidden lg:flex relative items-center justify-center bg-gradient-to-br from-sky-600 via-emerald-600 to-emerald-700 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_50%)]" />
          <div className="relative max-w-md text-white">
            <FloatWrap>
              <BrandLogo size="xl" className="drop-shadow-2xl" />
            </FloatWrap>
            <h2 className="mt-6 text-2xl font-bold">Evidence over invention.</h2>
            <p className="mt-2 text-white/85 leading-relaxed">
              Singhal FinRAG answers your questions only from the documents you upload —
              and tells you exactly which paragraph it used.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Cited answers with clickable sources</li>
              <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" /> Your documents stay private to you</li>
              <li className="flex items-start gap-2"><Quote className="h-4 w-4 mt-0.5 shrink-0" /> Honest refusal when evidence is missing</li>
            </ul>
            <div className="mt-8 pt-6 border-t border-white/20 text-xs text-white/70">
              Crafted by <span className="font-semibold text-white">Sanchit Singhal</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// tiny local float animation wrapper (keeps the import surface small)
import { motion, useReducedMotion } from "framer-motion";
function FloatWrap({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div animate={reduce ? {} : { y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  );
}
