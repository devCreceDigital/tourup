import TripBanner from "@/contexts/platform/ui/admin/TripBanner";
import ViajeTabs from "@/contexts/platform/ui/admin/ViajeTabs";
import Link from "next/link";
import InscripcionesClient from "@/contexts/enrollments/ui/admin/InscripcionesClient";
import { getViaje } from "@/shared/server/viaje";

export default async function ViajeInscripcionesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viaje = await getViaje(id);
  const nombre = viaje?.nombre ?? "—";
  const codigo = viaje?.codigo ?? "";

  return (
    <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)] flex flex-col h-full min-h-[800px]">
      <div className="bg-white px-5 py-3 border-b border-[#E0E4EF]">
        <span className="text-[16px] font-bold text-[#1E1E4E]">Viajes: Inscripciones</span>
      </div>

      <TripBanner nombre={nombre} codigo={codigo} slug={viaje?.slug} viajeId={id} estado={viaje?.estado} />

      <ViajeTabs viajeId={id} />

      <div className="flex-1 bg-[#EEF0F8] flex flex-col">
        <div className="px-5 pt-4 pb-2">
          <div className="text-[12px] text-[#888] flex items-center gap-1 flex-wrap">
            <Link href="/admin/viajes" className="text-[#5B5BDB] hover:underline">Viajes</Link>
            <span className="text-[#bbb]">›</span>
            <Link href={`/admin/viajes/${id}`} className="text-[#5B5BDB] hover:underline">{nombre}</Link>
            <span className="text-[#bbb]">›</span>
            <span>Inscripciones</span>
          </div>
        </div>

        <InscripcionesClient viajeId={id} />
      </div>
    </div>
  );
}
