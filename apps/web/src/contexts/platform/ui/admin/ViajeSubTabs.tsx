"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";

/**
 * ViajeSubTabs — Sub-pestañas dentro de Configuracion (Basico / Avanzado).
 */

interface ViajeSubTabsProps {
  viajeId: string;
}

export default function ViajeSubTabs({ viajeId }: ViajeSubTabsProps) {
  const pathname = usePathname();
  const base = `/admin/viajes/${viajeId}/editar`;

  const subtabs = [
    { href: `${base}/basico`, label: "Basico" },
    { href: `${base}/avanzado`, label: "Avanzado" },
  ];

  return (
    <div className="bg-[#F5F6FB] border-b border-[#E0E4EF] px-5 flex shrink-0">
      {subtabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "py-2 px-3.5 text-[11px] border-b-[3px] transition",
              isActive
                ? "text-[#5B5BDB] border-[#5B5BDB] font-bold"
                : "text-[#888] border-transparent hover:text-[#1E1E4E]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
