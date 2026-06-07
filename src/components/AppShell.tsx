import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Camera,
  BarChart3,
  History,
  Sparkles,
  Settings,
  LogOut,
  Bell,
  Search,
  ListVideo,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/detection", label: "Live Detection", icon: Camera },
  { to: "/sessions", label: "Sessions", icon: ListVideo },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex-col hidden lg:flex">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <div className="size-8 bg-primary rounded flex items-center justify-center">
            <div className="size-4 border-2 border-white rounded-full opacity-80" />
          </div>
          <span className="font-extrabold tracking-tighter text-lg uppercase">EmotiSense</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-foreground/60 hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="size-4" /> Settings
          </Link>
          <Link
            to="/auth"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="size-4" /> Sign out
          </Link>
          <div className="mt-3 p-3 rounded-lg bg-surface border border-border flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-secondary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">EmotiSense User</p>
              <p className="text-[10px] font-mono text-foreground/40 uppercase">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div>
            <p className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">EmotiSense / {title}</p>
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-surface border border-border w-72">
              <Search className="size-4 text-foreground/40" />
              <input
                placeholder="Search emotions, sessions…"
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-foreground/40"
              />
            </div>
            <button className="size-9 rounded-lg bg-surface border border-border flex items-center justify-center relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-1.5 bg-primary rounded-full" />
            </button>
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-secondary" />
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 relative overflow-hidden">
          <div className="glow-orb absolute -top-32 -right-32 size-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="glow-orb absolute -bottom-32 -left-32 size-[400px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" style={{ animationDelay: "-4s" }} />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}