"use client";
// App shell — header nav, view switcher, sticky footer. Holds the
// simple in-app navigation state (we only expose the "/" route).
import React, { useState, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Building2, FileText, MessagesSquare, Star, GitCompare, LogOut, TrendingUp, User as UserIcon } from "lucide-react";
import { DashboardView } from "@/components/views/dashboard";
import { CompaniesView } from "@/components/views/companies";
import { DocumentsView } from "@/components/views/documents";
import { ResearchView } from "@/components/views/research";
import { WatchlistsView } from "@/components/views/watchlists";
import { AnalysisView } from "@/components/views/analysis";

type View = "dashboard" | "companies" | "documents" | "research" | "watchlists" | "analysis";

interface NavState {
  view: View;
  // optional context payloads for detail screens
  companyId?: string;
  companySymbol?: string;
  documentId?: string;
  conversationId?: string;
}

const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "research", label: "Research", icon: MessagesSquare },
  { id: "watchlists", label: "Watchlists", icon: Star },
  { id: "analysis", label: "Analysis", icon: GitCompare },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const [nav, setNav] = useState<NavState>({ view: "dashboard" });

  const go = useCallback((next: NavState) => setNav(next), []);

  function selectTab(v: View) {
    setNav({ view: v });
  }

  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            <button onClick={() => selectTab("dashboard")} className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white grid place-items-center shadow-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="font-semibold tracking-tight hidden sm:inline">Stock Intelligence</span>
            </button>

            {/* Tab nav */}
            <nav className="flex-1 overflow-x-auto" aria-label="Main navigation">
              <ul className="flex items-center gap-1 justify-center min-w-max">
                {NAV.map((n) => {
                  const active = nav.view === n.id;
                  const Icon = n.icon;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => selectTab(n.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{n.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-muted p-0.5 pr-2 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden md:inline max-w-[140px] truncate">{user?.name || user?.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        {nav.view === "dashboard" && <DashboardView go={go} />}
        {nav.view === "companies" && <CompaniesView go={go} nav={nav} />}
        {nav.view === "documents" && <DocumentsView go={go} nav={nav} />}
        {nav.view === "research" && <ResearchView go={go} initialConversationId={nav.conversationId} />}
        {nav.view === "watchlists" && <WatchlistsView go={go} />}
        {nav.view === "analysis" && <AnalysisView go={go} />}
      </main>

      {/* Sticky footer */}
      <footer className="border-t bg-background/80 mt-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            Stock Intelligence RAG · Evidence-grounded research
          </p>
          <p>Market data is web-sourced &amp; may be delayed. Not investment advice.</p>
        </div>
      </footer>
    </div>
  );
}

export type { View, NavState };
