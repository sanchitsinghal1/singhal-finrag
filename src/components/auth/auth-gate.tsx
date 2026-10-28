"use client";
// Auth gate — login / register card shown when the user is not signed in.
import React, { useState } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function AuthGate() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
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
        toast.success("Signed in");
      } else {
        await register(email, password, name || undefined);
        toast.success("Account created — welcome!");
      }
    } catch (err) {
      toast.error((err as Error).message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white grid place-items-center mb-3 shadow-lg shadow-emerald-600/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Stock Intelligence RAG</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Evidence-grounded equity research over your uploaded documents.
            </p>
          </div>
          <Card className="shadow-xl border-border/60">
            <CardHeader>
              <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Access your research workspace."
                  : "Start researching companies and uploading reports."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-3">
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name (optional)</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Investor" autoComplete="name" />
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
                <Button type="submit" disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700">
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
            Demo data is web-sourced and may be delayed. Not investment advice.
          </p>
        </div>
      </main>
      <footer className="border-t bg-background/80 py-4 text-center text-xs text-muted-foreground">
        Stock Intelligence RAG · Built with Next.js, Prisma &amp; grounded LLM retrieval
      </footer>
    </div>
  );
}
