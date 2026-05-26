import TripBanner from "@/components/admin/TripBanner";
import ViajeTabs from "@/components/admin/ViajeTabs";
import ViajeSubTabs from "@/components/admin/ViajeSubTabs";
import ViajeEditarBasicoClient from "@/components/admin/ViajeEditarBasicoClient";
import { getViaje } from "@/lib/server/viaje";

export default async function ViajeEditarBasicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viaje = await getViaje(id);
  const nombre = viaje?.nombre ?? "—";
  const codigo = viaje?.codigo ?? "";

  return (
    <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)]">
      <div className="bg-white px-5 py-3 border-b border-[#E0E4EF]">
        <span className="text-[16px] font-bold text-[#1E1E4E]">Viajes: Configuracion</span>
      </div>

      <TripBanner nombre={nombre} codigo={codigo} slug={viaje?.slug} viajeId={id} estado={viaje?.estado} />
      <ViajeTabs viajeId={id} />
      <ViajeSubTabs viajeId={id} />

      <ViajeEditarBasicoClient viajeId={id} nombre={nombre} viaje={viaje} />
    </div>
  );
}
