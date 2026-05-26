import { Construction, type LucideIcon } from "lucide-react";

interface PlaceholderModuleProps {
  title: string;
  icon: LucideIcon;
  description: string;
  features: string[];
}

/**
 * Componente reutilizable para modulos del sidebar pendientes de implementar.
 * Muestra una card centrada con:
 *   - Icono representativo en circulo de color
 *   - Titulo del modulo + "Modulo en construccion"
 *   - Descripcion
 *   - Lista de funcionalidades futuras
 *   - Badge "Disponible proximamente"
 */
export default function PlaceholderModule({
  title,
  icon: Icon,
  description,
  features,
}: PlaceholderModuleProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)]">
      <div className="bg-white px-5 py-3 border-b border-[#E0E4EF] flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#5B5BDB]" />
        <span className="text-[16px] font-bold text-[#1E1E4E]">{title}</span>
      </div>

      <div className="p-8 bg-[#EEF0F8] min-h-[400px] flex items-center justify-center">
        <div className="bg-white rounded-[12px] border border-[#E0E4EF] p-8 max-w-md text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3E0] mb-4">
            <Construction className="h-7 w-7 text-[#E07800]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1E1E4E] mb-2">
            Modulo en construccion
          </h3>
          <p className="text-[13px] text-[#666] mb-4">{description}</p>
          <ul className="text-[12px] text-[#666] text-left space-y-1.5 mb-5">
            {features.map((feature, idx) => (
              <li key={idx}>• {feature}</li>
            ))}
          </ul>
          <div className="text-[11px] text-[#888] bg-[#F5F6FB] rounded-md px-3 py-2 inline-block">
            Disponible proximamente
          </div>
        </div>
      </div>
    </div>
  );
}
