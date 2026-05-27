"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Columns, Compass, Briefcase, Users, Map, BookOpen,
  CreditCard, UserCircle, AlertTriangle, Bot, Settings, type LucideIcon,
} from "lucide-react";
import { fetchAssistant } from "@/shared/api/assistant-api-client";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { cn } from "@/shared/utils/cn";

type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "admin";
  withBadge?: boolean;
};

const ITEMS: SidebarItem[] = [
  { href: "/admin",                    label: "Inicio",      icon: LayoutDashboard, group: "main" },
  { href: "/admin/reservas",           label: "Reservas",    icon: BookOpen,        group: "main" },
  { href: "/admin/viajes",             label: "Viajes",      icon: Compass,         group: "main" },
  { href: "/admin/operaciones",        label: "Operaciones", icon: Briefcase,       group: "main" },
  { href: "/admin/itinerarios",        label: "Itinerarios",  icon: Map,             group: "main" },
  { href: "/admin/viajeros",            label: "Viajeros",    icon: Users,           group: "main" },
  { href: "/admin/usuarios",            label: "Usuarios",    icon: UserCircle,      group: "main" },
  { href: "/admin/data",                label: "Data",        icon: UserCircle,      group: "admin" },
  { href: "/admin/pagos",              label: "Pagos",       icon: CreditCard,      group: "main" },
  { href: "/admin/asistente-ia/leads", label: "IA",          icon: Bot,             group: "main", withBadge: true },
  { href: "/admin/configuracion",      label: "Config",      icon: Settings,        group: "admin" },
  { href: "/admin/mi-pagina",           label: "Mi Página",   icon: Columns,         group: "admin" },
  { href: "/admin/seguridad",          label: "Seguridad",   icon: AlertTriangle,   group: "admin" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const mainItems = ITEMS.filter((i) => i.group === "main");
  const adminItems = ITEMS.filter((i) => i.group === "admin");

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "flex flex-col items-start bg-[#1a1a2e] py-4 gap-1 shrink-0 transition-all duration-300 overflow-hidden overflow-y-auto",
        expanded ? "w-[180px]" : "w-[68px]"
      )}
    >
      {mainItems.map((item) => (
        <SidebarLink key={item.href} item={item} pathname={pathname} expanded={expanded} />
      ))}
      <div className="mt-auto flex w-full flex-col gap-1">
        {adminItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} expanded={expanded} />
        ))}
      </div>
    </aside>
  );
}

function LeadsNewBadge() {
  const [count, setCount] = useState<number>(0);
  const poll = useCallback(async () => {
    try {
      const res = await fetchAssistant("/agency/leads/?status=new&page_size=1");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === "number") setCount(data.count);
      }
    } catch { }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void poll(), 0);
    const id = setInterval(() => void poll(), 60_000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [poll]);

  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold px-0.5 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SidebarLink({ item, pathname, expanded }: { item: SidebarItem; pathname: string; expanded: boolean }) {
  const Icon = item.icon;
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg mx-2 px-3 py-2.5 text-[11px] font-medium transition-all duration-200 whitespace-nowrap",
        expanded ? "w-[164px]" : "w-[52px]",
        isActive
          ? "bg-[#5B4FE8] text-white"
          : "text-white/40 hover:bg-[#5B4FE8]/30 hover:text-white"
      )}
    >
      <span className="relative flex-shrink-0">
        <Icon className="h-[20px] w-[20px]" />
        {item.withBadge ? <LeadsNewBadge /> : null}
      </span>
      {expanded && <span className="transition-opacity duration-200">{item.label}</span>}
    </Link>
  );
}
