import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  List,
  Trophy,
  BarChart3,
  Plus,
  Globe,
  Menu,
  X,
  Star,
  Upload,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Inicio" },
  { href: "/directorio", icon: List, label: "Directorio" },
  { href: "/rankings", icon: Trophy, label: "Rankings" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/ingesta", icon: Upload, label: "Ingesta de Datos" },
  { href: "/operadores/nuevo", icon: Plus, label: "Agregar Operador" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-sidebar-foreground leading-none">TTDMI</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Directorio Turístico Perú</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span>Ecosistema Turístico Perú</span>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">TTDMI Perú</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md hover:bg-muted"
          data-testid="mobile-menu-toggle"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur pt-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
