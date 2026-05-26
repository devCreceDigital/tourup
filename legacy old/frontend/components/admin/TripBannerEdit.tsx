import { Pencil, Eye, Save } from "lucide-react";

interface TripBannerEditProps {
  nombre: string;
  hint?: string;
}

export default function TripBannerEdit({ nombre, hint }: TripBannerEditProps) {
  return (
    <div className="bg-[#2D2D6E] text-white mx-3.5 mt-3.5 rounded-[8px] px-4 py-3 flex items-center justify-between gap-2 flex-wrap shrink-0">
      <div className="flex items-center gap-2">
        <Pencil className="h-[18px] w-[18px] opacity-70" />
        <div>
          <div className="text-[14px] font-bold">Editando: {nombre}</div>
          {hint ? <div className="text-[11px] opacity-65">{hint}</div> : null}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className="rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 transition inline-flex items-center gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" /> Vista previa
        </button>
        <button
          type="button"
          className="rounded-md bg-[#00C9B1] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#00A899] transition inline-flex items-center gap-1.5"
        >
          <Save className="h-3.5 w-3.5" /> Guardar
        </button>
      </div>
    </div>
  );
}
