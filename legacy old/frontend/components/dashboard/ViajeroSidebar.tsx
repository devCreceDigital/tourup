"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  FileText,
  Compass,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const ITEMS: SidebarItem[] = [
  { href: "/viajero",             label: "Inicio",     icon: Home },
  { href: "/viajero/pagos",       label: "Mis Pagos",  icon: CreditCard },
  { href: "/viajero/documentos",  label: "Documentos", icon: FileText },
  { href: "/viajero/itinerario",  label: "Itinerario", icon: Compass },
  { href: "/viajero/totem-agent", label: "Totem Agent", icon: Bot },
];

export function ViajeroSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[72px] flex-col items-center bg-[#1e1e4e] py-4 gap-1 shrink-0">
      {ITEMS.map((item) => (
        <SidebarLink key={item.href} item={item} pathname={pathname} />
      ))}
    </aside>
  );
}

function SidebarLink({
  item,
  pathname,
}: {
  item: SidebarItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive =
    item.href === "/viajero"
      ? pathname === "/viajero"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "flex w-[56px] flex-col items-center gap-1 rounded-lg p-2.5 text-center text-[9px] font-medium transition-colors",
        isActive
          ? "bg-[#00D4C8] text-[#1e1e4e]"
          : "text-[#7b8dd4] hover:bg-[#3a3aad]/50 hover:text-white",
      )}
    >
      <Icon className="h-[22px] w-[22px]" />
      <span>{item.label}</span>
    </Link>
  );
}
