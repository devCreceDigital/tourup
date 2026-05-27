"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, FileText, Shield, Clock, User, Folder, ChevronDown, Map, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; };
interface ViajeTabsProps { viajeId: string; }

export default function ViajeTabs({ viajeId }: ViajeTabsProps) {
  const pathname = usePathname();
  const base = `/admin/viajes/${viajeId}`;
  const tabs: Tab[] = [
    { href: `${base}`, label: "Resumen", icon: Home },
    { href: `${base}/editar/basico`, label: "Configuracion", icon: Settings },
    { href: `${base}/descripciones`, label: "Descripciones", icon: FileText },
    { href: `${base}/itinerario`, label: "Itinerario", icon: Map },
  { href: `${base}/servicios`, label: "Servicios", icon: Shield },
    { href: `${base}/tarifas`, label: "Tarifas", icon: Clock },
    { href: `${base}/inscripciones`, label: "Inscripciones", icon: User },
    { href: `${base}/documentacion`, label: "Documentacion", icon: Folder },
  ];
  return (
    <div className="bg-white border-b border-[#e8e3f5] px-4 flex overflow-x-auto shrink-0 mt-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href}
            className={cn("px-3.5 py-2.5 text-[11px] cursor-pointer border-b-2 inline-flex items-center gap-1.5 whitespace-nowrap transition font-medium",
              isActive ? "text-[#5B4FE8] border-[#5B4FE8] font-bold" : "text-[#aaa] border-transparent hover:text-[#5B4FE8] hover:border-[#c5bff5]"
            )}>
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#5B4FE8]" : "text-[#bbb]")} />
            {tab.label}
            {tab.label ? <ChevronDown className={cn("h-3 w-3 ml-0.5", isActive ? "text-[#5B4FE8]" : "text-[#ccc]")} /> : null}
          </Link>
        );
      })}
    </div>
  );
}
