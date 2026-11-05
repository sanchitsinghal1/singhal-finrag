"use client";
import { jsx as jsxDEV_7x81h0kn } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Building2, FileText, MessagesSquare, Star, GitCompare, LogOut, TrendingUp } from "lucide-react";
import { DashboardView } from "@/components/views/dashboard";
import { CompaniesView } from "@/components/views/companies";
import { DocumentsView } from "@/components/views/documents";
import { ResearchView } from "@/components/views/research";
import { WatchlistsView } from "@/components/views/watchlists";
import { AnalysisView } from "@/components/views/analysis";
import { BrandWordmark, BrandLogo } from "@/components/brand/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "research", label: "Research", icon: MessagesSquare },
  { id: "watchlists", label: "Watchlists", icon: Star },
  { id: "analysis", label: "Analysis", icon: GitCompare }
];
export function AppShell() {
  const { user, logout } = useAuth();
  const [nav, setNav] = useState({ view: "dashboard" });
  const go = useCallback((next) => setNav(next), []);
  function selectTab(v) {
    setNav({ view: v });
  }
  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();
  return jsxDEV_7x81h0kn("div", {
    className: "min-h-screen flex flex-col bg-background",
    children: [
      jsxDEV_7x81h0kn("header", {
        className: "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto w-full max-w-7xl px-4",
          children: jsxDEV_7x81h0kn("div", {
            className: "flex h-14 items-center justify-between gap-4",
            children: [
              jsxDEV_7x81h0kn("button", {
                onClick: () => selectTab("dashboard"),
                className: "flex items-center gap-2 shrink-0",
                children: jsxDEV_7x81h0kn(BrandWordmark, {
                  size: "sm"
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("nav", {
                className: "flex-1 overflow-x-auto",
                "aria-label": "Main navigation",
                children: jsxDEV_7x81h0kn("ul", {
                  className: "flex items-center gap-1 justify-center min-w-max",
                  children: NAV.map((n) => {
                    const active = nav.view === n.id;
                    const Icon = n.icon;
                    return jsxDEV_7x81h0kn("li", {
                      children: jsxDEV_7x81h0kn("button", {
                        onClick: () => selectTab(n.id),
                        className: `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${active ? "bg-gradient-to-r from-sky-600 to-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`,
                        "aria-current": active ? "page" : undefined,
                        children: [
                          jsxDEV_7x81h0kn(Icon, {
                            className: "h-4 w-4"
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn("span", {
                            className: "hidden sm:inline",
                            children: n.label
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    }, n.id, false, undefined, this);
                  })
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this),
              jsxDEV_7x81h0kn("div", {
                className: "flex items-center gap-1",
                children: [
                  jsxDEV_7x81h0kn(ThemeToggle, {}, undefined, false, undefined, this),
                  jsxDEV_7x81h0kn(DropdownMenu, {
                    children: [
                      jsxDEV_7x81h0kn(DropdownMenuTrigger, {
                        asChild: true,
                        children: jsxDEV_7x81h0kn("button", {
                          className: "flex items-center gap-2 rounded-full hover:bg-muted p-0.5 pr-2 transition-colors",
                          children: [
                            jsxDEV_7x81h0kn(Avatar, {
                              className: "h-8 w-8",
                              children: jsxDEV_7x81h0kn(AvatarFallback, {
                                className: "bg-gradient-to-br from-sky-500 to-emerald-600 text-white text-xs font-semibold",
                                children: initials
                              }, undefined, false, undefined, this)
                            }, undefined, false, undefined, this),
                            jsxDEV_7x81h0kn("span", {
                              className: "text-sm hidden md:inline max-w-[140px] truncate",
                              children: user?.name || user?.email
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this)
                      }, undefined, false, undefined, this),
                      jsxDEV_7x81h0kn(DropdownMenuContent, {
                        align: "end",
                        className: "w-56",
                        children: [
                          jsxDEV_7x81h0kn(DropdownMenuLabel, {
                            className: "font-normal",
                            children: jsxDEV_7x81h0kn("div", {
                              className: "flex flex-col space-y-0.5",
                              children: [
                                jsxDEV_7x81h0kn("p", {
                                  className: "text-sm font-medium",
                                  children: user?.name || "User"
                                }, undefined, false, undefined, this),
                                jsxDEV_7x81h0kn("p", {
                                  className: "text-xs text-muted-foreground truncate",
                                  children: user?.email
                                }, undefined, false, undefined, this)
                              ]
                            }, undefined, true, undefined, this)
                          }, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(DropdownMenuSeparator, {}, undefined, false, undefined, this),
                          jsxDEV_7x81h0kn(DropdownMenuItem, {
                            onClick: () => logout(),
                            className: "text-red-600 focus:text-red-700",
                            children: [
                              jsxDEV_7x81h0kn(LogOut, {
                                className: "h-4 w-4 mr-2"
                              }, undefined, false, undefined, this),
                              "Sign out"
                            ]
                          }, undefined, true, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      jsxDEV_7x81h0kn("main", {
        className: "flex-1 mx-auto w-full max-w-7xl px-4 py-6",
        children: [
          nav.view === "dashboard" && jsxDEV_7x81h0kn(DashboardView, {
            go
          }, undefined, false, undefined, this),
          nav.view === "companies" && jsxDEV_7x81h0kn(CompaniesView, {
            go,
            nav
          }, undefined, false, undefined, this),
          nav.view === "documents" && jsxDEV_7x81h0kn(DocumentsView, {
            go,
            nav
          }, undefined, false, undefined, this),
          nav.view === "research" && jsxDEV_7x81h0kn(ResearchView, {
            go,
            initialConversationId: nav.conversationId
          }, undefined, false, undefined, this),
          nav.view === "watchlists" && jsxDEV_7x81h0kn(WatchlistsView, {
            go
          }, undefined, false, undefined, this),
          nav.view === "analysis" && jsxDEV_7x81h0kn(AnalysisView, {
            go
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      jsxDEV_7x81h0kn("footer", {
        className: "border-t bg-muted/20 mt-auto",
        children: jsxDEV_7x81h0kn("div", {
          className: "mx-auto w-full max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground",
          children: [
            jsxDEV_7x81h0kn("p", {
              className: "flex items-center gap-1.5",
              children: [
                jsxDEV_7x81h0kn(BrandLogo, {
                  size: "sm",
                  className: "h-4 w-4"
                }, undefined, false, undefined, this),
                "Singhal FinRAG · crafted by ",
                jsxDEV_7x81h0kn("span", {
                  className: "font-medium text-foreground",
                  children: "Sanchit Singhal"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            jsxDEV_7x81h0kn("p", {
              children: "Market data is web-sourced & may be delayed. Not investment advice."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
