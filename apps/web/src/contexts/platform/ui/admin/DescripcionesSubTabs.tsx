
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Calendar,
  DollarSign,
  ThumbsUp,
  HelpCircle,
  Shield,
  FileStack,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

type SubTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "ficha" | "inscritos";
};

interface Props {
  viajeId: string;
}

export default function DescripcionesSubTabs({ viajeId }: Props) {
  const pathname = usePathname();
  const base = `/admin/viajes/${viajeId}/descripciones`;

  const subtabs: SubTab[] = [
    { href: `${base}/basicas`, label: "Descripciones basicas", icon: FileText, group: "ficha" },
    { href: `${base}/fechas`, label: "Fechas a recordar", icon: Calendar, group: "ficha" },
    { href: `${base}/precio`, label: "Precio y condiciones", icon: DollarSign, group: "ficha" },
    { href: `${base}/propuesta`, label: "Propuesta de valor", icon: ThumbsUp, group: "ficha" },
    { href: `${base}/faq`, label: "Preguntas frecuentes", icon: HelpCircle, group: "ficha" },
    { href: `${base}/seguridad`, label: "Seguridad", icon: Shield, group: "ficha" },
    { href: `${base}/otras`, label: "Otras descripciones", icon: FileStack, group: "ficha" },
    { href: `${base}/noticias`, label: "Noticias del viaje", icon: Newspaper, group: "inscritos" },
  ];

  const fichaTabs = subtabs.filter((t) => t.group === "ficha");
  const inscritosTabs = subtabs.filter((t) => t.group === "inscritos");

  return (
    <div className="bg-[#F5F6FB] border-b border-[#E0E4EF] px-5 py-2 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider mr-2">
          Ficha de viaje
        </span>
        {fichaTabs.map((tab) => (
          <SubTabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider mr-2">
          Info para inscritos
        </span>
        {inscritosTabs.map((tab) => (
          <SubTabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

function SubTabLink({ tab, pathname }: { tab: SubTab; pathname: string }) {
  const Icon = tab.icon;
  const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

  return (
    <Link
      href={tab.href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition",
        isActive
          ? "bg-white text-[#5B5BDB] border border-[#5B5BDB] font-bold"
          : "text-[#666] hover:bg-white hover:text-[#1E1E4E]"
      )}
    >
      <Icon className="h-3 w-3" />
      {tab.label}
    </Link>
  );
}
