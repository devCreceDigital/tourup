import TripBanner from "@/components/admin/TripBanner";
import ViajeTabs from "@/components/admin/ViajeTabs";
import DescripcionesSubTabs from "@/components/admin/DescripcionesSubTabs";
import { getViaje } from "@/lib/server/viaje";

export default async function DescripcionesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viaje = await getViaje(id);
  const nombre = viaje?.nombre ?? "—";
  const codigo = viaje?.codigo ?? "";

  return (
    <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)]">
      <div className="bg-white px-5 py-3 border-b border-[#E0E4EF]">
        <span className="text-[16px] font-bold text-[#1E1E4E]">Descripciones e info</span>
      </div>

      <TripBanner nombre={nombre} codigo={codigo} slug={viaje?.slug} viajeId={id} estado={viaje?.estado} />

      <ViajeTabs viajeId={id} />
      <DescripcionesSubTabs viajeId={id} />

      <div className="p-5 bg-[#EEF0F8]">{children}</div>
    </div>
  );
}
