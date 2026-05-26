import ViajeEditarFormClient from "@/contexts/platform/ui/admin/ViajeEditarFormClient";
import { getViaje } from "@/shared/server/viaje";

export default async function ViajeEditarFormCompletoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viaje = await getViaje(id);

  return (
    <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)]">
      <ViajeEditarFormClient viajeId={id} viaje={viaje} />
    </div>
  );
}
